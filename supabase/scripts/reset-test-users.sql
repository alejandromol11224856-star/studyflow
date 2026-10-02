-- =====================================================================
--  StudyFlow — borrar usuarios de PRUEBA y todos sus datos
--
--  NO es una migración (por eso está fuera de supabase/migrations).
--  Se ejecuta a mano en Supabase → SQL Editor, en dos pasos.
--
--  Qué se borra: SOLO los usuarios de la lista. Todo lo suyo se borra solo
--  por ON DELETE CASCADE (verificado en las migraciones):
--    public: profiles, sections, activities, goals, active_timers,
--            habits, habit_checks, achievements, subscriptions
--    auth:   identities, sessions, refresh tokens, factores MFA
--  NO toca tablas, columnas, políticas RLS, funciones, planes, migraciones
--  ni a ningún otro usuario.
--
--  Alternativa sin SQL: Authentication → Users → ⋮ → Delete user
--  (borra exactamente lo mismo).
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASO 0 (opcional) · Ver todos los usuarios para elegir cuáles borrar
-- ---------------------------------------------------------------------
select email, created_at, email_confirmed_at, last_sign_in_at
from auth.users
order by created_at desc;


-- ---------------------------------------------------------------------
-- PASO 1 · VISTA PREVIA (no borra nada)
-- Reemplazá los emails de ejemplo por los de tus cuentas de prueba
-- (escribilos en minúsculas).
-- Revisá que aparezcan solo esas cuentas y cuántos datos tiene cada una.
-- ---------------------------------------------------------------------
with targets as (
  select id, email, created_at, email_confirmed_at, last_sign_in_at
  from auth.users
  where lower(email) = any (array[
    'prueba1@ejemplo.com',
    'prueba2@ejemplo.com'
  ])
)
select
  t.email,
  t.created_at,
  t.email_confirmed_at is not null                                         as confirmado,
  t.last_sign_in_at,
  (select count(*) from public.profiles      x where x.id = t.id)          as perfil,
  (select count(*) from public.sections      x where x.user_id = t.id)     as areas,
  (select count(*) from public.activities    x where x.user_id = t.id)     as actividades,
  (select count(*) from public.goals         x where x.user_id = t.id)     as objetivos,
  (select count(*) from public.active_timers x where x.user_id = t.id)     as temporizador,
  (select count(*) from public.habits        x where x.user_id = t.id)     as habitos,
  (select count(*) from public.habit_checks  x where x.user_id = t.id)     as marcas_habitos,
  (select count(*) from public.achievements  x where x.user_id = t.id)     as logros,
  (select count(*) from public.subscriptions x where x.user_id = t.id)     as suscripciones
from targets t
order by t.email;


-- ---------------------------------------------------------------------
-- PASO 2 · BORRAR (IRREVERSIBLE)
-- Está comentado a propósito para que ejecutar este archivo nunca borre
-- nada por accidente. Cuando la vista previa sea correcta:
--   1. Copiá el bloque de abajo a una consulta nueva (sin /* y */).
--   2. Usá EXACTAMENTE la misma lista de emails del paso 1.
--   3. Ejecutalo. Devuelve los usuarios borrados.
-- ---------------------------------------------------------------------
/*
delete from auth.users
where lower(email) = any (array[
  'prueba1@ejemplo.com',
  'prueba2@ejemplo.com'
])
returning id, email;
*/
