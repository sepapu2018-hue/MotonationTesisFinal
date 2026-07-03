import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      await api.post("/customer/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => navigate("/cuenta/entrar", { replace: true }), 2000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="border border-white/10 bg-[#0E0E0E] p-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-2">// Acceso clientes</div>
        <h1 className="font-display font-black text-3xl uppercase">Nueva contraseña</h1>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />

        {!token ? (
          <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Este enlace no incluye un token válido. Solicita uno nuevo desde{" "}
            <Link to="/cuenta/olvide" className="underline font-bold">recuperar contraseña</Link>.
          </div>
        ) : done ? (
          <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Contraseña actualizada. Redirigiendo a Entrar…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Nueva contraseña</span>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                data-testid="reset-password"
                className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Confirmar contraseña</span>
              <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                data-testid="reset-password-confirm"
                className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
            </label>
            {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}
            <button type="submit" disabled={loading} data-testid="reset-submit"
              className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
