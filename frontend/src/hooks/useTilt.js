import { useState } from "react";

// Tilt 3D sutil que sigue al cursor — se aplica directo sobre el elemento
// (usa e.currentTarget, no necesita ref) con onMouseMove/onMouseLeave.
export function useTilt(maxTilt = 8) {
  const [style, setStyle] = useState({ transform: "perspective(800px) rotateX(0deg) rotateY(0deg)" });

  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(800px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg)`,
    });
  };
  const onMouseLeave = () => setStyle({ transform: "perspective(800px) rotateX(0deg) rotateY(0deg)" });

  return { style, onMouseMove, onMouseLeave };
}
