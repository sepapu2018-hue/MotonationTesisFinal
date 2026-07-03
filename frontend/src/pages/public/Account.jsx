import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useCustomer } from "@/context/CustomerContext";
import { formatApiError } from "@/lib/api";

export default function Account() {
  const { customer, updateProfile } = useCustomer();
  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "" });
  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });
  const [error, setError] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (customer && customer !== false) {
      setForm({ name: customer.name || "", phone: customer.phone || "", address: customer.address || "", city: customer.city || "" });
    }
  }, [customer]);

  if (customer === null) return <div className="py-20 text-center text-zinc-500">Cargando…</div>;
  if (customer === false) return <Navigate to="/cuenta/entrar?redirect=/mi-cuenta" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Datos actualizados correctamente");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onSubmitPwd = async (e) => {
    e.preventDefault();
    setPwdError("");
    setSavingPwd(true);
    try {
      await updateProfile({ ...form, ...pwd });
      setPwd({ current_password: "", new_password: "" });
      toast.success("Contraseña actualizada correctamente");
    } catch (err) {
      setPwdError(formatApiError(err));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-16 space-y-8">
      <div className="border border-white/10 bg-[#0E0E0E] p-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-2">// Mi cuenta</div>
        <h1 className="font-display font-black text-4xl uppercase">Mis Datos</h1>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-4">
          <label className="block col-span-2">
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Correo</span>
            <input type="email" value={customer.email} disabled
              className="w-full bg-transparent border border-white/10 px-3 py-2.5 text-sm text-zinc-500" />
          </label>
          {[
            { k: "name", l: "Nombre completo", type: "text", req: true, span: 2 },
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
                data-testid={`account-${f.k}`}
                className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]"
              />
            </label>
          ))}

          {error && <div className="col-span-2 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}

          <button type="submit" disabled={saving} data-testid="account-save"
            className="col-span-2 bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>

      <div className="border border-white/10 bg-[#0E0E0E] p-8">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-2">// Seguridad</div>
        <h2 className="font-display font-black text-2xl uppercase">Cambiar Contraseña</h2>
        <div className="h-0.5 w-12 bg-[#10B981] mt-3 mb-8" />

        <form onSubmit={onSubmitPwd} className="grid grid-cols-1 gap-4">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Contraseña actual</span>
            <input type="password" required value={pwd.current_password}
              onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
              data-testid="account-current-password"
              className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Nueva contraseña (mín 6)</span>
            <input type="password" required minLength={6} value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
              data-testid="account-new-password"
              className="w-full bg-transparent border border-white/15 px-3 py-2.5 text-sm focus:outline-none focus:border-[#10B981]" />
          </label>

          {pwdError && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{pwdError}</div>}

          <button type="submit" disabled={savingPwd} data-testid="account-save-password"
            className="bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors">
            {savingPwd ? "Actualizando…" : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
