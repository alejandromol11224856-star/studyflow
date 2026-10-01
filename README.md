# StudyFlow

Sistema personal de productividad, hábitos y objetivos. Cada día responde una pregunta:
**"¿qué tengo que hacer hoy?"**. Sirve para cualquier área (estudio, trabajo, gimnasio,
idiomas, lectura, meditación…) y está preparado para convertirse en un producto con planes
Free / Pro / Premium.

## Funciones

- **Hoy**: panel principal con los objetivos del día (y el contexto de la semana y el mes),
  los hábitos para marcar, el progreso general, tu objetivo principal y un mensaje según
  tu situación del día.
- **Dashboard personalizable**: 14 widgets (objetivo diario, temporizador, racha, nivel,
  tiempo total, actividades recientes, progreso semanal, hábitos, calendario, objetivos,
  secciones, logros, estadísticas). Mostrar, ocultar y reordenar; se sincroniza entre dispositivos.
- **Secciones 100% personalizables**: nombre, ícono (sugerido según el nombre), color,
  descripción, objetivos, activar/pausar, archivar y orden de aparición. No hay categorías
  predefinidas.
- **Objetivos por métrica**: tiempo, veces, páginas, distancia o repeticiones; diarios,
  semanales o mensuales; generales o por sección. Los de tiempo mantienen la cuenta
  regresiva en vivo. Están **versionados por fecha**: cambiar una meta no altera el historial.
- **Actividades** con tiempo y/o medidas (páginas, km, repeticiones), notas, edición,
  borrado con "Deshacer", búsqueda sin importar acentos y filtros.
- **Hábitos**: todos los días, días fijos o N veces por semana. Racha actual y mejor,
  cumplimiento semanal y mensual, recordatorio por hábito, pausar, archivar y ordenar.
- **Temporizador** con pausa/continuar, guardado en la base: sobrevive a recargas y se
  puede seguir desde otro dispositivo. Mini-barra flotante en el celular.
- **XP y niveles** con reglas anti-abuso (ver abajo). **28 logros** que se desbloquean solos
  y quedan guardados con su fecha. **Récords personales** con la fecha en que se consiguieron.
- **Celebraciones** sobrias: aviso + confeti solo en momentos importantes (objetivo cumplido,
  nivel nuevo, logro, récord), con límite de frecuencia y respeto por "reducir movimiento".
- **Calendario** mensual tipo mapa de calor con días cumplidos y detalle por día.
- **Estadísticas**: 7 / 30 / 90 días e historial completo. Tiempo por día (o semana/mes),
  por sección con comparación vs. el período anterior, cumplimiento de objetivos, hábitos,
  evolución de la racha, tendencia semanal y semana típica. Vista de tabla accesible.
- **Recordatorios** de hábitos y del objetivo diario (en la app o como notificación del navegador).
- **Personalización**: tema claro/oscuro/sistema, 7 colores de acento verificados con
  contraste WCAG AA, celebraciones con o sin confeti.
- **Onboarding** al crear la cuenta (nombre, qué querés conseguir, tus áreas, objetivo
  principal y meta diaria). Se puede saltar y repetir desde Ajustes.
- **Exportación** de actividades (CSV) y respaldo completo (JSON).
- **Responsive real** y **PWA** instalable en el celular.

### Reglas

- **Día cumplido** (rachas y calendario): se alcanzaron todos los objetivos diarios generales
  vigentes ese día (de cualquier métrica). Sin objetivos ese día, alcanza con registrar algo.
  Si hoy todavía no cumpliste, la racha sigue viva hasta la medianoche de tu zona horaria.
- **XP**: se calcula a partir de tus datos (no es un contador), así que es igual en todos tus
  dispositivos y borrar una actividad descuenta su XP.
  - 10 XP por hora registrada, contando el **total del día** (máximo 12 h): partir una hora en
    60 actividades de 1 minuto no da más XP.
  - 3 XP por actividad, máximo 5 por día y solo si el día suma 10 minutos (o una medida real).
  - Objetivos cumplidos (diario 25, semanal 60, mensual 150; por sección 10/20/50), con tope por período.
  - 5 XP por hábito completado (máximo 8 por día), bonus por días seguidos y XP de los logros.
- **Niveles**: cada nivel pide un poco más que el anterior (100, 140, 180… XP).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Estilos | Tailwind CSS v4 con tokens de diseño (claro/oscuro + color de acento) |
| Datos | Supabase (PostgreSQL + Auth) con Row Level Security |
| Estado servidor | TanStack Query (caché, actualizaciones optimistas) |
| UI | Radix (diálogos y menús accesibles), lucide (íconos), sonner (avisos), Recharts |
| Validación | zod |
| Tests | Vitest (lógica de dominio) |

## Arquitectura

```
src/
  app/
    (auth)/                login, register, forgot-password, reset-password
    (app)/                 dashboard (Hoy), habits, goals, calendar, stats, achievements,
                           activities, sections, settings
    (focus)/onboarding/    configuración inicial a pantalla completa
    auth/callback/         destino de los emails de Supabase
  proxy.ts                 refresco de sesión + redirecciones (reemplaza a middleware en Next 16)
  components/
    ui/                    primitivas (Button, Card, Dialog, Switch, ProgressRing…)
    layout/                shell, navegación, recordatorios, protección de rutas
    celebrations/          celebraciones y observador de progreso (objetivos, nivel, logros, récords)
    dashboard/             panel Hoy, widgets y personalización
    dialogs/               actividad, temporizador, sección, objetivo, hábito
    habits/ goals/ achievements/ stats/ calendar/ sections/ settings/ onboarding/
  hooks/                   datos (React Query), temporizador, métricas en vivo, progresión
  lib/
    data/                  Repository (interfaz) + implementaciones Supabase y local
    domain/                lógica pura y testeada: objetivos, métricas, rachas, hábitos,
                           estadísticas, XP/niveles/logros, récords, mensajes
    preferences.ts         widgets, acento, recordatorios, onboarding (validación tolerante)
    notifications.ts       canales de notificación (in-app y navegador; listo para push)
    plans.ts               planes Free/Pro/Premium
supabase/migrations/       esquema SQL versionado
```

- **Una sola interfaz de datos** (`lib/data/repository.ts`); la UI no sabe si habla con
  Supabase o con el modo local.
- **Modo local**: sin variables de Supabase, cuentas y datos se guardan en el navegador. Los
  datos de versiones anteriores se migran solos.
- **Seguridad**: RLS en todas las tablas; FKs compuestas impiden referenciar secciones o
  hábitos de otro usuario; el usuario no puede cambiar su `plan`; los logros no se pueden
  editar ni borrar; las suscripciones solo las escribe el backend.

## Correr en tu computadora

Requisitos: Node.js 20.9 o superior.

```bash
npm install
npm run dev
```

Abrí http://localhost:3000. Sin configurar nada, funciona en **modo local**.

```bash
npm run build      # build de producción
npm run test       # tests de la lógica de dominio
npm run lint
npm run typecheck
```

## Conectar Supabase (base de datos real en la nube)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor → New query**, ejecutá **en orden** las migraciones de `supabase/migrations/`:
   1. `20261001000000_init.sql`
   2. `20261002000000_v2_productivity.sql`
   3. `20261003000000_api_grants.sql`

   (Con la CLI: `supabase link` y `supabase db push`.) La v2 es incremental: si ya tenías la
   v1 con datos, los conserva y convierte los objetivos al nuevo formato. La 3 otorga los
   permisos de la Data API: Supabase ya no los da automáticamente a las tablas nuevas, y sin
   ella todo falla con `permission denied for table …` (se ve como "Ocurrió un error inesperado").
3. En **Project Settings → API** copiá la URL y la *publishable key*. Creá `.env.local`
   a partir de `.env.example`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. En **Authentication → URL Configuration**:
   - *Site URL*: `http://localhost:3000` (después, tu dominio de producción).
   - *Redirect URLs*: `http://localhost:3000/**` y `https://tu-dominio.com/**`.
5. Reiniciá `npm run dev`. El aviso de "Modo local" desaparece y los datos se guardan en la nube.

**Recomendado (emails que funcionan aunque los abras en otro dispositivo):** en
**Authentication → Email Templates** cambiá el enlace de:

- *Confirm signup*: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding`
- *Reset password*: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

> Los datos creados en modo local no se migran solos a la nube: exportalos desde **Ajustes → Tus datos**.

## Publicar en Internet (Vercel)

1. Subí el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → *Add New Project* → importá el repositorio.
3. Agregá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy. Después agregá la URL de Vercel (o tu dominio) en *Site URL* y *Redirect URLs* de Supabase.
5. En el celular, abrí la web y elegí "Agregar a pantalla de inicio".

## Planes y pagos (preparado, no implementado)

- Planes **Free / Pro / Premium** en la tabla `plans`. Hoy **ninguno tiene límites**
  (`max_sections` / `max_habits` = `null`). Para activar un límite, se cambia el valor en la
  tabla (la base lo hace cumplir) y en `src/lib/plans.ts` (la UI lo muestra).
- `profiles.plan` no lo puede cambiar el usuario.
- Tabla `subscriptions` (provider, ids del proveedor, plan, estado, fin de período). Solo la
  escribe el backend con la *service role*. Un trigger sincroniza `profiles.plan` con la
  suscripción activa.
- Para conectar **Stripe o Mercado Pago**: crear un endpoint de webhook (por ejemplo una Route
  Handler de Next o una Supabase Edge Function) que verifique la firma del proveedor y haga
  `upsert` en `subscriptions` con la service role. La clave secreta va en una variable de
  entorno **sin** prefijo `NEXT_PUBLIC_`.

## Recordatorios y notificaciones

- Hoy funcionan mientras StudyFlow está abierta (pestaña o app instalada): aviso dentro de la
  app o notificación del navegador si diste permiso (Ajustes → Recordatorios).
- `src/lib/notifications.ts` define canales (`NotificationChannel`). Para notificaciones push
  con la app cerrada: sumar un service worker + Web Push y un job programado en el backend.

## Ideas para próximas etapas

- Push real (service worker) y modo offline.
- Sincronización en tiempo real del temporizador (Supabase Realtime).
- Pagos y funciones premium.
- App nativa.
