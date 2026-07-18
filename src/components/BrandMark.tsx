export function BrandMark() {
  return (
    <div className="brand" aria-label="Calc V2">
      <svg className="brand-star" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="3.5" fill="currentColor" />
        <path d="M24 2v15M24 31v15M2 24h15M31 24h15M8.4 8.4 19 19M29 29l10.6 10.6M39.6 8.4 29 19M19 29 8.4 39.6" />
        <path className="minor-rays" d="m16 4 4.5 13M27.5 31 32 44M4 16l13 4.5M31 27.5 44 32M32 4l-4.5 13M20.5 31 16 44M44 16l-13 4.5M17 27.5 4 32" />
      </svg>
      <span>Calc <em>V2</em></span>
    </div>
  )
}
