interface OrbitalFieldProps {
  intensity: number
  motion: boolean
}

export function OrbitalField({ intensity, motion }: OrbitalFieldProps) {
  return (
    <div className={`orbital-field ${motion ? 'is-moving' : ''}`} style={{ opacity: intensity / 100 }} aria-hidden="true">
      <svg viewBox="0 0 620 360" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0" stopColor="#ffe1a6" stopOpacity=".9" />
            <stop offset=".18" stopColor="#d79f59" stopOpacity=".35" />
            <stop offset="1" stopColor="#d79f59" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="365" cy="166" r="52" fill="url(#coreGlow)" />
        {[46, 70, 96, 126, 160].map((radius, index) => (
          <ellipse key={radius} className={`orbit orbit-${index}`} cx="365" cy="166" rx={radius * 1.55} ry={radius * .52} transform={`rotate(${-12 + index * 6} 365 166)`} />
        ))}
        <g className="orbit-points">
          <circle cx="468" cy="128" r="4" />
          <circle cx="285" cy="215" r="2.5" />
          <circle cx="520" cy="210" r="5" />
          <circle cx="229" cy="122" r="3" />
          <circle cx="407" cy="85" r="2" />
        </g>
      </svg>
    </div>
  )
}
