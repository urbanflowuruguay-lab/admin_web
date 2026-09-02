alter table public.bus_stops add column if not exists cod_ubic_p bigint;
create index if not exists idx_bus_stops_cod on public.bus_stops (cod_ubic_p);
update public.bus_stops set cod_ubic_p = id where cod_ubic_p is null;
