import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { formatApiError } from "@/lib/api";

export default function CustomerRegister() {
  const { customer, register } = useCustomer();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", address: "", city: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (customer && customer !== false) return <Navigate to={redirect} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <div className="border border-white/10 bg-[#0E0E0E] p-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-2">// Nueva cuenta</div>
        <h1 className="font-display font-black text-4xl uppercase">Crear Cuenta</h1>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          {[
            { k: "name", l: "Nombre completo", type: "text", req: true, span: 2 },
            { k: "email", l: "Correo", type: "email", req: true, span: 2 },
            { k: "password", l: "Contraseña (mín 6)", type: "password", req: true, span: 2 },
            { k: "phone", l: "Teléfono", type: "tel" },
            { k: "city", l: "Ciudad", type: "text" },
            { k: "address", l: "Dirección", type: "text", span: 2 },
          ].map((f) => (
            <label key={f.k} className={`block col-span-${f.span || 1}`}>
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">{f.l}</span>
              <input
                type={f.type}
                required={f.req}
                minLength={f.k === "password" ? 6 : undefined}
                value={form[f.k]}
                onChange={set(f.k)}
                data-testid={`reg-${f.k}`}
                className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]"
              />
            </label>
          ))}

          {error && <div className="col-span-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}

          <button type="submit" disabled={loading} data-testid="reg-submit"
            className="col-span-2 bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/cuenta/entrar" className="text-[#10B981] hover:underline font-bold">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
