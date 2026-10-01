<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# StudyFlow — notas del proyecto

- UI en español rioplatense (voseo: "registrá", "elegí"). Mantener ese tono.
- Datos: los componentes usan solo `Repository` (`src/lib/data/repository.ts`) vía los hooks de
  `src/hooks/use-data.ts`. Toda feature nueva de datos debe implementarse en **ambas**
  implementaciones (`supabase-repository.ts` y `local-repository.ts`) y, si toca la base, en una
  **nueva** migración en `supabase/migrations/` (no editar migraciones ya aplicadas en producción).
- Tablas nuevas en `public`: además de RLS y policies, la migración debe incluir sus `grant`
  explícitos (`authenticated` según lo que use la app, `service_role` si lo usa el backend, `anon`
  solo si es público). Supabase ya no los otorga solo; sin ellos falla con `42501 permission
  denied for table`. Ver `20261003000000_api_grants.sql`.
- Fechas de calendario: siempre `DateKey` (`yyyy-MM-dd`) en la zona horaria del perfil
  (`src/lib/dates.ts`). Nunca usar `new Date().toISOString().slice(0, 10)` para "hoy".
- Objetivos versionados por `effectiveFrom`: para cambiar uno, crear/actualizar la versión de hoy
  (`setGoal`), nunca editar versiones pasadas.
- Lógica pura en `src/lib/domain/` con tests en `domain.test.ts` (`npm run test`).
- Colores de secciones: paleta validada en `globals.css` (`--sec-*`, claro/oscuro). No agregar
  colores sin validar contraste/daltonismo.
- Diálogos globales vía `useDialogs()` (`src/components/dialogs/dialogs-provider.tsx`).
- Grids responsive: siempre incluir `grid-cols-1` base (evita overflow horizontal en móvil).
- Objetivos con métrica (`time` en minutos, `count`, `pages`, `distance` en km, `reps`); el progreso
  se calcula en unidad base con `measureValue`/`targetBase` (`src/lib/domain/metrics.ts`).
- XP/niveles/logros se **derivan** de los datos (`src/lib/domain/progression.ts`); solo los logros
  desbloqueados se guardan. Cambios de reglas de XP: actualizar también `v2.test.ts` y el README.
- Preferencias del usuario (widgets, acento, recordatorios, onboarding) en `profiles.preferences`,
  parseadas con `parsePreferences` (tolerante). Nuevo widget: agregarlo a `WIDGETS` y a
  `WIDGET_COMPONENTS`.
- Color de acento: tokens `--primary` (relleno, texto blanco) y `--primary-text` (texto/íconos).
  Usar `text-primary-text` para texto de acento, nunca `text-primary`.
- Celebraciones solo vía `useCelebrations()`; las transiciones se detectan en `ProgressWatcher`.
- Errores de mutaciones: los muestra el `MutationCache` global; usar `meta: { silent: true }` solo
  si la mutación muestra su propio aviso.
