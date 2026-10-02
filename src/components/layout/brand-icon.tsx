import { BRAND } from "./logo";

/**
 * Ícono de la app para ImageResponse (favicon, PWA, Apple touch icon).
 * `rounded=false` = ícono "maskable": ocupa todo el cuadrado y el trazo queda
 * dentro de la zona segura (Android lo recorta con la forma del sistema).
 */
export function BrandIcon({ size, rounded = true }: { size: number; rounded?: boolean }) {
  const glyph = rounded ? 0.72 : 0.58;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, ${BRAND.pine} 0%, ${BRAND.pineDeep} 100%)`,
        borderRadius: rounded ? size * 0.24 : 0,
      }}
    >
      <svg width={size * glyph} height={size * glyph} viewBox="4 6 24 20">
        <path
          d="M6.5 21.5c3.4 0 4.3-7.4 8.2-7.4s4.4 4.6 7.4 4.6c1.9 0 2.8-2.3 3.4-4.8"
          fill="none"
          stroke={BRAND.paper}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.6" cy="10.2" r="2.5" fill={BRAND.sun} />
      </svg>
    </div>
  );
}
