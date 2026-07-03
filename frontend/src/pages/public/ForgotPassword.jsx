import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";

export default function ForgotPassword() {
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
      const { data } = await api.post("/customer/forgot-password", { email });
      setSent(true);
      if (data.dev_reset_token) {
        setResetLink(`${window.location.origin}/cuenta/restablecer?token=${data.dev_reset_token}`);
      }
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
        <h1 className="font-display font-black text-3xl uppercase">Recuperar contraseña</h1>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />

        {sent ? (
          <div className="space-y-4">
            <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {resetLink
                ? "Si el correo está registrado, se generó un enlace de recuperación."
                : "Si el correo está registrado, te enviamos un enlace de recuperación. Revisa tu bandeja de entrada (y spam)."}
            </div>
            {resetLink && (
              <div className="border border-white/10 bg-[#0A0A0A] p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  El envío de correo no está configurado en este entorno — usa este enlace directamente:
                </p>
                <a href={resetLink} data-testid="dev-reset-link" className="block text-xs text-[#10B981] break-all hover:underline">
                  {resetLink}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Correo</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                data-testid="forgot-email"
                className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
            </label>
            {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}
            <button type="submit" disabled={loading} data-testid="forgot-submit"
              className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
              {loading ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-500">
          <Link to="/cuenta/entrar" className="text-[#10B981] hover:underline font-bold">Volver a Entrar</Link>
        </div>
      </div>
    </div>
  );
}
