import type { MetadataRoute } from "next";

/** Permite instalar StudyFlow en la pantalla de inicio del celular (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyFlow",
    short_name: "StudyFlow",
    description: "Tracker de estudio y hábitos: objetivos diarios, temporizador, rachas y estadísticas.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#5b4ef5",
    lang: "es",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
