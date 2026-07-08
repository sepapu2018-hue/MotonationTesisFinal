import { useState } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useCustomer } from "@/context/CustomerContext";
import { formatApiError } from "@/lib/api";
import AuthShell from "@/components/public/AuthShell";
import PasswordField from "@/components/public/PasswordField";

export default function CustomerRegister() {
  const { customer, register } = useCustomer();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", address: "", city: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (customer && customer !== false) return <Navigate to={redirect} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("Tenés que aceptar los términos y condiciones para crear tu cuenta");
      return;
    }
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
    <AuthShell
      kicker="// Nueva cuenta"
      title="Crear Cuenta"
      maxWidth="max-w-lg"
      footer={<>¿Ya tienes cuenta?{" "}<Link to="/cuenta/entrar" className="text-[#10B981] hover:underline font-bold">Iniciar sesión</Link></>}
    >
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
        {[
          { k: "name", l: "Nombre completo", type: "text", req: true, span: 2 },
          { k: "email", l: "Correo", type: "email", req: true, span: 2 },
          { k: "phone", l: "Teléfono", type: "tel" },
          { k: "city", l: "Ciudad", type: "text" },
          { k: "address", l: "Dirección", type: "text", span: 2 },
        ].map((f) => (
          <label key={f.k} className={`block col-span-${f.span || 1}`}>
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">{f.l}</span>
            <input
              type={f.type}
              required={f.req}
              value={form[f.k]}
              onChange={set(f.k)}
              data-testid={`reg-${f.k}`}
              className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]"
            />
          </label>
        ))}

        <div className="col-span-2">
          <PasswordField
            label="Contraseña (mín 6)"
            value={form.password}
            onChange={set("password")}
            testId="reg-password"
            required
            minLength={6}
            showStrength
          />
        </div>

        <label className="col-span-2 flex items-start gap-2.5 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            data-testid="reg-terms"
            className="mt-0.5 accent-[#10B981]"
          />
          Acepto los <span className="text-zinc-300 underline">términos y condiciones</span> y la <span className="text-zinc-300 underline">política de privacidad</span> de MotoNation.
        </label>

        {error && <div className="col-span-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}

        <button type="submit" disabled={loading} data-testid="reg-submit"
          className="col-span-2 bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
