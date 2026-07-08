import { useEffect, useRef, useState } from "react";

// Anima un número de 0 al valor final con ease-out. `format` recibe el valor
// entero de cada frame y devuelve el string a mostrar (para reusar con $, padStart, etc.)
export default function CountUp({ value, duration = 900, format = (n) => n }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return format(Math.round(display));
}
