import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function ForgotPasswordStaff() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setSent(true);
      if (data.dev_reset_token) {
        setResetLink(`${window.location.origin}/admin/restablecer?token=${data.dev_reset_token}`);
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0A] p-8" data-testid="staff-forgot-page">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="relative w-full max-w-md border border-white/10 bg-[#141414] p-10 fade-up">
        <div className="flex items-center gap-3 mb-6">
          <BrandLogo size={36} />
          <span className="font-display uppercase tracking-widest text-sm">Motonation</span>
        </div>

        <div className="mb-8">
          <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">// Recuperar acceso</div>
          <h1 className="font-display font-black text-2xl uppercase">Olvidé mi contraseña</h1>
          <div className="h-0.5 w-12 bg-[#10B981] mt-3" />
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {resetLink
                ? "Si el correo está registrado, se generó un enlace de recuperación."
                : "Si el correo está registrado en el sistema, te enviamos un enlace de recuperación. Revisa tu bandeja de entrada (y spam)."}
            </div>
            {resetLink && (
              <div className="border border-white/10 bg-[#0A0A0A] p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  El envío de correo no está configurado en este entorno — usa este enlace directamente:
                </p>
                <a href={resetLink} data-testid="staff-dev-reset-link" className="block text-xs text-[#10B981] break-all hover:underline">
                  {resetLink}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Correo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-white/20 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                placeholder="tu@correo.com"
                data-testid="staff-forgot-email"
              />
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400" data-testid="staff-forgot-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-70 text-black font-display uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2"
              data-testid="staff-forgot-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
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
