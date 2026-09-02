-- sql_create_bus_stops.sql — Paradas de bus (importadas de IMM + edición manual)
create table if not exists public.bus_stops (
  id bigserial primary key,
  name text not null,
  lat double precision not null,
  lon double precision not null,
  lines text[] default '{}',
  geom geography(Point,4326),
  source text default 'manual', -- 'imm' | 'overpass' | 'manual'
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
create index if not exists idx_bus_stops_geom on public.bus_stops using gist (geom);
create index if not exists idx_bus_stops_active on public.bus_stops (active);
create index if not exists idx_bus_stops_lines on public.bus_stops using gin (lines);

-- Trigger para mantener geom actualizado
create or replace function public.set_bus_stop_geom() returns trigger as $$
begin
  new.geom := st_setsrid(st_makepoint(new.lon, new.lat), 4326)::geography;
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_bus_stops_geom on public.bus_stops;
create trigger trg_bus_stops_geom before insert or update of lat, lon on public.bus_stops
for each row execute function public.set_bus_stop_geom();

-- RPC para 3 paradas más cercanas (sin depender de Overpass)
create or replace function public.nearest_bus_stops(user_lon double precision, user_lat double precision, limit_count int default 3)
returns setof public.bus_stops language sql stable as $$
  select * from public.bus_stops
  where active = true
  order by geom <-> st_setsrid(st_makepoint(user_lon, user_lat),4326)::geography
  limit limit_count;
$$;

-- RLS (permitir lectura pública, escritura solo autenticado — ajusta según tu política)
alter table public.bus_stops enable row level security;
drop policy if exists "bus_stops read all" on public.bus_stops;
create policy "bus_stops read all" on public.bus_stops for select using (true);
drop policy if exists "bus_stops write auth" on public.bus_stops;
create policy "bus_stops write auth" on public.bus_stops for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
