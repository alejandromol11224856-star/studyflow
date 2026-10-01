import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { ACCENT_STORAGE_KEY } from "@/lib/preferences";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "StudyFlow — Disciplina, tiempo y progreso", template: "%s · StudyFlow" },
  description:
    "Registrá tu tiempo de estudio, gimnasio, idiomas y más. Objetivos diarios, temporizador, rachas y estadísticas para mantener la disciplina.",
  applicationName: "StudyFlow",
  appleWebApp: { capable: true, title: "StudyFlow", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Aplica el color de acento guardado antes del primer pintado (evita parpadeo). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var a=localStorage.getItem("${ACCENT_STORAGE_KEY}");if(a&&/^[a-z]+$/.test(a))document.documentElement.dataset.accent=a}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
