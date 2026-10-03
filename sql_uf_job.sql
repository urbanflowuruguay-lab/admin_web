-- UF Job: currículums digitales, búsqueda de personal y empresas verificadas.
-- Ejecutar una vez en el SQL Editor del dashboard de Supabase.

-- ---------------------------------------------------------------------------
-- 1. Admins
-- ---------------------------------------------------------------------------
create table if not exists public.uf_job_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.uf_job_admins enable row level security;

drop policy if exists "admin_read" on public.uf_job_admins;
create policy "admin_read" on public.uf_job_admins
  for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

create or replace function public.uf_job_es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or exists (
           select 1 from public.uf_job_admins
           where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         );
$$;
-- El panel admin web usa la service_role, cuyo JWT no trae "email".
-- Sin la primera línea, el trigger uf_job_empresa_guarda revertía
-- cada Aprobar/Rechazar de empresa hecho desde admin/uf_job.html.

-- Cambiá este mail por el tuyo (o agregá más con inserts):
insert into public.uf_job_admins (email) values ('tu@email.com')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Padrón de empresas (datos abiertos DGI / Directorio de Empresas
--    Industriales del MIEM, subido con tool/cargar_padron_dei.dart)
-- ---------------------------------------------------------------------------
create table if not exists public.empresas_registry (
  rut text primary key,
  razon_social text not null default '',
  nombre_comercial text not null default '',
  estado text not null default '',
  ciiu text not null default '',
  departamento text not null default '',
  direccion text not null default '',
  telefono text not null default '',
  email text not null default '',
  fuente text not null default 'DEI-MIEM',
  loaded_at timestamptz not null default now()
);

alter table public.empresas_registry enable row level security;

drop policy if exists "registry_read" on public.empresas_registry;
create policy "registry_read" on public.empresas_registry
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- 3. Empresas (usuarios que quieren buscar personal)
-- ---------------------------------------------------------------------------
create table if not exists public.empresas_job (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  rut text not null default '',
  razon_social text not null default '',
  rubro text not null default '',
  contacto text not null default '',
  telefono text not null default '',
  email text not null default '',
  departamento text not null default '',
  constancia_url text not null default '',
  status text not null default 'pendiente', -- pendiente|aprobado|rechazado
  verificado_auto boolean not null default false,
  motivo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists empresas_job_status_idx
  on public.empresas_job (status);

alter table public.empresas_job enable row level security;

drop policy if exists "empresa_own_read" on public.empresas_job;
drop policy if exists "empresa_own_insert" on public.empresas_job;
drop policy if exists "empresa_own_update" on public.empresas_job;

create policy "empresa_own_read" on public.empresas_job
  for select using (auth.uid() = user_id or public.uf_job_es_admin());

create policy "empresa_own_insert" on public.empresas_job
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "empresa_own_update" on public.empresas_job
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "empresa_admin_update" on public.empresas_job
  for update to authenticated
  using (public.uf_job_es_admin())
  with check (public.uf_job_es_admin());

-- Nadie se aprueba a sí mismo: lo hace el admin, o cae aprobado si el RUT
-- está activo en el padrón de empresas del MIEM.
create or replace function public.uf_job_empresa_guarda()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'pendiente';
    new.verificado_auto := false;
  elsif new.status is distinct from old.status
        and not public.uf_job_es_admin() then
    new.status := old.status;
    new.verificado_auto := old.verificado_auto;
  end if;

  if new.status = 'pendiente' then
    if exists (
      select 1 from public.empresas_registry r
      where replace(r.rut, '.', '') = replace(new.rut, '.', '')
        and (
          upper(r.estado) like '%ACTIVA%'
          or upper(r.estado) like '%VIGENTE%'
        )
    ) then
      new.status := 'aprobado';
      new.verificado_auto := true;
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists uf_job_empresa_guarda on public.empresas_job;
create trigger uf_job_empresa_guarda
  before insert or update on public.empresas_job
  for each row execute function public.uf_job_empresa_guarda();

-- ---------------------------------------------------------------------------
-- 4. Currículums
-- ---------------------------------------------------------------------------
create table if not exists public.curriculums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null default '',
  puesto text not null default '',
  foto_path text not null default '',
  area text not null default '',
  datos jsonb not null default '{}'::jsonb,
  sexo text not null default '',
  edad int not null default 0,
  departamento text not null default '',
  estudios text not null default '',
  idiomas text not null default '',
  disponibilidad text not null default '',
  tipo_contrato text not null default '',
  salario numeric,
  activo boolean not null default true,
  status text not null default 'aprobado',
  motivo_rechazo text,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curriculums_empresa_idx
  on public.curriculums (activo, status, created_at desc);

create index if not exists curriculums_user_idx
  on public.curriculums (user_id);

create index if not exists curriculums_datos_idx
  on public.curriculums using gin (datos);

alter table public.curriculums enable row level security;

drop policy if exists "cv_own_read" on public.curriculums;
drop policy if exists "cv_own_insert" on public.curriculums;
drop policy if exists "cv_own_update" on public.curriculums;
drop policy if exists "cv_own_delete" on public.curriculums;
drop policy if exists "cv_empresa_read" on public.curriculums;

create policy "cv_own_read" on public.curriculums
  for select using (auth.uid() = user_id or public.uf_job_es_admin());

create policy "cv_own_insert" on public.curriculums
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "cv_own_update" on public.curriculums
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cv_own_delete" on public.curriculums
  for delete to authenticated
  using (auth.uid() = user_id);

-- Los CV públicos sólo los ven empresas aprobadas.
create policy "cv_empresa_read" on public.curriculums
  for select to authenticated
  using (
    activo = true
    and status = 'aprobado'
    and exists (
      select 1 from public.empresas_job e
      where e.user_id = auth.uid()
        and e.status = 'aprobado'
    )
  );

-- Moderación previa de CV (opcional). Por defecto el CV nace aprobado y
-- se publica solo. Si querés que un admin lo apruebe antes de que lo vean
-- las empresas, descomentar el bloque siguiente y volver a correr este SQL:
--
-- alter table public.curriculums alter column status set default 'pendiente';
--
-- create or replace function public.curriculums_bloquear_moderacion()
-- returns trigger
-- language plpgsql security definer set search_path = public
-- as $$
-- begin
--   if tg_op = 'INSERT' then
--     new.status := 'pendiente';
--     new.moderated_at := null;
--   elsif new.status is distinct from old.status
--         and not public.uf_job_es_admin() then
--     new.status := old.status;
--     new.motivo_rechazo := old.motivo_rechazo;
--     new.moderated_at := old.moderated_at;
--   end if;
--   return new;
-- end $$;
--
-- drop trigger if exists trg_curriculums_moderacion on public.curriculums;
-- create trigger trg_curriculums_moderacion
--   before insert or update on public.curriculums
--   for each row execute function public.curriculums_bloquear_moderacion();
--
-- -- y la app tendría que dejar de mandar status: 'aprobado' en el alta
-- -- (lib/screens/uf_job/cv_editor_screen.dart).

-- ---------------------------------------------------------------------------
-- 5. Desbloqueo mutuo de datos de contacto
-- ---------------------------------------------------------------------------
create table if not exists public.job_consents (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curriculums(id) on delete cascade,
  empresa_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendiente', -- pendiente|aprobado|rechazado
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (curriculum_id, empresa_user_id)
);

create index if not exists job_consents_cv_idx
  on public.job_consents (curriculum_id, status);

alter table public.job_consents enable row level security;

drop policy if exists "consent_empresa_insert" on public.job_consents;
drop policy if exists "consent_read" on public.job_consents;
drop policy if exists "consent_postulante_update" on public.job_consents;
drop policy if exists "consent_empresa_update" on public.job_consents;
drop policy if exists "consent_delete" on public.job_consents;

create policy "consent_empresa_insert" on public.job_consents
  for insert to authenticated
  with check (
    auth.uid() = empresa_user_id
    and exists (
      select 1 from public.empresas_job e
      where e.user_id = auth.uid()
        and e.status = 'aprobado'
    )
    and exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
        and c.activo = true
        and c.status = 'aprobado'
    )
  );

create policy "consent_read" on public.job_consents
  for select to authenticated
  using (
    empresa_user_id = auth.uid()
    or exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
        and c.user_id = auth.uid()
    )
    or public.uf_job_es_admin()
  );

create policy "consent_postulante_update" on public.job_consents
  for update to authenticated
  using (
    status = 'pendiente'
    and exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
        and c.user_id = auth.uid()
    )
  );

create policy "consent_empresa_update" on public.job_consents
  for update to authenticated
  using (empresa_user_id = auth.uid())
  with check (empresa_user_id = auth.uid());

create policy "consent_delete" on public.job_consents
  for delete to authenticated
  using (
    empresa_user_id = auth.uid()
    or exists (
      select 1 from public.curriculums c
      where c.id = curriculum_id
        and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Datos sensibles del CV (CI, teléfono, email, dirección)
--    Sólo los ve el propio postulante o una empresa con consentimiento.
-- ---------------------------------------------------------------------------
create table if not exists public.curriculums_sensibles (
  curriculum_id uuid primary key references public.curriculums(id) on delete cascade,
  ci text not null default '',
  telefono text not null default '',
  email text not null default '',
  direccion text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.curriculums_sensibles enable row level security;

drop policy if exists "sens_own_read" on public.curriculums_sensibles;
drop policy if exists "sens_own_write" on public.curriculums_sensibles;
drop policy if exists "sens_empresa_read" on public.curriculums_sensibles;
drop policy if exists "sens_admin_read" on public.curriculums_sensibles;

create policy "sens_own_read" on public.curriculums_sensibles
  for select using (
    exists (
      select 1 from public.curriculums c
      where c.id = curriculums_sensibles.curriculum_id
        and c.user_id = auth.uid()
    )
  );

create policy "sens_own_write" on public.curriculums_sensibles
  for insert to authenticated
  with check (
    exists (
      select 1 from public.curriculums c
      where c.id = curriculums_sensibles.curriculum_id
        and c.user_id = auth.uid()
    )
  );

create policy "sens_empresa_read" on public.curriculums_sensibles
  for select to authenticated
  using (
    exists (
      select 1 from public.job_consents k
      where k.curriculum_id = curriculums_sensibles.curriculum_id
        and k.empresa_user_id = auth.uid()
        and k.status = 'aprobado'
    )
    and exists (
      select 1 from public.empresas_job e
      where e.user_id = auth.uid()
        and e.status = 'aprobado'
    )
  );

create policy "sens_admin_read" on public.curriculums_sensibles
  for select to authenticated
  using (public.uf_job_es_admin());

-- ---------------------------------------------------------------------------
-- 7. Contacto de la empresa (visible para sí misma, el admin y los
--    postulantes que aprobaron un consentimiento).
-- ---------------------------------------------------------------------------
create table if not exists public.empresas_contacto (
  empresa_user_id uuid primary key references auth.users(id) on delete cascade,
  razon_social text not null default '',
  rubro text not null default '',
  contacto text not null default '',
  telefono text not null default '',
  email text not null default '',
  departamento text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.empresas_contacto enable row level security;

drop policy if exists "contacto_own" on public.empresas_contacto;
drop policy if exists "contacto_consent" on public.empresas_contacto;

create policy "contacto_own" on public.empresas_contacto
  for select using (auth.uid() = empresa_user_id or public.uf_job_es_admin());

create policy "contacto_consent" on public.empresas_contacto
  for select to authenticated
  using (
    exists (
      select 1 from public.job_consents k
      join public.curriculums cv on cv.id = k.curriculum_id
      where k.empresa_user_id = empresas_contacto.empresa_user_id
        and k.status = 'aprobado'
        and cv.user_id = auth.uid()
    )
  );

create or replace function public.uf_job_contacto_sync()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.empresas_contacto (
    empresa_user_id, razon_social, rubro, contacto,
    telefono, email, departamento, updated_at
  ) values (
    new.user_id, new.razon_social, new.rubro, new.contacto,
    new.telefono, new.email, new.departamento, now()
  )
  on conflict (empresa_user_id) do update set
    razon_social = excluded.razon_social,
    rubro = excluded.rubro,
    contacto = excluded.contacto,
    telefono = excluded.telefono,
    email = excluded.email,
    departamento = excluded.departamento,
    updated_at = now();

  insert into public.empresas_solicitantes (
    empresa_user_id, razon_social, rubro, departamento, updated_at
  ) values (
    new.user_id, new.razon_social, new.rubro, new.departamento, now()
  )
  on conflict (empresa_user_id) do update set
    razon_social = excluded.razon_social,
    rubro = excluded.rubro,
    departamento = excluded.departamento,
    updated_at = now();
  return new;
end $$;

drop trigger if exists uf_job_contacto_sync on public.empresas_job;
create trigger uf_job_contacto_sync
  after insert or update on public.empresas_job
  for each row execute function public.uf_job_contacto_sync();

-- Nombre visible de la empresa para el postulante (sin datos sensibles).
create table if not exists public.empresas_solicitantes (
  empresa_user_id uuid primary key references auth.users(id) on delete cascade,
  razon_social text not null default '',
  rubro text not null default '',
  departamento text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.empresas_solicitantes enable row level security;

drop policy if exists "solicitante_own" on public.empresas_solicitantes;
drop policy if exists "solicitante_postulante" on public.empresas_solicitantes;

create policy "solicitante_own" on public.empresas_solicitantes
  for select using (auth.uid() = empresa_user_id or public.uf_job_es_admin());

create policy "solicitante_postulante" on public.empresas_solicitantes
  for select to authenticated
  using (
    exists (
      select 1 from public.job_consents k
      join public.curriculums cv on cv.id = k.curriculum_id
      where k.empresa_user_id = empresas_solicitantes.empresa_user_id
        and cv.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------------
-- 8. Bucket de fotos (selfie del CV): privado, se leen con URLs firmadas.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('uf_job', 'uf_job', false)
on conflict (id) do nothing;

drop policy if exists "uf_job_auth_insert" on storage.objects;
drop policy if exists "uf_job_auth_delete" on storage.objects;
drop policy if exists "uf_job_auth_read" on storage.objects;

create policy "uf_job_auth_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uf_job');

create policy "uf_job_auth_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'uf_job' and owner = auth.uid());

create policy "uf_job_auth_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'uf_job');

-- ---------------------------------------------------------------------------
-- 9. Botón del home: "UF Job".
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.home_botones') is not null then
    if not exists (select 1 from public.home_botones where key = 'job') then
      insert into public.home_botones (key, visible) values ('job', true);
    end if;
  end if;
end $$;
