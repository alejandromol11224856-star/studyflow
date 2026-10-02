# StudyFlow

Sistema personal de productividad, hábitos y objetivos. Cada día responde una pregunta:
**"¿qué tengo que hacer hoy?"**. Sirve para cualquier área (estudio, trabajo, gimnasio,
idiomas, lectura, meditación…) y está preparado para convertirse en un producto con planes
Free / Pro / Premium.

## Funciones

- **Hoy**: arriba de todo, saludo, racha 🔥, nivel ⭐, un mensaje motivador, el objetivo del
  día con su anillo de progreso y un botón grande **Comenzar sesión**. Debajo: objetivos y
  hábitos para marcar en un toque, las actividades de hoy y tus áreas (▶ para empezar).
- **Progreso**: nivel y XP, tiempo de la semana/mes vs. el período anterior, cumplimiento del
  objetivo diario, racha, mejor día, últimos 7 días y próximos logros. Las estadísticas
  completas quedan a un toque ("Ver estadísticas completas").
- **Bienvenida + tutorial interactivo**: la primera vez se ofrece un recorrido de 5 pasos que
  resalta los elementos reales (objetivo, temporizador, áreas, hábitos, progreso). Se puede
  saltar y repetir desde Ajustes.
- **Registro sin fricción**: pantalla "Revisá tu correo" (con "Abrir Gmail", reenvío con espera
  y "Cambiar email"), confirmación con botón grande que no se rompe por los escáneres de
  correo, y emails con la marca StudyFlow (ver "Emails de autenticación").
- **Dashboard personalizable**: tarjetas para mostrar, ocultar y reordenar (temporizador,
  racha, nivel, calendario, estadísticas…); se sincroniza entre dispositivos.
- **Áreas 100% personalizables**: nombre, ícono (sugerido según el nombre), color,
  descripción, objetivo con métrica, activar/pausar, archivar y orden de aparición. No hay
  categorías predefinidas.
- **Objetivos por métrica**: tiempo, veces, páginas, distancia o repeticiones; diarios,
  semanales o mensuales; generales o por área (Programación → 2 h, Lectura → 30 páginas,
  Running → 5 km, Flexiones → 100). Los de tiempo mantienen la cuenta regresiva en vivo.
  Están **versionados por fecha**: cambiar una meta no altera el historial.
- **Actividades** con tiempo y/o medidas (páginas, km, repeticiones), notas, edición,
  borrado con "Deshacer", búsqueda sin importar acentos y filtros.
- **Hábitos**: todos los días, días fijos o N veces por semana. Racha actual y mejor,
  cumplimiento semanal y mensual, recordatorio por hábito, pausar, archivar y ordenar.
- **Temporizador** con pausa/continuar, guardado en la base: sobrevive a recargas y se
  puede seguir desde otro dispositivo. Mini-barra flotante en el celular.
- **XP y niveles** con reglas anti-abuso (ver abajo). Aviso "+8 XP · Sesión completada" al
  ganar XP y pantalla "🎉 ¡Subiste de nivel!". **28 logros** que se desbloquean solos y quedan
  guardados con su fecha. **Récords personales** con la fecha en que se consiguieron.
- **Celebraciones** sobrias: aviso + confeti solo en momentos importantes (objetivo cumplido,
  nivel nuevo, logro, récord), con límite de frecuencia y respeto por "reducir movimiento".
- **Mensajes motivadores** variados según tu día (nunca culposos): "Un poco todos los días
  termina siendo muchísimo.", "🔥 Vas 4 días seguidos.", "🚀 Ya superaste tu objetivo."
- **Calendario** mensual tipo mapa de calor con días cumplidos y detalle por día.
- **Estadísticas**: 7 / 30 / 90 días e historial completo. Tiempo por día (o semana/mes),
  por sección con comparación vs. el período anterior, cumplimiento de objetivos, hábitos,
  evolución de la racha, tendencia semanal y semana típica. Vista de tabla accesible.
- **Recordatorios** de hábitos y del objetivo diario (en la app o como notificación del navegador).
- **Personalización**: tema claro/oscuro/sistema, 7 colores de acento verificados con
  contraste WCAG AA, celebraciones con o sin confeti.
- **Onboarding** al crear la cuenta (nombre, qué querés conseguir, tus áreas, objetivo
  principal y meta diaria). Se puede saltar y repetir desde Ajustes.
- **Ajustes**: perfil, repetir tutorial, tema y color, idioma, objetivos, notificaciones,
  plan, datos/exportación y cuenta, con accesos rápidos arriba.
- **Exportación** de actividades (CSV) y respaldo completo (JSON).
- **Mobile first** (barra inferior Hoy · Progreso · ＋ · Hábitos · Más, botones grandes) y
  **PWA** instalable desde Chrome/Edge, con atajos "Comenzar sesión" y "Registrar actividad".

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
    (auth)/                login, register, check-email ("Revisá tu correo"), confirm-email
                           (confirmación con botón), forgot-password, reset-password
    (app)/                 dashboard (Hoy), progress, habits, goals, calendar, stats,
                           achievements, activities, sections (Áreas), settings
    (focus)/onboarding/    configuración inicial a pantalla completa
    auth/callback/         enlaces PKCE (?code=) y compatibilidad con enlaces viejos
    pwa/[icon]/            íconos de la app instalable (192, 512 y maskable)
  proxy.ts                 refresco de sesión + redirecciones (reemplaza a middleware en Next 16)
  components/
    ui/                    primitivas (Button, Card, Dialog, Switch, ProgressRing…)
    layout/                shell, navegación, recordatorios, protección de rutas
    auth/                  formularios y flujo de email (reenvío con espera, abrir Gmail)
    celebrations/          celebraciones, +XP, "¡Subiste de nivel!" y observador de progreso
    dashboard/             Hoy (resumen principal), widgets y personalización
    gamification/          chips de racha y nivel, tarjetas de datos
    onboarding/            configuración inicial, bienvenida y tutorial interactivo
    progress/              pantalla Progreso
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
supabase/templates/        emails de StudyFlow (confirmar cuenta, restablecer contraseña)
supabase/scripts/          utilidades manuales (borrar usuarios de prueba)
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
   - *Site URL*: `http://localhost:3000` mientras desarrollás; en producción, tu dominio
     (por ejemplo `https://studyflow.vercel.app`).
   - *Redirect URLs* (una por línea):
     - `http://localhost:3000/**`
     - `https://tu-dominio.com/**` (o `https://tu-proyecto.vercel.app/**`)
     - Opcional, para las previews de Vercel: `https://*-tu-cuenta.vercel.app/**`
5. Configurá los emails (siguiente sección). **Sin este paso, el enlace de confirmación puede
   fallar** cuando lo abre un antivirus/escáner del correo o cuando se abre en otro dispositivo.
6. Reiniciá `npm run dev`. El aviso de "Modo local" desaparece y los datos se guardan en la nube.

> Los datos creados en modo local no se migran solos a la nube: exportalos desde **Ajustes → Tus datos**.

## Emails de autenticación

### Por qué cambiamos las plantillas

El enlace por defecto de Supabase (`{{ .ConfirmationURL }}`) se **consume con el primer clic o
visita**. Dos cosas lo rompen y terminan en "El enlace no es válido o expiró":

1. **Escáneres de enlaces** (antivirus del correo, Outlook Safe Links, filtros corporativos):
   abren el enlace antes que la persona y lo gastan.
2. **Otro navegador u otro dispositivo** (registrarse en la PC y abrir el correo en el celular,
   o en el navegador interno de la app de Gmail): con PKCE, el canje necesita una cookie que
   solo existe en el navegador donde se hizo el registro.

Las plantillas de StudyFlow mandan un `token_hash` a una página propia (`/confirm-email` o
`/reset-password`) que **no usa el enlace al abrirse**: la persona toca un botón grande
("CONFIRMAR MI EMAIL") y recién ahí se verifica. Un escáner no toca botones, y funciona en
cualquier dispositivo. Si igual llega un enlace viejo o vencido, la app explica qué pasó y
ofrece reenviar el correo.

### Paso a paso (Supabase → Authentication → Emails / Email Templates)

| Plantilla | Asunto (Subject) | Cuerpo (pegar el HTML completo) |
|---|---|---|
| **Confirm signup** | `🚀 Terminá tu registro en StudyFlow` | `supabase/templates/confirm-signup.html` |
| **Reset password** | `🔐 Creá una nueva contraseña para StudyFlow` | `supabase/templates/reset-password.html` |

Los enlaces usan `{{ .RedirectTo }}`, así la misma plantilla sirve para `localhost` y para
producción (la app indica a dónde volver). Si Supabase no reconoce la URL de redirección, usa
la *Site URL* y la app redirige sola a la página correcta.

### Vencimiento de los enlaces

En **Authentication → Providers → Email** (o *Sign In / Providers → Email*), el campo
**Email OTP Expiration** define cuánto dura el enlace. Por defecto es **3600 s (1 hora)** y el
máximo es 86400 s (24 h). Recomendación: **subirlo a 86400 (24 h)** para que nadie se quede
afuera por abrir el correo al día siguiente. Sigue siendo seguro: el enlace es de un solo uso
y queda invalidado al pedir uno nuevo. (Aplica también a "olvidé mi contraseña".)

Dejá activado **Confirm email** en el proveedor Email.

### Remitente "Supabase Auth" y SMTP propio (necesario para producción)

El correo llega como "Supabase Auth" porque se usa el **servidor de email incorporado**, que:

- solo envía a direcciones **del equipo del proyecto** (no a usuarios reales),
- tiene un límite de **2 correos por hora**,
- no permite cambiar el nombre ni la dirección del remitente.

Para tener "StudyFlow <hola@tudominio.com>" y poder registrar personas reales necesitás un
**SMTP propio** (Resend, Brevo, Postmark, Amazon SES, SendGrid, ZeptoMail):

1. Tené un **dominio propio** (por ejemplo `studyflow.app`). Sin dominio, los proveedores solo
   envían a tu propia dirección o terminan en spam.
2. En el proveedor (ejemplo con **Resend**): agregá el dominio y cargá en tu DNS los registros
   **SPF, DKIM y DMARC** que te indique. Esperá a que figure como verificado.
3. Creá una **API key / credencial SMTP** en el proveedor. Es un secreto: va solo en el panel
   de Supabase, **nunca** en el repositorio ni en variables `NEXT_PUBLIC_`.
4. En Supabase → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:
   - *Sender email*: `hola@tudominio.com` (o `no-reply@…`)
   - *Sender name*: `StudyFlow`
   - *Host*, *Port*, *Username*, *Password*: los del proveedor (en Resend:
     `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = tu API key).
5. Al activar SMTP propio, Supabase pone un límite inicial de **30 correos por hora**: ajustalo
   en **Authentication → Rate Limits** según lo que necesites.

La app ya muestra una espera de 60 s entre reenvíos ("Podés volver a solicitar un correo en
X segundos") y respeta la espera que pida Supabase.

### Usuarios de prueba: volver a probar el registro

`supabase/scripts/reset-test-users.sql` borra **solo** las cuentas que indiques y todos sus
datos (por `ON DELETE CASCADE`: perfil, áreas, actividades, objetivos, temporizador, hábitos,
marcas, logros y suscripciones). No toca tablas, políticas, migraciones ni a otros usuarios.

1. SQL Editor → pegá el **paso 1** con tus emails de prueba → revisá la vista previa.
2. Si es correcto, ejecutá el **paso 2** (está comentado a propósito) con la misma lista.

Alternativa sin SQL: **Authentication → Users → ⋮ → Delete user**.

### Probar el registro desde cero

1. Borrá la cuenta de prueba (sección anterior) o usá un email nuevo.
2. Andá a `/register`, completá nombre, email y contraseña → se abre **"📬 ¡Revisá tu correo!"**.
3. Abrí el correo (en cualquier dispositivo) → tocá **🚀 TERMINAR REGISTRO** → en StudyFlow
   tocá **CONFIRMAR MI EMAIL** → ✅ "¡Email confirmado!" → configuración inicial → Hoy.
4. En Hoy aparece "¡Bienvenido a StudyFlow! 👋": tocá **🚀 Sí, mostrarme** para el tutorial.
5. Probá también: "Reenviar correo" (espera de 60 s), "Cambiar email", cerrar sesión y entrar,
   y "¿La olvidaste?" → correo → **CREAR NUEVA CONTRASEÑA**.

## Publicar en Internet (Vercel)

1. Subí el proyecto a un repositorio de GitHub (el repositorio va **dentro de `studyflow/`**).
2. En [vercel.com](https://vercel.com) → *Add New Project* → importá el repositorio.
3. Agregá `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   (Production y Preview).
4. Deploy. Después, en Supabase: poné la URL de Vercel (o tu dominio) como *Site URL* y agregala
   en *Redirect URLs* (`https://tu-proyecto.vercel.app/**`).
5. Instalar como app: en Chrome/Edge (PC o Android) aparece **Instalar StudyFlow** en la barra de
   direcciones o en el menú ⋮ → "Instalar app". En iPhone: Safari → Compartir → "Agregar a
   inicio". Mantené presionado el ícono para los atajos "Comenzar sesión" y "Registrar actividad".

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
