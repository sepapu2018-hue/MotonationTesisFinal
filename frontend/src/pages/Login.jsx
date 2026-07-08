import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import OtpInput from "@/components/public/OtpInput";

const HERO = "https://images.unsplash.com/photo-1489731007795-388eee095ff6?auto=format&fit=crop&w=1600&q=80";

export default function Login() {
  const { user, login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Paso 2: código de verificación enviado por correo
  const [pendingToken, setPendingToken] = useState(null);
  const [code, setCode] = useState("");
  const [devOtpCode, setDevOtpCode] = useState("");
  const [resending, setResending] = useState(false);

  // Redirección si ya está autenticado
  if (user && user !== false) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setPendingToken(data.pending_token);
      setDevOtpCode(data.dev_otp_code || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(pendingToken, code);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      const data = await resendOtp(pendingToken);
      setPendingToken(data.pending_token);
      setDevOtpCode(data.dev_otp_code || "");
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const backToCredentials = () => {
    setPendingToken(null);
    setCode("");
    setDevOtpCode("");
    setError("");
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0A0A0A]" data-testid="login-page">
      {/* Hero Side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-[#10B981]/25" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} />
            <div className="font-display uppercase tracking-[0.25em] text-sm">Motonation</div>
          </div>
          <div className="space-y-4">
            <div className="h-1 w-16 bg-[#10B981]" />
            <h1 className="font-display font-black text-6xl uppercase leading-[0.9] tracking-tight">
              Sistema<br/>interno<br/><span className="text-[#10B981]">MotoNation</span>
            </h1>
            <p className="text-zinc-300 max-w-md leading-relaxed">

            </p>
          </div>
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
             Sistema Operativo Interno
          </div>
        </div>
      </div>

      {/* Form Side - Interacción */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        {!pendingToken ? (
          <form
            onSubmit={submit}
            className="relative w-full max-w-md border border-white/10 bg-[#141414] p-10 fade-up"
            data-testid="login-form"
          >
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <BrandLogo size={36} />
              <span className="font-display uppercase tracking-widest text-sm">Motonation</span>
            </div>

            <div className="mb-8">
              <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">// ACCESO</div>

              <div className="h-0.5 w-12 bg-[#10B981] mt-3" />
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Correo</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border border-white/20 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                  placeholder="Ingrese su Correo"
                  data-testid="login-email-input"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border border-white/20 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                  placeholder="*************"
                  data-testid="login-password-input"
                />
                <div className="mt-2 text-right">
                  <Link to="/admin/olvide" className="text-xs text-zinc-500 hover:text-[#10B981] transition-colors" data-testid="login-forgot-link">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              {error && (
                <div
                  className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center gap-2"
                  data-testid="login-error"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-70 text-black font-display uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Ingresando...
                  </>
                ) : (
                  "Acceder al Sistema"
                )}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-[10px] uppercase tracking-widest text-zinc-600 font-mono text-center">
                 · Acceso restringido
            </div>
          </form>
        ) : (
          <form
            onSubmit={submitOtp}
            className="relative w-full max-w-md border border-white/10 bg-[#141414] p-10 fade-up"
            data-testid="otp-form"
          >
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <BrandLogo size={36} />
              <span className="font-display uppercase tracking-widest text-sm">Motonation</span>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" /> Verificación en dos pasos
              </div>
              <div className="h-0.5 w-12 bg-[#10B981] mt-3" />
            </div>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Enviamos un código de 6 dígitos a <span className="text-white font-semibold">{email}</span>. Ingrésalo para completar el acceso.
            </p>

            {devOtpCode && (
              <div className="mb-6 border border-white/10 bg-[#0A0A0A] p-3 text-xs text-zinc-400" data-testid="dev-otp-code">
                El envío de correo no está configurado en este entorno — código de prueba: <span className="text-[#10B981] font-bold">{devOtpCode}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">Código de verificación</label>
                <OtpInput value={code} onChange={setCode} disabled={loading} />
              </div>

              {error && (
                <div
                  className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400 flex items-center gap-2"
                  data-testid="otp-error"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-70 text-black font-display uppercase tracking-widest font-bold py-3 transition-colors flex items-center justify-center gap-2"
                data-testid="otp-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                  </>
                ) : (
                  "Verificar código"
                )}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
              <button type="button" onClick={backToCredentials} className="hover:text-zinc-400" data-testid="otp-back-button">
                ← Volver
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="hover:text-[#10B981] disabled:opacity-60"
                data-testid="otp-resend-button"
              >
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
