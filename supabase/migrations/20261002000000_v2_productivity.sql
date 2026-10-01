-- =====================================================================
--  StudyFlow v2 — sistema general de productividad
--  Se aplica DESPUÉS de 20261001000000_init.sql. Es incremental: conserva
--  todos los datos existentes.
--
--  Incluye: planes (free/pro/premium) y suscripciones para webhooks,
--  preferencias del usuario, secciones activables, medidas en actividades
--  (páginas, distancia, repeticiones), objetivos por métrica, hábitos y
--  logros. Todo con Row Level Security.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Planes (límites configurables sin tocar código; null = ilimitado)
-- ---------------------------------------------------------------------
create table public.plans (
  id text primary key,
  name text not null,
  sort_order integer not null default 0,
  max_sections integer check (max_sections is null or max_sections > 0),
  max_habits integer check (max_habits is null or max_habits > 0)
);

insert into public.plans (id, name, sort_order) values
  ('free', 'Gratis', 0),
  ('pro', 'Pro', 1),
  ('premium', 'Premium', 2)
on conflict (id) do nothing;

alter table public.plans enable row level security;
create policy "plans: public read" on public.plans for select to anon, authenticated using (true);

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_fkey foreign key (plan) references public.plans (id);

-- El límite de secciones ahora sale de la tabla de planes.
create or replace function public.enforce_section_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_active integer;
begin
  if new.archived_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null then
    return new;
  end if;

  select pl.max_sections into v_limit
  from public.profiles pr
  join public.plans pl on pl.id = pr.plan
  where pr.id = new.user_id;

  if v_limit is null then
    return new;
  end if;

  select count(*) into v_active
  from public.sections
  where user_id = new.user_id and archived_at is null and id <> new.id;

  if v_active >= v_limit then
    raise exception 'plan_limit_sections' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Suscripciones (las escribe SOLO el backend con la service role, p. ej.
-- desde un webhook de Stripe o Mercado Pago). El usuario solo puede leerlas.
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'mercadopago', 'manual')),
  provider_customer_id text,
  provider_subscription_id text unique,
  plan text not null references public.plans (id),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
create policy "subscriptions: select own" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- Mantiene profiles.plan sincronizado con la suscripción vigente.
create or replace function public.sync_profile_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
begin
  select s.plan into v_plan
  from public.subscriptions s
  where s.user_id = new.user_id and s.status in ('active', 'trialing')
  order by s.current_period_end desc nulls last
  limit 1;

  update public.profiles set plan = coalesce(v_plan, 'free') where id = new.user_id;
  return new;
end;
$$;

create trigger subscriptions_sync_plan
  after insert or update on public.subscriptions
  for each row execute function public.sync_profile_plan();

revoke execute on function public.sync_profile_plan() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Perfil: objetivo principal y preferencias (widgets, acento, recordatorios…)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column main_goal text check (char_length(main_goal) <= 160),
  add column preferences jsonb not null default '{}'::jsonb
    check (jsonb_typeof(preferences) = 'object' and pg_column_size(preferences) <= 16384);

grant insert (main_goal, preferences) on public.profiles to authenticated;
grant update (main_goal, preferences) on public.profiles to authenticated;

-- ---------------------------------------------------------------------
-- Secciones activables (desactivada = pausada, sigue visible en Secciones)
-- ---------------------------------------------------------------------
alter table public.sections add column is_active boolean not null default true;

-- ---------------------------------------------------------------------
-- Actividades con medidas además del tiempo
-- ---------------------------------------------------------------------
alter table public.activities
  add column pages integer check (pages is null or pages between 0 and 100000),
  add column distance_km numeric(9, 2) check (distance_km is null or distance_km between 0 and 100000),
  add column reps integer check (reps is null or reps between 0 and 10000000);

-- El tiempo pasa a ser opcional si la actividad registra otra medida.
alter table public.activities drop constraint if exists activities_duration_seconds_check;
alter table public.activities
  add constraint activities_duration_seconds_check check (duration_seconds between 0 and 86400),
  add constraint activities_has_measure check (
    duration_seconds > 0 or coalesce(pages, 0) > 0 or coalesce(distance_km, 0) > 0 or coalesce(reps, 0) > 0
  );

-- Agrega las nuevas medidas a la vista (columnas al final: compatible).
create or replace view public.daily_totals
with (security_invoker = true)
as
select
  user_id,
  date,
  section_id,
  sum(duration_seconds)::integer as seconds,
  count(*)::integer as activity_count,
  coalesce(sum(pages), 0)::integer as pages,
  coalesce(sum(distance_km), 0)::numeric(12, 2) as distance_km,
  coalesce(sum(reps), 0)::integer as reps
from public.activities
group by user_id, date, section_id;

-- ---------------------------------------------------------------------
-- Objetivos por métrica: tiempo (minutos), veces, páginas, distancia (km)
-- y repeticiones. Se conserva el versionado por effective_from.
-- ---------------------------------------------------------------------
alter table public.goals
  add column metric text not null default 'time'
    check (metric in ('time', 'count', 'pages', 'distance', 'reps')),
  add column target numeric(12, 2);

update public.goals set target = target_minutes;

alter table public.goals
  alter column target set not null,
  add constraint goals_target_check check (target between 0 and 1000000);

drop index if exists public.goals_version_uidx;
alter table public.goals drop column target_minutes;

create unique index goals_version_uidx on public.goals (
  user_id,
  period,
  metric,
  coalesce(section_id, '00000000-0000-0000-0000-000000000000'::uuid),
  effective_from
);

-- ---------------------------------------------------------------------
-- Hábitos (se marcan como hechos; no miden tiempo)
-- ---------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  icon text not null default 'target' check (char_length(icon) <= 30),
  color text not null default 'violet' check (char_length(color) <= 20),
  -- daily: los días de days_of_week (0 = domingo). weekly: weekly_target veces por semana.
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly')),
  days_of_week smallint[] not null default '{0,1,2,3,4,5,6}'
    check (cardinality(days_of_week) between 1 and 7 and days_of_week <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  weekly_target smallint check (weekly_target is null or weekly_target between 1 and 7),
  reminder_time time,
  start_date date not null default current_date,
  is_active boolean not null default true,
  archived_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_id_user_key unique (id, user_id),
  constraint habits_section_fk foreign key (section_id, user_id)
    references public.sections (id, user_id) on delete set null (section_id)
);

create index habits_user_order_idx on public.habits (user_id, sort_order);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create table public.habit_checks (
  habit_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (habit_id, date),
  constraint habit_checks_habit_fk foreign key (habit_id, user_id)
    references public.habits (id, user_id) on delete cascade
);

create index habit_checks_user_date_idx on public.habit_checks (user_id, date);

-- ---------------------------------------------------------------------
-- Logros desbloqueados (una vez desbloqueados, quedan para siempre)
-- ---------------------------------------------------------------------
create table public.achievements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  code text not null check (char_length(code) between 1 and 60),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);

-- ---------------------------------------------------------------------
-- Row Level Security de las tablas nuevas
-- ---------------------------------------------------------------------
alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;
alter table public.achievements enable row level security;

create policy "habits: own rows" on public.habits
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "habit_checks: own rows" on public.habit_checks
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "achievements: select own" on public.achievements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "achievements: insert own" on public.achievements
  for insert to authenticated with check ((select auth.uid()) = user_id);
