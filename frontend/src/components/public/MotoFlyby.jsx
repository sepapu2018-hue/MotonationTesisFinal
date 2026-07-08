import { useEffect, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

// Animacion de una moto cruzando de lado a lado. Se dispara cada vez que
// la seccion que la contiene entra en pantalla (no solo la primera vez).
export default function MotoFlyby({ className = "" }) {
  const ref = useRef(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRunKey((k) => k + 1);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative w-full h-full overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute bottom-7 md:bottom-9 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {runKey > 0 && (
        <div key={runKey}>
          <div className="moto-flyby-trail absolute bottom-9 md:bottom-11 left-0 h-1.5 w-48 bg-gradient-to-r from-transparent via-[#10B981]/70 to-transparent blur-[2px]" />
          <div className="moto-flyby absolute bottom-2 md:bottom-3 left-0">
            {/* El PNG trae fondo negro solido (sin alpha) — en vez de pelear
                contra eso, lo enmarcamos como un chip HUD, coherente con el
                resto del sitio (cajas con borde verde + label mono). */}
            <div className="flex items-center gap-2 border border-[#10B981]/50 bg-black px-3 py-1.5 shadow-[0_0_22px_rgba(16,185,129,0.3)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              <div className="moto-flip">
                <BrandLogo size={58} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
