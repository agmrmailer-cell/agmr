export default function AGMRLogo({ size = 46, light = false, withText = true, withTagline = true }) {
  const ink  = light ? "rgba(240,236,226,0.92)" : "#1a3a26"
  const sun  = light ? "#f4c585"                : "#b8451f"
  const mtn  = light ? "rgba(240,236,226,0.88)" : "#1a3a26"

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        aria-label="Logo AGMR"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Soleil */}
        <circle cx="78" cy="36" r="7" fill={sun}/>
        {/* Silhouette montagne (contour) */}
        <path
          d="M 14 92 L 42 50 L 60 72 L 78 48 L 106 92 Z"
          stroke={mtn}
          strokeWidth="3.5"
          fill="none"
        />
        {/* Accent sommet droit */}
        <path d="M 78 48 L 86 60 L 90 56 Z" fill={mtn}/>
        {/* Accent sommet gauche */}
        <path d="M 42 50 L 50 60 L 54 56 Z" fill={mtn}/>
        {/* Chemin pointillé */}
        <path
          d="M 18 104 Q 60 96 102 104"
          stroke={ink}
          strokeWidth="2.5"
          fill="none"
          strokeDasharray="1.5,5"
        />
      </svg>

      {withText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span style={{ fontFamily: "var(--serif)", fontSize: "1.55rem", fontWeight: 600, color: ink }}>
            AGMR
          </span>
          {withTagline && (
            <span style={{
              fontSize: ".66rem",
              color: light ? "rgba(240,236,226,0.6)" : "var(--ink-mute)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              marginTop: 3,
            }}>
              Gym · Marche · Rambouillet
            </span>
          )}
        </div>
      )}
    </div>
  )
}
