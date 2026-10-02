import type { MetadataRoute } from "next";

/**
 * App instalable (PWA). Chrome/Edge piden: nombre, íconos de 192 y 512 px,
 * start_url, display y HTTPS (o localhost). El service worker no es requisito.
 */
export default function manifest(): MetadataRoute.Manifest {
  const icon192 = { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" };
  return {
    id: "/",
    name: "StudyFlow",
    short_name: "StudyFlow",
    description: "Un poco todos los días termina siendo muchísimo. Objetivos, hábitos, métodos de estudio y progreso claro.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    // Pantalla de inicio (splash) en Android: fondo "tinta" + ícono pino + nombre.
    background_color: "#0e1412",
    theme_color: "#0f6e5c",
    lang: "es-AR",
    dir: "ltr",
    categories: ["productivity", "education", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      { ...icon192, purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Atajos al mantener presionado el ícono de la app.
    shortcuts: [
      { name: "Comenzar sesión", short_name: "Comenzar", url: "/dashboard?action=timer", icons: [icon192] },
      { name: "Empezar un Pomodoro", short_name: "Pomodoro", url: "/dashboard?action=pomodoro", icons: [icon192] },
      { name: "Registrar actividad", short_name: "Registrar", url: "/dashboard?action=log", icons: [icon192] },
      { name: "Hábitos", url: "/habits", icons: [icon192] },
    ],
  };
}
