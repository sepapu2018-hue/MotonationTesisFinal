import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { useNavigate, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const HERO = "http/images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirección si ya está autenticado
  if (user && user !== false) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
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
      </div>
    </div>
  );
}