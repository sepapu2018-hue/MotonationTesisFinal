// Check que se "dibuja" con stroke-dasharray: primero el circulo, despues el tilde.
export default function AnimatedCheck({ size = 80, className = "" }) {
  return (
    <div className={`mx-auto ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle
          cx="50" cy="50" r="46"
          fill="rgba(16,185,129,0.12)"
          stroke="#10B981"
          strokeWidth="4"
          className="check-circle"
        />
        <path
          d="M28 52 L43 66 L74 34"
          fill="none"
          stroke="#10B981"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="check-mark"
        />
      </svg>
    </div>
  );
}
