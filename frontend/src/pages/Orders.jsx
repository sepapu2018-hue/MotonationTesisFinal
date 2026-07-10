import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { PrimaryButton, inputClass } from "@/components/ui-kit";
import PageLoader from "@/components/public/PageLoader";
import CountUp from "@/components/CountUp";
import { Search, FileText, Truck } from "lucide-react";

const money = (n) => `$${Number(n || 0).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const STATUS_OPTIONS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];
const STATUS = {
  pendiente: { c: "text-zinc-400 border-zinc-400/40 bg-zinc-400/10", l: "Pendiente" },
  pagado: { c: "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10", l: "Pagado" },
  enviado: { c: "text-sky-400 border-sky-400/40 bg-sky-400/10", l: "Enviado" },
  entregado: { c: "text-emerald-300 border-emerald-300/40 bg-emerald-300/10", l: "Entregado" },
  cancelado: { c: "text-amber-400 border-amber-400/40 bg-amber-400/10", l: "Cancelado" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [q, setQ] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const load = () => api.get("/orders").then((r) => setOrders(r.data)).catch((err) => toast.error(formatApiError(err)));
  useEffect(() => { load(); }, []);

  const openDetail = (o) => {
    setSelected(o);
    setDetail(null);
    api.get(`/orders/${o.id}`)
      .then((r) => { setDetail(r.data); setStatusDraft(r.data.status); })
      .catch((err) => toast.error(formatApiError(err)));
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/orders/${selected.id}/status`, { status: statusDraft });
      toast.success("Estado del pedido actualizado");
      setDetail((d) => ({ ...d, status: statusDraft }));
      await load();
      setHighlightId(selected.id);
      setTimeout(() => setHighlightId(null), 1800);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const filtered = orders.filter((o) =>
    !q || o.order_number.toLowerCase().includes(q.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(q.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="mb-6">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// E-commerce</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
          Pedidos
          <span className="timer text-2xl text-zinc-600">[{String(orders.length).padStart(3, "0")}]</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-5 space-y-3">
          <div className="border border-white/10 bg-[#0E0E0E] p-3">
            <div className="flex items-center gap-2 border border-white/15 px-2 py-2 focus-within:border-[#10B981]">
              <Search className="h-4 w-4 text-zinc-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por N° de pedido, cliente o email…" className="flex-1 bg-transparent outline-none text-sm" data-testid="orders-search" />
            </div>
          </div>
          <div className="border border-white/10 bg-[#0E0E0E] max-h-[70vh] overflow-auto" data-testid="orders-table">
            {filtered.map((o) => {
              const s = STATUS[o.status] || STATUS.pendiente;
              return (
                <button
                  key={o.id}
                  onClick={() => openDetail(o)}
                  data-testid={`order-row-${o.order_number}`}
                  className={`w-full text-left px-4 py-3 border-l-2 border-b border-white/5 grid grid-cols-[1fr,auto] gap-2 items-center transition-colors ${selected?.id === o.id ? "border-l-[#10B981] bg-[#10B981]/5" : "border-l-transparent hover:bg-white/[0.02]"} ${o.id === highlightId ? "row-highlight" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold font-mono truncate">{o.order_number}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">{o.customer_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="timer text-sm text-[#10B981]">{money(o.total)}</div>
                    <span className={`text-[9px] uppercase tracking-widest font-bold border px-1.5 py-0.5 ${s.c}`}>{s.l}</span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center text-zinc-600 text-xs uppercase tracking-widest">Sin pedidos que coincidan</div>
            )}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-7">
          {!selected ? (
            <div className="border border-white/10 bg-[#0E0E0E] p-16 text-center">
              <Truck className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <div className="font-display font-bold text-2xl uppercase">Selecciona un pedido</div>
            </div>
          ) : !detail ? (
            <div className="border border-white/10 bg-[#0E0E0E] p-6">
              <PageLoader variant="detail" />
            </div>
          ) : (
            <div className="border border-white/10 bg-[#0E0E0E] p-6 space-y-6 fade-up">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Pedido</div>
                  <div className="font-display font-black text-2xl uppercase font-mono">{detail.order_number}</div>
                  <div className="text-xs text-zinc-500 mt-1">{new Date(detail.created_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">Cliente</div>
                  <div className="text-sm font-semibold">{detail.customer_name}</div>
                  <div className="text-xs text-zinc-500">{detail.customer_email}</div>
                  {detail.customer_phone && <div className="text-xs text-zinc-500">{detail.customer_phone}</div>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Estado</span>
                <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className={inputClass() + " max-w-[200px]"} data-testid="order-status-select">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS[s].l}</option>)}
                </select>
                <PrimaryButton onClick={saveStatus} disabled={saving || statusDraft === detail.status} testid="order-status-save">
                  {saving ? "Guardando…" : "Guardar"}
                </PrimaryButton>
              </div>

              <div className="border border-white/10">
                <div className="px-4 py-2 border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-2">
                  <FileText className="h-3 w-3" /> Productos
                </div>
                {detail.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{i.product_name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{i.product_sku} · ×{i.quantity} · {money(i.unit_price)} c/u</div>
                    </div>
                    <div className="timer">{money(i.subtotal)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span className="timer">{money(detail.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">IVA</span><span className="timer">{money(detail.tax)}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-2 items-end">
                  <span className="font-display font-bold uppercase">Total</span>
                  <span className="timer text-2xl text-[#10B981]"><CountUp value={detail.total} format={money} /></span>
                </div>
              </div>

              <div className="text-xs text-zinc-400 space-y-1 border-t border-white/10 pt-4">
                <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Dirección: </span>{detail.shipping_address}</div>
                {detail.notes && <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Notas: </span>{detail.notes}</div>}
                <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Método de pago: </span>{detail.payment_method} · <span className="font-mono">{detail.payment_ref}</span></div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
