-- =====================================================
-- AgroFletes SaaS — Supabase Schema
-- Run this in the Supabase SQL editor to set up tables
-- =====================================================

-- ── Perfiles (extends auth.users) ──────────────────
create table if not exists perfiles (
  id uuid references auth.users on delete cascade primary key,
  empresa_nombre text default 'Mi Empresa',
  empresa_cuit   text,
  empresa_ciudad text,
  plan           text default 'Free',
  created_at     timestamptz default now()
);

-- Auto-create perfil on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into perfiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Clientes ────────────────────────────────────────
create table if not exists clientes (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  razon      text not null,
  alias      text not null,
  cuit       text,
  tel        text,
  localidad  text,
  activo     boolean default true,
  rubro      text,
  created_at timestamptz default now()
);

-- ── Camiones ────────────────────────────────────────
create table if not exists camiones (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users on delete cascade not null,
  patente         text not null,
  tipo            text not null,
  marca           text,
  modelo          text,
  anio            integer,
  chofer          text,
  activo          boolean default true,
  peso_max_ton    numeric(8,2),
  volumen_m3      numeric(8,2),
  grain_cert      text default 'none',
  has_gps         boolean default false,
  km_acumulados   numeric(10,0) default 0,
  created_at      timestamptz default now()
);

-- Migración: agregar columnas si la tabla ya existe sin ellas
alter table camiones add column if not exists peso_max_ton  numeric(8,2);
alter table camiones add column if not exists volumen_m3    numeric(8,2);
alter table camiones add column if not exists grain_cert    text default 'none';
alter table camiones add column if not exists has_gps       boolean default false;
alter table camiones add column if not exists km_acumulados numeric(10,0) default 0;

-- ── Viajes ──────────────────────────────────────────
create table if not exists viajes (
  id              uuid default gen_random_uuid() primary key,
  numero          bigint generated always as identity,
  user_id         uuid references auth.users on delete cascade not null,
  fecha           date not null,
  fecha_lleg      date,
  cliente_id      uuid references clientes(id) on delete set null,
  origen          text not null,
  destino         text not null,
  km              integer,
  camion_id       uuid references camiones(id) on delete set null,
  tipo_carga_id   text,
  tipo_carga_label text,
  toneladas       numeric(10,2),
  monto           numeric(12,2),
  estado          text default 'BORRADOR'
                    check (estado in ('BORRADOR','EN_TRANSITO','ENTREGADO','LIQUIDADO','CANCELADO')),
  docs            text[] default '{}',
  notas           text,
  created_at      timestamptz default now()
);

-- ── Row Level Security ──────────────────────────────
alter table perfiles enable row level security;
alter table clientes  enable row level security;
alter table camiones  enable row level security;
alter table viajes    enable row level security;

-- Drop existing policies to avoid conflicts on re-run
drop policy if exists "perfiles_own"   on perfiles;
drop policy if exists "clientes_own"   on clientes;
drop policy if exists "camiones_own"   on camiones;
drop policy if exists "viajes_own"     on viajes;

create policy "perfiles_own" on perfiles for all using (auth.uid() = id);
create policy "clientes_own" on clientes for all using (auth.uid() = user_id);
create policy "camiones_own" on camiones for all using (auth.uid() = user_id);
create policy "viajes_own"   on viajes   for all using (auth.uid() = user_id);

-- ── Camion choferes ─────────────────────────────────────────
create table if not exists camion_choferes (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users on delete cascade not null,
  camion_id           uuid references camiones(id) on delete cascade not null,
  nombre              text not null,
  dni                 text,
  fecha_nac           date,
  iniciales           text,
  tel                 text,
  email               text,
  direccion           text,
  lic_cat             text,
  lic_numero          text,
  lic_venc            date,
  psicofisico_venc    date,
  libreta_sanidad_venc date,
  antiguedad          text,
  viajes_realizados   integer default 0,
  km_conducidos       integer default 0,
  created_at          timestamptz default now(),
  unique (camion_id)
);

-- ── Camion documentos ───────────────────────────────────────
create table if not exists camion_docs (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  camion_id  uuid references camiones(id) on delete cascade not null,
  tipo_id    text not null,
  numero     text,
  entidad    text,
  emision    date,
  venc       date not null,
  archivo    text,
  created_at timestamptz default now()
);

-- ── Camion taller ───────────────────────────────────────────
create table if not exists camion_taller (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  camion_id  uuid references camiones(id) on delete cascade not null,
  fecha      date not null,
  km         integer,
  taller     text,
  motivo     text default 'preventivo' check (motivo in ('preventivo','correctivo')),
  trabajos   text[] default '{}',
  costo      numeric(12,2),
  prox_km    integer,
  notas      text,
  created_at timestamptz default now()
);
alter table camion_taller add column if not exists notas text;

-- ── Camion neumaticos ───────────────────────────────────────
create table if not exists camion_neumaticos (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references auth.users on delete cascade not null,
  camion_id          uuid references camiones(id) on delete cascade not null,
  code               text not null,
  marca              text,
  modelo             text,
  medida             text,
  km_inicial         integer,
  km_actual          integer,
  vida_util_esperada integer,
  fecha_inst         date,
  seg                text,
  axle               text,
  side               text,
  "inner"            boolean,
  role               text,
  created_at         timestamptz default now(),
  unique (camion_id, code)
);

-- RLS for new tables
alter table camion_choferes  enable row level security;
alter table camion_docs      enable row level security;
alter table camion_taller    enable row level security;
alter table camion_neumaticos enable row level security;

drop policy if exists "cam_choferes_own"   on camion_choferes;
drop policy if exists "cam_docs_own"       on camion_docs;
drop policy if exists "cam_taller_own"     on camion_taller;
drop policy if exists "cam_neumaticos_own" on camion_neumaticos;

create policy "cam_choferes_own"   on camion_choferes   for all using (auth.uid() = user_id);
create policy "cam_docs_own"       on camion_docs       for all using (auth.uid() = user_id);
create policy "cam_taller_own"     on camion_taller     for all using (auth.uid() = user_id);
create policy "cam_neumaticos_own" on camion_neumaticos for all using (auth.uid() = user_id);
