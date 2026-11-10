-- WichtelZauber production foundation for Supabase/PostgreSQL
-- Apply in a controlled Supabase migration. Never put service-role keys in frontend.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key check (id in ('basic','magic','ultimate')),
  title text not null,
  price_rappen integer not null check (price_rappen >= 0),
  currency text not null default 'CHF' check (currency = 'CHF'),
  active boolean not null default true
);
insert into public.products(id,title,price_rappen) values
('basic','Basic',1490),('magic','Magic',2990),('ultimate','Ultimate',4990)
on conflict (id) do update set title=excluded.title,price_rappen=excluded.price_rappen;

create table if not exists public.families (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index if not exists families_owner_idx on public.families(owner_id);

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.products(id),
 amount_rappen integer not null check (amount_rappen >= 0),
 currency text not null default 'CHF' check (currency='CHF'),
 status text not null default 'pending' check(status in ('pending','paid','cancelled','refunded')),
 provider text,
 provider_session_id text unique,
 created_at timestamptz not null default now(),
 paid_at timestamptz
);
create index if not exists orders_owner_idx on public.orders(owner_id);

create table if not exists public.worlds (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 order_id uuid not null unique references public.orders(id),
 elf_name text not null check(char_length(elf_name) between 1 and 40),
 elf_style text not null default 'forest',
 house_style text not null default 'snow',
 created_at timestamptz not null default now()
);
create index if not exists worlds_family_idx on public.worlds(family_id);

create table if not exists public.episodes (
 day integer primary key check(day between 1 and 24),
 title text not null,
 story text not null,
 video_asset_key text,
 published boolean not null default false
);

create table if not exists public.episode_progress (
 world_id uuid not null references public.worlds(id) on delete cascade,
 day integer not null references public.episodes(day),
 completed_at timestamptz not null default now(),
 primary key(world_id,day)
);

create table if not exists public.wichtel_messages (
 id uuid primary key default gen_random_uuid(),
 world_id uuid not null references public.worlds(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 2000),
 created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.families enable row level security;
alter table public.orders enable row level security;
alter table public.worlds enable row level security;
alter table public.episodes enable row level security;
alter table public.episode_progress enable row level security;
alter table public.wichtel_messages enable row level security;

create policy "Anyone can view active products" on public.products for select using (active);
create policy "Owner reads families" on public.families for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owner creates families" on public.families for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owner reads orders" on public.orders for select to authenticated using (owner_id = (select auth.uid()));
-- Orders must only be created/paid by trusted server endpoints, not browser clients.
create policy "Owner reads worlds" on public.worlds for select to authenticated
 using (exists(select 1 from public.families f where f.id=worlds.family_id and f.owner_id=(select auth.uid())));
create policy "Owner reads published episodes" on public.episodes for select to authenticated using (published);
create policy "Owner reads progress" on public.episode_progress for select to authenticated
 using (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id where w.id=episode_progress.world_id and f.owner_id=(select auth.uid())));
create policy "Owner reads messages" on public.wichtel_messages for select to authenticated
 using (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id where w.id=wichtel_messages.world_id and f.owner_id=(select auth.uid())));
create policy "Owner creates messages" on public.wichtel_messages for insert to authenticated
 with check (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id where w.id=wichtel_messages.world_id and f.owner_id=(select auth.uid())));
-- No browser-side insert/update/delete rights for paid orders, worlds, or progress.
-- Payment webhooks must validate signatures, amounts, currency and provider session IDs
-- and provision exactly once in a transaction on the trusted server.
