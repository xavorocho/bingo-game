create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_token uuid not null,
  called_numbers integer[] not null default '{}',
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

-- Juego casual para amigos vía link privado (sin login de usuarios): se permite
-- lectura y actualización públicas con la anon key. Riesgo aceptado para v1 (ver plan).
create policy "rooms are publicly readable"
  on public.rooms for select
  using (true);

create policy "rooms are publicly insertable"
  on public.rooms for insert
  with check (true);

create policy "rooms are publicly updatable"
  on public.rooms for update
  using (true)
  with check (true);
