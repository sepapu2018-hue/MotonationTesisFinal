import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AuthShell from "@/components/public/AuthShell";
import PasswordField from "@/components/public/PasswordField";

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
    <AuthShell title="Nueva contraseña">
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
          <PasswordField
            label="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            testId="reset-password"
            required
            minLength={6}
            showStrength
          />
          <PasswordField
            label="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            testId="reset-password-confirm"
            required
            minLength={6}
          />
          {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}
          <button type="submit" disabled={loading} data-testid="reset-submit"
            className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
            {loading ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
