import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import { ArrowDownToLine, ArrowUpFromLine, Plus, X, Activity, Loader2 } from "lucide-react";

export default function Movements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movs, setMovs] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: "", type: "entrada", quantity: 1, reason: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/movements?limit=300").then((r) => setMovs(r.data)).catch((err) => toast.error(formatApiError(err)));

  useEffect(() => {
    load();
    api.get("/products").then((r) => setProducts(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setError("");
      setShowForm(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/movements", { ...form, quantity: Number(form.quantity) });
      setShowForm(false);
      setForm({ product_id: "", type: "entrada", quantity: 1, reason: "" });
      load();
      api.get("/products").then((r) => setProducts(r.data)).catch((err) => toast.error(formatApiError(err)));
    } catch (err) {
      setError(formatApiError(err)); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const stats = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recent = movs.filter((m) => new Date(m.created_at).getTime() >= since);
    const ent = recent.filter((m) => m.type === "entrada").reduce((s, m) => s + m.quantity, 0);
    const sal = recent.filter((m) => m.type === "salida" || m.type === "venta").reduce((s, m) => s + m.quantity, 0);
    return { recent: recent.length, ent, sal, total: movs.length };
  }, [movs]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Auditoría · Stock</div>
          <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
            Movimientos
            <span className="timer text-2xl text-zinc-600">[{String(stats.total).padStart(4, "0")}]</span>
          </h1>
        </div>
        <PrimaryButton testid="new-movement-button" onClick={() => { setError(""); setShowForm(true); }}>
          <Plus className="h-4 w-4 inline -mt-0.5 mr-1" /> Registrar
        </PrimaryButton>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3 lg:order-1 order-2 space-y-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">
              <Activity className="h-3 w-3" /> Últimas 24h
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Movimientos</div>
                <div className="timer text-4xl">{stats.recent}</div>
              </div>
              <div className="border-t border-white/5 pt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400">Entradas</div>
                  <div className="timer text-2xl text-emerald-400">+{stats.ent}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-amber-400">Salidas</div>
                  <div className="timer text-2xl text-amber-400">−{stats.sal}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="col-span-12 lg:col-span-9 lg:order-2 order-1 border border-white/10 bg-[#0E0E0E]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{new Date(m.created_at).toLocaleString("es")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={m.type === "entrada" ? "success" : "danger"}>
                        {m.type === "entrada" ? <ArrowDownToLine className="h-3 w-3 inline mr-1" /> : <ArrowUpFromLine className="h-3 w-3 inline mr-1" />}
                        {m.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{m.product_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{m.product_sku}</td>
                    <td className={`px-4 py-3 text-right timer text-xl ${m.type === "entrada" ? "text-emerald-400" : "text-amber-400"}`}>
                      {m.type === "entrada" ? "+" : "−"}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{m.reason || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{m.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <form onSubmit={submit} className="w-full max-w-md bg-[#141414] border border-white/10 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Nueva Operación</div>
                <h3 className="font-display font-black text-2xl uppercase">Registrar</h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X /></button>
            </div>
            
            <div className="space-y-4">
              <Field label="Producto">
                <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className={inputClass()}>
                  <option value="">— Seleccionar —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{`${p.sku} · ${p.name}`}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm({ ...form, type: "entrada" })}
                    className={`py-2 text-xs font-bold uppercase ${form.type === "entrada" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-white/15 text-zinc-400"} border`}>Entrada</button>
                  <button type="button" onClick={() => setForm({ ...form, type: "salida" })}
                    className={`py-2 text-xs font-bold uppercase ${form.type === "salida" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-white/15 text-zinc-400"} border`}>Salida</button>
                </div>
              </Field>
              <Field label="Cantidad"><input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass()} /></Field>
              <Field label="Motivo"><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass()} placeholder="Ej: Ajuste de inventario" /></Field>
            </div>

            {error && <div className="mt-4 border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>}
            
            <div className="mt-6 flex justify-end gap-3">
              <GhostButton type="button" onClick={() => setShowForm(false)}>Cancelar</GhostButton>
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Procesando...</> : "Confirmar Movimiento"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}