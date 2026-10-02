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
    description: "Objetivos, hábitos, rachas y XP para estudiar, entrenar y ser más constante.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    // Pantalla de inicio (splash) en Android: fondo + ícono + nombre.
    background_color: "#0b0a12",
    theme_color: "#5b4ef5",
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
      { name: "Registrar actividad", short_name: "Registrar", url: "/dashboard?action=log", icons: [icon192] },
      { name: "Hábitos", url: "/habits", icons: [icon192] },
      { name: "Progreso", url: "/progress", icons: [icon192] },
    ],
  };
}
