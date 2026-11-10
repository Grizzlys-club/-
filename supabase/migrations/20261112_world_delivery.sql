-- Private, unguessable invitation tokens. Apply after earlier migrations.
create table if not exists public.world_invitations (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null unique references public.worlds(id) on delete cascade,
  token_hash text not null unique,
  email text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.world_invitations enable row level security;
-- No client-side policies: access only from trusted server.
create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check(kind in ('welcome','reminder')),
  status text not null default 'pending' check(status in ('pending','sent','failed')),
  provider_message_id text,
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id,kind)
);
alter table public.email_deliveries enable row level security;
-- Store SHA-256 hash of invitation token, never plaintext. Raw token must be
-- delivered via email and cannot be recovered from the database.
