import { ShieldCheck } from "lucide-react";

// Envoltorio visual compartido por las pantallas de cuenta de cliente
// (entrar, registro, olvidé/restablecer contraseña) — antes eran tarjetas
// planas sin nada de la textura técnica que sí tiene el resto del sitio.
export default function AuthShell({ kicker = "// Acceso clientes", title, children, footer, maxWidth = "max-w-md" }) {
  return (
    <div className="relative min-h-[75vh] flex items-center justify-center px-6 py-16 overflow-hidden">
      <div className="absolute inset-0 circuit-grid opacity-40 pointer-events-none" />
      <div className={`relative w-full ${maxWidth} border border-white/10 bg-[#0E0E0E] p-8 fade-up`}>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981]">{kicker}</div>
        </div>
        <h1 className="font-display font-black text-4xl uppercase">{title}</h1>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />
        {children}
        {footer && <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-500">{footer}</div>}
      </div>
    </div>
  );
}
