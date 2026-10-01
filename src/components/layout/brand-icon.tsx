/** Ícono de la app para ImageResponse (favicon, PWA, Apple touch icon). */
export function BrandIcon({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #7b6dff 0%, #5b4ef5 50%, #3b2fd1 100%)",
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.4} strokeLinecap="round">
        <path d="M4 15c2.5 0 3.5-6 6-6s3.5 6 6 6 3-3 4-4" />
      </svg>
    </div>
  );
}
