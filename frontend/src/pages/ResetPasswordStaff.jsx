import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";

export default function ResetPasswordStaff() {
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
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => navigate("/admin/login", { replace: true }), 2000);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] p-8" data-testid="staff-reset-page">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative w-full max-w-md border border-white/10 bg-[#141414] p-10 fade-up">
        <div className="flex items-center gap-3 mb-6">
          <BrandLogo size={36} />
          <span className="font-display uppercase tracking-widest text-sm">Motonation</span>
        </div>

        <div className="mb-8">
          <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">// Recuperar acceso</div>
          <h1 className="font-display font-black text-2xl uppercase">Nueva contraseña</h1>
          <div className="h-0.5 w-12 bg-[#10B981] mt-3" />
        </div>

        {!token ? (
          <div className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Este enlace no incluye un token válido. Solicita uno nuevo desde{" "}
            <Link to="/admin/olvide" className="underline font-bold">recuperar contraseña</Link>.
          </div>
        ) : done ? (
          <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Contraseña actualizada. Redirigiendo a Entrar…
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/20 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                placeholder="*************"
                data-testid="staff-reset-password"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Confirmar contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-transparent border border-white/20 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                placeholder="*************"
                data-testid="staff-reset-password-confirm"
              />
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400" data-testid="staff-reset-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-70 text-black font-display uppercase tracking-widest font-bold py-3 transition-colors"
              data-testid="staff-reset-submit"
            >
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
          <Link to="/admin/login" className="text-[#10B981] hover:underline font-bold">← Volver a Entrar</Link>
        </div>
      </div>
    </div>
  );
}
