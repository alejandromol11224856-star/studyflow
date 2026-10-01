-- =====================================================================
--  StudyFlow — privilegios explícitos para la Data API
--  Se aplica DESPUÉS de 20261002000000_v2_productivity.sql. Solo agrega
--  GRANT: no cambia tablas, datos ni políticas RLS. Se puede ejecutar más
--  de una vez sin efectos secundarios.
--
--  Por qué: Supabase dejó de otorgar privilegios automáticos sobre las
--  tablas nuevas de `public` a anon / authenticated / service_role
--  (proyectos nuevos desde el 30/05/2026; todos desde el 30/10/2026).
--  Sin estos GRANT, cualquier consulta falla con
--  "42501 permission denied for table ..." antes de llegar a RLS.
--
--  Los GRANT deciden si un rol puede usar una tabla; las políticas RLS
--  siguen decidiendo qué filas. Toda tabla nueva necesita sus propios GRANT.
-- =====================================================================

-- Catálogo de planes: lectura pública (igual que la policy "plans: public read").
grant select on public.plans to anon, authenticated;

-- Datos del usuario: las policies "own rows" limitan cada operación a sus filas.
grant select, insert, update, delete on
  public.sections,
  public.activities,
  public.goals,
  public.active_timers,
  public.habits,
  public.habit_checks
to authenticated;

-- Vista con security_invoker: además usa los permisos sobre activities.
grant select on public.daily_totals to authenticated;

-- Perfil: lectura. La escritura ya está otorgada por columnas en las
-- migraciones anteriores (el usuario no puede cambiar su `plan`).
grant select on public.profiles to authenticated;

-- Logros: inmutables (solo leer y desbloquear).
grant select, insert on public.achievements to authenticated;

-- Suscripciones: el usuario solo lee la suya; las escribe el backend.
grant select on public.subscriptions to authenticated;

-- Backend (webhooks de pago, tareas administrativas): service_role ignora
-- RLS pero igual necesita privilegios sobre las tablas.
grant select, insert, update, delete on all tables in schema public to service_role;
