# Recursos visuales y licencias

StudyFlow no usa imágenes de stock ni recursos descargados de bancos de imágenes. Todo lo visual
es **propio** (SVG/CSS hecho para el producto) o viene de librerías con **licencia comercial
clara**. Antes de sumar un recurso externo, agregalo a esta lista con su licencia.

## Propios (creados para StudyFlow)

| Recurso | Dónde | Notas |
| --- | --- | --- |
| Logo (cuadrado pino, trazo de "flujo" y sol) | `src/components/layout/logo.tsx` | SVG. Colores de marca en `BRAND`. |
| Ícono de la app / PWA / favicon | `src/components/layout/brand-icon.tsx`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/pwa/[icon]/route.tsx` | Se genera como PNG con `next/og` (sin archivos binarios). |
| Marcas: racha (eslabones), XP (chispa), crecimiento, insignia de nivel | `src/components/brand/marks.tsx` | SVG con `currentColor`. |
| Ilustraciones: brote, camino, cadena, libro, calendario, sobre, temporizador, cumbre | `src/components/brand/illustrations.tsx` | Trazo de línea; toman los colores del tema (claro y oscuro). |
| Anillo del día | `src/components/ui/day-ring.tsx` | SVG. |
| Panel de marca (login/registro) y cierre de la landing | `src/app/(auth)/layout.tsx`, `src/app/page.tsx` | SVG + CSS. |
| Plantillas de email | `supabase/templates/*.html` | HTML/CSS; la marca se dibuja con CSS (sin imágenes). |
| Textura de papel (grano) | `src/app/globals.css` (`body::before`) | SVG de ruido embebido como data URI. |

## Tipografías

| Fuente | Uso | Licencia |
| --- | --- | --- |
| [Fraunces](https://fonts.google.com/specimen/Fraunces) | Títulos y números | SIL Open Font License 1.1 |
| [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | Interfaz | SIL Open Font License 1.1 |
| [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) | Cifras monoespaciadas | SIL Open Font License 1.1 |

Se cargan con `next/font/google` (se sirven desde el propio dominio, sin pedidos a Google en
tiempo de ejecución).

## Librerías con recursos visuales

| Librería | Uso | Licencia |
| --- | --- | --- |
| [Lucide](https://lucide.dev) (`lucide-react`) | Íconos de interfaz | ISC |
| [Recharts](https://recharts.org) | Gráficos de Estadísticas | MIT |
| [Sonner](https://sonner.emilkowal.ski) | Avisos (toasts) | MIT |
| [Radix UI](https://www.radix-ui.com) | Diálogos y menús accesibles | MIT |

## Otros archivos

`public/*.svg` (`file`, `globe`, `next`, `vercel`, `window`) vienen de la plantilla de
`create-next-app` (MIT) y la app no los usa.

## Reglas

- Sin emojis como iconografía principal (se permiten, de vez en cuando, en mensajes).
- Nada de imágenes de Google, Canva, Freepik u otras fuentes sin licencia comercial explícita.
- Preferir SVG propio con `currentColor` o variables CSS, para que funcione en claro y oscuro.
