-- Secure per-world user progress and missions. Run after initial and personal-world migrations.
create table if not exists public.world_missions (
 world_id uuid not null references public.worlds(id) on delete cascade,
 mission_id integer not null check (mission_id between 0 and 5),
 completed_at timestamptz not null default now(),
 primary key(world_id,mission_id)
);
alter table public.world_missions enable row level security;
create policy "Read own missions" on public.world_missions for select to authenticated
 using (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=world_missions.world_id and f.owner_id=(select auth.uid())));
create policy "Complete own missions" on public.world_missions for insert to authenticated
 with check (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=world_missions.world_id and f.owner_id=(select auth.uid())));
create policy "Read own episode progress" on public.episode_progress for select to authenticated
 using (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=episode_progress.world_id and f.owner_id=(select auth.uid())));
create policy "Write own episode progress" on public.episode_progress for insert to authenticated
 with check (exists(select 1 from public.worlds w join public.families f on f.id=w.family_id
 where w.id=episode_progress.world_id and f.owner_id=(select auth.uid())));
-- Avoid exposing unpublished episodes: clients fetch only published content.
-- Message inserts are already restricted to the family owner in initial migration.
