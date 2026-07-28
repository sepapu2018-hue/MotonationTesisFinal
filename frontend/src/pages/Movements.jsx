import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import { ArrowDownToLine, ArrowUpFromLine, Plus, X, Activity, Loader2, ClipboardCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import PageLoader from "@/components/public/PageLoader";

const emptyForm = { product_id: "", type: "entrada", quantity: 1, reason: "", direction: "positivo", supplier_id: "" };
const PAGE_SIZE = 15;

export default function Movements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movs, setMovs] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const closeForm = useCallback(() => setShowForm(false), []);
  const formDialogRef = useDialogA11y(showForm, closeForm);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [detailMov, setDetailMov] = useState(null);

  const load = () => api.get("/movements?limit=300").then((r) => setMovs(r.data)).catch((err) => toast.error(formatApiError(err))).finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.get("/products").then((r) => setProducts(r.data)).catch((err) => toast.error(formatApiError(err)));
    api.get("/suppliers").then((r) => setSuppliers(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setError("");
      const productId = searchParams.get("product_id");
      const type = searchParams.get("type");
      if (productId || type) {
        setForm({ ...emptyForm, product_id: productId || "", type: type || "entrada" });
      }
      setShowForm(true);
      searchParams.delete("new");
      searchParams.delete("product_id");
      searchParams.delete("type");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = { product_id: form.product_id, type: form.type, quantity: Number(form.quantity), reason: form.reason };
      if (form.type === "ajuste") payload.direction = form.direction;
      if (form.type === "entrada" && form.supplier_id) payload.supplier_id = form.supplier_id;
      const { data } = await api.post("/movements", payload);
      setShowForm(false);
      setForm(emptyForm);
      await load();
      api.get("/products").then((r) => setProducts(r.data)).catch((err) => toast.error(formatApiError(err)));
      setPage(1);
      setHighlightId(data?.id);
      setTimeout(() => setHighlightId(null), 1800);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recent = movs.filter((m) => new Date(m.created_at).getTime() >= since);
    const ent = recent.filter((m) => m.type === "entrada" || (m.type === "ajuste" && m.direction === "positivo")).reduce((s, m) => s + m.quantity, 0);
    const sal = recent.filter((m) => m.type === "salida" || m.type === "venta" || (m.type === "ajuste" && m.direction === "negativo")).reduce((s, m) => s + m.quantity, 0);
    return { recent: recent.length, ent, sal, total: movs.length };
  }, [movs]);

  const pageItems = useMemo(
    () => movs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [movs, page]
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Auditoría · Stock</div>
          <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
            Movimientos
            <span className="timer text-2xl text-zinc-400">[{String(stats.total).padStart(4, "0")}]</span>
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
          {loading ? (
            <div className="p-6"><PageLoader variant="list" /></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[640px]">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[45%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((m) => {
                  const isIncrease = m.type === "entrada" || (m.type === "ajuste" && m.direction === "positivo");
                  const badgeVariant = m.type === "ajuste" ? "info" : (m.type === "entrada" ? "success" : "danger");
                  const label = m.type === "ajuste" ? `ajuste ${m.direction === "positivo" ? "(+)" : "(−)"}` : m.type;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setDetailMov(m)}
                      data-testid={`movement-row-${m.id}`}
                      className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${m.id === highlightId ? "row-highlight" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariant}>
                          {m.type === "ajuste"
                            ? <ClipboardCheck className="h-3 w-3 inline mr-1" />
                            : (isIncrease ? <ArrowDownToLine className="h-3 w-3 inline mr-1" /> : <ArrowUpFromLine className="h-3 w-3 inline mr-1" />)}
                          {label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="truncate" title={m.product_name}>{m.product_name}</div>
                        <div className="text-xs text-zinc-500 font-mono truncate">{m.product_sku}</div>
                      </td>
                      <td className={`px-4 py-3 text-right timer text-xl whitespace-nowrap ${isIncrease ? "text-emerald-400" : "text-amber-400"}`}>
                        {isIncrease ? "+" : "−"}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Eye className="h-4 w-4 text-zinc-500 inline-block" />
                      </td>
                    </tr>
                  );
                })}
                {pageItems.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-zinc-500 text-xs uppercase tracking-widest">Sin movimientos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          {stats.total > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/10 text-sm" data-testid="pagination">
              <span className="text-zinc-500 text-xs">
                Página {page} de {Math.max(1, Math.ceil(stats.total / PAGE_SIZE))} · {stats.total} movimientos
              </span>
              <div className="flex gap-2">
                <GhostButton type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} testid="prev-page" className="px-3 py-1.5">
                  <ChevronLeft className="h-4 w-4" />
                </GhostButton>
                <GhostButton type="button" onClick={() => setPage((p) => (p * PAGE_SIZE < stats.total ? p + 1 : p))} disabled={page * PAGE_SIZE >= stats.total} testid="next-page" className="px-3 py-1.5">
                  <ChevronRight className="h-4 w-4" />
                </GhostButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <form
            ref={formDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-modal-title"
            tabIndex={-1}
            onSubmit={submit}
            className="w-full max-w-md bg-[#141414] border border-white/10 p-8 shadow-2xl outline-none"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Nueva Operación</div>
                <h3 id="movement-modal-title" className="font-display font-black text-2xl uppercase">Registrar</h3>
              </div>
              <button type="button" onClick={closeForm} aria-label="Cerrar" className="text-zinc-500 hover:text-white"><X /></button>
            </div>

            <div className="space-y-4">
              <Field label="Producto">
                <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className={inputClass()}>
                  <option value="">— Seleccionar —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{`${p.sku} · ${p.name}`}</option>)}
                </select>
              </Field>
              <Field label="Tipo">
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" aria-pressed={form.type === "entrada"} onClick={() => setForm({ ...form, type: "entrada" })}
                    className={`py-2 text-xs font-bold uppercase ${form.type === "entrada" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-white/15 text-zinc-400"} border`}>Entrada</button>
                  <button type="button" aria-pressed={form.type === "salida"} onClick={() => setForm({ ...form, type: "salida" })}
                    className={`py-2 text-xs font-bold uppercase ${form.type === "salida" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-white/15 text-zinc-400"} border`}>Salida</button>
                  <button type="button" aria-pressed={form.type === "ajuste"} onClick={() => setForm({ ...form, type: "ajuste" })}
                    className={`py-2 text-xs font-bold uppercase ${form.type === "ajuste" ? "bg-sky-500/20 border-sky-500 text-sky-400" : "border-white/15 text-zinc-400"} border`}>Ajuste</button>
                </div>
              </Field>
              {form.type === "ajuste" && (
                <Field label="Dirección del ajuste">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" aria-pressed={form.direction === "positivo"} onClick={() => setForm({ ...form, direction: "positivo" })}
                      className={`py-2 text-xs font-bold uppercase ${form.direction === "positivo" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-white/15 text-zinc-400"} border`}>Sube stock (+)</button>
                    <button type="button" aria-pressed={form.direction === "negativo"} onClick={() => setForm({ ...form, direction: "negativo" })}
                      className={`py-2 text-xs font-bold uppercase ${form.direction === "negativo" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "border-white/15 text-zinc-400"} border`}>Baja stock (−)</button>
                  </div>
                </Field>
              )}
              {form.type === "entrada" && (
                <Field label="Proveedor (opcional)">
                  <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className={inputClass()}>
                    <option value="">— Sin proveedor —</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Cantidad"><input type="number" min="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass()} /></Field>
              <Field label="Motivo">
                <input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className={inputClass()}
                  required={form.type === "ajuste"}
                  placeholder={form.type === "ajuste" ? "Ej: Conteo físico detectó faltante en bodega" : "Ej: Compra a proveedor"}
                />
              </Field>
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

      {detailMov && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setDetailMov(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="movement-detail-title"
            className="w-full max-w-md bg-[#141414] border border-white/10 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="movement-detail-modal"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Detalle del movimiento</div>
                <h3 id="movement-detail-title" className="font-display font-black text-2xl uppercase">
                  {detailMov.type === "ajuste" ? `Ajuste (${detailMov.direction === "positivo" ? "+" : "−"})` : detailMov.type}
                </h3>
              </div>
              <button type="button" onClick={() => setDetailMov(null)} aria-label="Cerrar" className="text-zinc-500 hover:text-white"><X /></button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Fecha</div>
                <div className="text-zinc-200">{new Date(detailMov.created_at).toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Producto</div>
                <div className="text-zinc-200">{detailMov.product_name}</div>
                <div className="text-xs text-zinc-500 font-mono">{detailMov.product_sku}</div>
              </div>
              {detailMov.supplier_name && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Proveedor</div>
                  <div className="text-zinc-200">{detailMov.supplier_name}</div>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Cantidad</div>
                <div className={`timer text-2xl ${detailMov.type === "salida" || detailMov.type === "venta" || (detailMov.type === "ajuste" && detailMov.direction === "negativo") ? "text-amber-400" : "text-emerald-400"}`}>
                  {detailMov.type === "salida" || detailMov.type === "venta" || (detailMov.type === "ajuste" && detailMov.direction === "negativo") ? "−" : "+"}{detailMov.quantity}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Motivo</div>
                <div className="text-zinc-200">{detailMov.reason || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Usuario</div>
                <div className="text-zinc-200">{detailMov.user_name}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <GhostButton type="button" onClick={() => setDetailMov(null)}>Cerrar</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}