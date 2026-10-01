-- =====================================================================
--  StudyFlow — esquema inicial
--  Aplicar en Supabase: Dashboard > SQL Editor > New query > pegar > Run
--  (o con la CLI: `supabase db push`).
--
--  Seguridad: todas las tablas tienen Row Level Security. Cada usuario solo
--  puede ver y modificar sus propias filas (auth.uid() = user_id).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;

-- Normaliza texto para búsquedas: minúsculas y sin acentos ("Física" -> "fisica").
create or replace function public.search_normalize(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  timezone text not null default 'UTC' check (char_length(timezone) <= 64),
  week_starts_on smallint not null default 1 check (week_starts_on in (0, 1)),
  -- Preparado para monetización: solo el servidor (service role) puede cambiarlo.
  plan text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), ''), 60),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'timezone', ''), 'UTC'), 64)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Secciones (Estudio, Gimnasio, Inglés...)
-- ---------------------------------------------------------------------
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  color text not null default 'blue' check (char_length(color) <= 20),
  icon text not null default 'book-open' check (char_length(icon) <= 30),
  description text check (char_length(description) <= 200),
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Permite FKs compuestas que garantizan que una actividad/objetivo solo
  -- referencie secciones del mismo usuario.
  constraint sections_id_user_key unique (id, user_id)
);

create index sections_user_order_idx on public.sections (user_id, sort_order);

create trigger sections_set_updated_at
  before update on public.sections
  for each row execute function public.set_updated_at();

-- Límite de secciones activas según el plan (free = 10).
create or replace function public.enforce_section_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_active integer;
begin
  if new.archived_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;

  select plan into v_plan from public.profiles where id = new.user_id;
  if coalesce(v_plan, 'free') = 'premium' then
    return new;
  end if;

  select count(*) into v_active
  from public.sections
  where user_id = new.user_id and archived_at is null and id <> new.id;

  if v_active >= 10 then
    raise exception 'plan_limit_sections' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger sections_enforce_plan_limit
  before insert or update of archived_at on public.sections
  for each row execute function public.enforce_section_limit();

-- ---------------------------------------------------------------------
-- Actividades
-- ---------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  notes text check (char_length(notes) <= 2000),
  -- Día local del usuario (según su zona horaria) en que se hizo la actividad.
  date date not null,
  started_at timestamptz,
  duration_seconds integer not null check (duration_seconds between 1 and 86400),
  source text not null default 'manual' check (source in ('manual', 'timer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_at timestamptz generated always as (coalesce(started_at, created_at)) stored,
  search_text text generated always as (public.search_normalize(title || ' ' || coalesce(notes, ''))) stored,
  constraint activities_section_fk foreign key (section_id, user_id)
    references public.sections (id, user_id) on delete set null (section_id)
);

create index activities_user_date_idx on public.activities (user_id, date desc, sort_at desc);
create index activities_user_section_date_idx on public.activities (user_id, section_id, date desc);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Totales por día y sección: base de rachas, calendario y estadísticas.
-- security_invoker hace que la vista respete el RLS de activities.
create view public.daily_totals
with (security_invoker = true)
as
select
  user_id,
  date,
  section_id,
  sum(duration_seconds)::integer as seconds,
  count(*)::integer as activity_count
from public.activities
group by user_id, date, section_id;

-- ---------------------------------------------------------------------
-- Objetivos (versionados por fecha de vigencia)
-- ---------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- null = objetivo global (suma de todas las secciones)
  section_id uuid,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  -- 0 = objetivo desactivado a partir de effective_from
  target_minutes integer not null check (target_minutes between 0 and 44640),
  effective_from date not null,
  created_at timestamptz not null default now(),
  constraint goals_section_fk foreign key (section_id, user_id)
    references public.sections (id, user_id) on delete cascade
);

create unique index goals_version_uidx on public.goals (
  user_id,
  period,
  coalesce(section_id, '00000000-0000-0000-0000-000000000000'::uuid),
  effective_from
);

-- ---------------------------------------------------------------------
-- Temporizador activo (uno por usuario, sincronizado entre dispositivos)
-- ---------------------------------------------------------------------
create table public.active_timers (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  section_id uuid,
  title text not null default '' check (char_length(title) <= 120),
  started_at timestamptz not null,
  -- null = en pausa
  segment_started_at timestamptz,
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0),
  updated_at timestamptz not null default now(),
  constraint active_timers_section_fk foreign key (section_id, user_id)
    references public.sections (id, user_id) on delete set null (section_id)
);

-- Guarda la actividad del temporizador y lo elimina en una sola transacción.
create or replace function public.finish_timer(
  p_section_id uuid,
  p_title text,
  p_notes text,
  p_date date,
  p_started_at timestamptz,
  p_duration_seconds integer
)
returns public.activities
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_activity public.activities;
begin
  insert into public.activities (user_id, section_id, title, notes, date, started_at, duration_seconds, source)
  values (auth.uid(), p_section_id, p_title, p_notes, p_date, p_started_at, p_duration_seconds, 'timer')
  returning * into v_activity;

  delete from public.active_timers where user_id = auth.uid();
  return v_activity;
end;
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.activities enable row level security;
alter table public.goals enable row level security;
alter table public.active_timers enable row level security;

create policy "profiles: select own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "sections: own rows" on public.sections
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "activities: own rows" on public.activities
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "goals: own rows" on public.goals
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "active_timers: own rows" on public.active_timers
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- El usuario puede editar su perfil, pero nunca su plan.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, display_name, timezone, week_starts_on) on public.profiles to authenticated;
grant update (display_name, timezone, week_starts_on) on public.profiles to authenticated;

-- Funciones expuestas por la API
revoke execute on function public.finish_timer(uuid, text, text, date, timestamptz, integer) from public, anon;
grant execute on function public.finish_timer(uuid, text, text, date, timestamptz, integer) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.enforce_section_limit() from public, anon, authenticated;
