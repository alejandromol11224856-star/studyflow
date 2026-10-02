import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { ACCENT_STORAGE_KEY } from "@/lib/preferences";
import "./globals.css";

// Plus Jakarta Sans: amigable y moderna, con cifras tabulares para los números.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "StudyFlow — Tu progreso, un poco cada día", template: "%s · StudyFlow" },
  description:
    "Objetivos, hábitos, rachas y XP para estudiar, entrenar y ser más constante. Registrá tus sesiones y mirá cómo avanzás cada día.",
  applicationName: "StudyFlow",
  appleWebApp: { capable: true, title: "StudyFlow", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}>
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
