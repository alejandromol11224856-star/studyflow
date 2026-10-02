import { ImageResponse } from "next/og";
import { BrandIcon } from "@/components/layout/brand-icon";

/**
 * Íconos de la app instalable (PWA). Chrome pide 192 y 512 px; el "maskable"
 * ocupa todo el cuadrado (Android lo recorta con la forma del sistema) y deja
 * el logo dentro de la zona segura.
 */
const ICONS = {
  "icon-192.png": { size: 192, maskable: false },
  "icon-512.png": { size: 512, maskable: false },
  "maskable-512.png": { size: 512, maskable: true },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((icon) => ({ icon }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ icon: string }> }) {
  const { icon } = await params;
  const def = ICONS[icon as keyof typeof ICONS];
  if (!def) return new Response("Not found", { status: 404 });
  return new ImageResponse(<BrandIcon size={def.size} rounded={!def.maskable} />, { width: def.size, height: def.size });
}
