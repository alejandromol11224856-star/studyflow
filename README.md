# StudyFlow

Sistema personal de estudio, hábitos y objetivos. *Un poco todos los días termina siendo
muchísimo.* Cada día responde dos preguntas: **"¿qué tengo que hacer hoy?"** y **"¿estoy
mejorando?"**. Sirve para cualquier área (estudio, trabajo, gimnasio,
idiomas, lectura, meditación…) y está preparado para convertirse en un producto con planes
Free / Pro / Premium.

## Funciones

- **Hoy**: saludo con tu nombre, racha y nivel, un mensaje según tu día (nunca culposo), el
  **anillo del día** con cuánto falta, chips para fijar la meta en un toque, la tarjeta
  **Continuar** (sesión en curso, retomar la última o empezar un bloque de 25 min), lo que toca
  hoy (hábitos y objetivos para marcar), lo registrado y tus **Áreas** con un botón para empezar.
- **Progreso**: responde "¿Estoy mejorando?" con una frase y la tendencia vs. la semana o el mes
  anterior. Gráfico de las últimas semanas/meses, constancia, objetivo diario, racha, nivel y XP,
  reparto por área con su variación, récords y próximos logros. Las estadísticas completas y el
  calendario quedan a un toque.
- **Métodos**: 8 de estudio (Pomodoro, Deep Work, Time Blocking, Active Recall, Repetición
  espaciada, Feynman, Interleaving, Leitner) y 6 de hábitos (Habit Stacking, Regla de los 2
  minutos, Intenciones de implementación, Diseño del entorno, Hábito mínimo, No cortes la
  cadena). Cada uno con qué es, cómo funciona, cuándo usarlo, un ejemplo y un botón para
  empezarlo ("Comenzar Pomodoro" abre el temporizador con bloques 25/5).
- **Temporizador con modos**: Libre, Pomodoro 25/5, Bloque 50/10 y Deep Work 90/15. Avisa al
  terminar cada bloque (en la app y, si lo permitís, como notificación). Pausa/continuar,
  sobrevive a recargas y se puede seguir desde otro dispositivo.
- **Onboarding en tres preguntas**: ¿qué querés mejorar?, ¿cuánto tiempo por día? y ¿cuál es
  tu objetivo? Con eso se crean tus áreas, el objetivo diario y (si elegiste Hábitos) un primer
  hábito. Después, un recorrido opcional que resalta los elementos reales de Hoy.
- **Registro con código**: el email trae un **código de 6 dígitos** para escribir en la app (y
  también un botón, por si preferís el enlace). Lo mismo para recuperar la contraseña. Reenvío
  con espera, "Cambiar email" y mensajes claros si algo vence.
- **Objetivos en una frase**: "Quiero dedicar 3 h por día a Programación." Tiempo, veces,
  páginas, distancia o repeticiones; diarios, semanales o mensuales; generales o por área.
  Están **versionados por fecha**: cambiar una meta no altera el historial.
- **Hábitos**: todos los días, días fijos o N veces por semana. Marcado en un toque con
  animación, racha actual y mejor, constancia semanal/mensual, **historial de 16 semanas**,
  recordatorio, pausar, archivar y ordenar.
- **Calendario**: mapa de calor del mes (tiempo por día), los días cumplidos unidos por una
  línea que muestra tus rachas, marca de hábitos, los últimos seis meses de un vistazo y el
  detalle de cada día (tiempo vs. objetivo, hábitos marcables y actividades).
- **Áreas 100% personalizables**: nombre, ícono (sugerido según el nombre), color,
  descripción, objetivo con métrica, activar/pausar, archivar y orden. Sin categorías fijas.
- **Gamificación sobria**: XP derivado de tus datos (ver reglas), niveles, **28 logros**,
  récords personales, aviso "+25 XP" al ganar XP, pantalla de nivel nuevo y confeti solo en
  momentos importantes (con límite y respeto por "reducir movimiento").
- **Actividades** con tiempo y/o medidas, notas, edición, borrado con "Deshacer", búsqueda y filtros.
- **Estadísticas completas**: 7 / 30 / 90 días e historial, por día/semana/mes y por área,
  cumplimiento de objetivos y hábitos, evolución de la racha, semana típica y vista de tabla.
- **Personalización**: tema claro ("papel"), oscuro ("tinta") o del sistema, 7 colores de
  acento verificados WCAG AA, celebraciones con o sin confeti, tarjetas extra en Hoy.
- **Ajustes**: perfil, tutorial, tema y color, idioma, objetivos, notificaciones, plan, datos y cuenta.
- **Exportación** de actividades (CSV) y respaldo completo (JSON).
- **Mobile first** (barra inferior Hoy · Progreso · ＋ · Hábitos · Más, hojas inferiores,
  áreas táctiles grandes, safe areas) y **PWA** instalable con atajos (Comenzar sesión,
  Pomodoro, Registrar, Hábitos).

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

## Identidad visual

- **Papel y tinta**: fondo cálido tipo papel en claro (#f4f0e8) y verde tinta en oscuro
  (#0e1412). Acento **pino** (#0f6e5c) por defecto; ámbar para XP y coral para la racha.
- **Tipografía**: Fraunces para títulos y números, Plus Jakarta Sans para la interfaz.
- **Íconos e ilustraciones propias** (SVG): eslabones para la racha, chispa para XP, insignia
  de nivel, brote, camino, cadena, cumbre… Íconos de interfaz de Lucide. Sin emojis como
  iconografía. Licencias en [ASSETS.md](ASSETS.md).

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
    (app)/                 dashboard (Hoy), progress, methods, habits, goals, calendar,
                           stats, achievements, activities, sections (Áreas), settings
    (focus)/onboarding/    configuración inicial a pantalla completa
    auth/callback/         enlaces PKCE (?code=) y compatibilidad con enlaces viejos
    pwa/[icon]/            íconos de la app instalable (192, 512 y maskable)
  proxy.ts                 refresco de sesión + redirecciones (reemplaza a middleware en Next 16)
  components/
    ui/                    primitivas (Button, Card, Dialog, Switch, DayRing…)
    brand/                 marcas (racha, XP, nivel) e ilustraciones SVG propias
    layout/                shell, navegación, recordatorios, protección de rutas
    auth/                  formularios, código de 6 dígitos (OtpInput) y flujo de email
    celebrations/          celebraciones, +XP, "¡Subiste de nivel!" y observador de progreso
    dashboard/             Hoy (resumen principal), widgets y personalización
    gamification/          chips de racha y nivel, tarjetas de datos
    onboarding/            configuración inicial, bienvenida y tutorial interactivo
    progress/              pantalla Progreso ("¿Estoy mejorando?")
    methods/               métodos de estudio y de hábitos (lista y detalle)
    dialogs/               actividad, temporizador, sección, objetivo, hábito
    habits/ goals/ achievements/ stats/ calendar/ sections/ settings/ onboarding/
  hooks/                   datos (React Query), temporizador, métricas en vivo, progresión
  lib/
    data/                  Repository (interfaz) + implementaciones Supabase y local
    domain/                lógica pura y testeada: objetivos, métricas, rachas, hábitos,
                           estadísticas, XP/niveles/logros, récords, mensajes, tendencias
    methods.ts             contenido de los métodos (qué es, cómo, cuándo, ejemplo)
    session-plans.ts       modos del temporizador (Pomodoro, Bloque, Deep Work) y bloques
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

### Cómo funciona

Cada correo trae **dos caminos**:

1. **Un código de 6 dígitos** (`{{ .Token }}`) que la persona escribe en la app
   (`/check-email` al registrarse, `/forgot-password` al recuperar). Es lo más robusto:
   funciona en cualquier dispositivo y ningún escáner de correo lo puede "gastar".
2. **Un botón** con un `token_hash` que lleva a una página propia (`/confirm-email` o
   `/reset-password`) que **no usa el enlace al abrirse**: la persona toca un botón grande y
   recién ahí se verifica.

Por qué no usar el enlace por defecto de Supabase (`{{ .ConfirmationURL }}`): se **consume con
el primer clic o visita**. Los escáneres de enlaces (antivirus, Outlook Safe Links) lo abren
antes que la persona, y con PKCE solo funciona en el mismo navegador donde se hizo el registro.

### Paso a paso (Supabase → Authentication → Emails / Email Templates)

| Plantilla | Asunto (Subject) | Cuerpo (pegar el HTML completo) |
|---|---|---|
| **Confirm signup** | `Tu código para entrar a StudyFlow` | `supabase/templates/confirm-signup.html` |
| **Reset password** | `Creá una nueva contraseña para StudyFlow` | `supabase/templates/reset-password.html` |

Las plantillas incluyen `{{ .Token }}` (el código) y `{{ .TokenHash }}` (el botón). Los enlaces
usan `{{ .RedirectTo }}`, así la misma plantilla sirve para `localhost` y para producción. Si
Supabase no reconoce la URL de redirección, usa la *Site URL* y la app redirige sola.

> El largo del código lo define **Email OTP Length** (por defecto 6). Si lo cambiás, la app
> acepta igual códigos de hasta 10 dígitos.

### Vencimiento de los enlaces

En **Authentication → Providers → Email** (o *Sign In / Providers → Email*), el campo
**Email OTP Expiration** define cuánto duran el código y el enlace. Por defecto es **3600 s (1 hora)** y el
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
2. Andá a `/register` y completá nombre, email y contraseña → se abre **"Revisá tu correo"**.
3. Escribí el **código de 6 dígitos** del correo (o tocá el botón del correo y después
   **Confirmar mi email**) → configuración inicial en tres preguntas → Hoy.
4. Elegí **Ver un recorrido rápido** para el tutorial, o **Empezar** para ir directo.
5. Probá también: "Reenviar código" (espera de 60 s), "Cambiar email", cerrar sesión y entrar,
   y "¿La olvidaste?" → código del correo → nueva contraseña.

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
