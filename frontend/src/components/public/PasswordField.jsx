import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function passwordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];
const COLORS = ["bg-red-500", "bg-amber-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-400"];

// Input de contraseña con mostrar/ocultar y, opcionalmente, medidor de fuerza.
export default function PasswordField({ label, value, onChange, testId, showStrength = false, required, minLength }) {
  const [show, setShow] = useState(false);
  const strength = passwordStrength(value);

  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required={required}
          minLength={minLength}
          value={value}
          onChange={onChange}
          data-testid={testId}
          className="w-full bg-transparent border border-white/15 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#10B981]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          className="absolute right-0 top-0 h-full px-3 text-zinc-500 hover:text-[#10B981]"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-1.5">
          <div className="flex gap-1 h-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`flex-1 rounded-full transition-colors ${i < strength ? COLORS[strength] : "bg-white/10"}`} />
            ))}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">{LABELS[strength]}</div>
        </div>
      )}
    </label>
  );
}
