-- Individual per-purchase worlds, private to the purchasing family.
-- Each successful order already provisions its own unique worlds.id.
alter table public.worlds
  add column if not exists theme text not null default 'forest',
  add column if not exists greeting text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.world_children (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 40),
  created_at timestamptz not null default now()
);
create index if not exists world_children_world_idx on public.world_children(world_id);
alter table public.world_children enable row level security;
create policy "Owner reads children" on public.world_children for select to authenticated
 using(exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=world_children.world_id and f.owner_id=(select auth.uid())));
create policy "Owner adds children" on public.world_children for insert to authenticated
 with check(exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 join public.orders o on o.id=w.order_id
 where w.id=world_children.world_id and f.owner_id=(select auth.uid())
 and o.status='paid' and o.product_id='ultimate'));
create policy "Owner removes children" on public.world_children for delete to authenticated
 using(exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=world_children.world_id and f.owner_id=(select auth.uid())));

create or replace function public.my_worlds()
returns table (
 world_id uuid, elf_name text, theme text, greeting text,
 package text, paid_at timestamptz
)
language sql stable security invoker
set search_path=''
as $$
 select w.id,w.elf_name,w.theme,w.greeting,o.product_id,o.paid_at
 from public.worlds w
 join public.families f on f.id=w.family_id
 join public.orders o on o.id=w.order_id
 where f.owner_id=(select auth.uid()) and o.status='paid'
 order by o.paid_at desc
$$;
grant execute on function public.my_worlds() to authenticated;
