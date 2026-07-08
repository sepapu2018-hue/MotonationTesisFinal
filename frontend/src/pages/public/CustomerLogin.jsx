import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { formatApiError } from "@/lib/api";
import AuthShell from "@/components/public/AuthShell";

export default function CustomerLogin() {
  const { customer, login } = useCustomer();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (customer && customer !== false) return <Navigate to={redirect} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Entrar"
      footer={<>¿No tienes cuenta?{" "}<Link to="/cuenta/registro" className="text-[#10B981] hover:underline font-bold">Crear cuenta</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            data-testid="customer-login-email"
            className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Contraseña</span>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            data-testid="customer-login-password"
            className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
        </label>
        <div className="text-right -mt-2">
          <Link to="/cuenta/olvide" className="text-xs text-zinc-500 hover:text-[#10B981]">¿Olvidaste tu contraseña?</Link>
        </div>
        {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}
        <button type="submit" disabled={loading} data-testid="customer-login-submit"
          className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
          {loading ? "Ingresando…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
