import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { useCustomer } from "@/context/CustomerContext";
import { Package, ChevronRight, X } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { DangerButton } from "@/components/ui-kit";
import PageLoader from "@/components/public/PageLoader";

const CANCELABLE = ["pendiente", "pagado"];

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const STATUS = {
  pendiente: { c: "text-zinc-400 border-zinc-400/40 bg-zinc-400/10", l: "Pendiente" },
  pagado: { c: "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10", l: "Pagado" },
  enviado: { c: "text-sky-400 border-sky-400/40 bg-sky-400/10", l: "Enviado" },
  entregado: { c: "text-emerald-300 border-emerald-300/40 bg-emerald-300/10", l: "Entregado" },
  cancelado: { c: "text-amber-400 border-amber-400/40 bg-amber-400/10", l: "Cancelado" },
};

export default function MyOrders() {
  const { customer } = useCustomer();
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (customer && customer !== false) {
      api.get("/orders/mine")
        .then((r) => setOrders(r.data))
        .catch((err) => {
          // ✅ CORREGIDO: Atajamos el error 401 para que React no se caiga
          console.log("No se pudieron cargar los pedidos (sesión inválida o expirada):", err.message);
          setOrders([]);
        });
    }
  }, [customer]);

  const openDetail = (o) => {
    setSelected(o);
    setDetail(null);
    api.get(`/orders/mine/${o.id}`)
      .then((r) => setDetail(r.data))
      .catch((err) => {
        toast.error(formatApiError(err));
        setSelected(null);
      });
  };

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await api.put(`/orders/mine/${detail.id}/cancel`);
      toast.success("Pedido cancelado. El stock fue repuesto.");
      setDetail((d) => ({ ...d, status: "cancelado" }));
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? { ...o, status: "cancelado" } : o)));
      setConfirmCancel(false);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  if (customer === null) return <PageLoader />;
  if (customer === false) return <Navigate to="/cuenta/entrar?redirect=/mis-pedidos" replace />;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Cuenta</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none">Mis Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="border border-white/10 bg-[#0E0E0E] p-16 text-center">
          <Package className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <div className="font-display font-bold text-2xl uppercase">Aún no tienes pedidos</div>
          <Link to="/tienda" className="inline-block mt-6 bg-[#10B981] hover:bg-[#34D399] text-black px-6 py-3 font-display uppercase tracking-widest font-bold">
            Empezar a comprar
          </Link>
        </div>
      ) : (
        <div className="border border-white/10 bg-[#0E0E0E]">
          {orders.map((o) => {
            const s = STATUS[o.status] || STATUS.pendiente;
            return (
              <button
                key={o.id}
                onClick={() => openDetail(o)}
                data-testid={`order-row-${o.order_number}`}
                className="w-full text-left grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <div className="font-mono text-xs text-zinc-500">{o.order_number}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">
                    {new Date(o.created_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold border px-2 py-0.5 ${s.c}`}>{s.l}</span>
                <div className="timer text-xl text-[#10B981]">{money(o.total)}</div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" data-testid="order-detail-modal">
          <div className="w-full max-w-lg bg-[#141414] border border-white/10 p-8 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Detalle</div>
                <h3 className="font-display font-black text-2xl uppercase">{selected.order_number}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)}><X /></button>
            </div>

            {!detail ? (
              <PageLoader variant="list" />
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] uppercase tracking-widest font-bold border px-2 py-0.5 ${(STATUS[detail.status] || STATUS.pendiente).c}`}>
                    {(STATUS[detail.status] || STATUS.pendiente).l}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(detail.created_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                <div className="border border-white/10">
                  {detail.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 text-sm">
                      <div className="min-w-0">
                        <div className="truncate">{i.product_name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{i.product_sku} · ×{i.quantity}</div>
                      </div>
                      <div className="timer">{money(i.subtotal)}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-white/10 mt-4 pt-4 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span className="timer">{money(detail.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">IVA</span><span className="timer">{money(detail.tax)}</span></div>
                  <div className="flex justify-between border-t border-white/10 pt-2 items-end">
                    <span className="font-display font-bold uppercase">Total</span>
                    <span className="timer text-2xl text-[#10B981]">{money(detail.total)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-zinc-400 space-y-1">
                  <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Dirección: </span>{detail.shipping_address}</div>
                  {detail.notes && <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Notas: </span>{detail.notes}</div>}
                  <div><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Referencia: </span><span className="font-mono">{detail.payment_ref}</span></div>
                </div>

                {CANCELABLE.includes(detail.status) && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <DangerButton
                      type="button"
                      data-testid="cancel-order-btn"
                      className="w-full"
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancelar pedido
                    </DangerButton>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar pedido"
        message="El pedido se marcará como cancelado y el stock reservado se repondrá. Esta acción no se puede deshacer."
        confirmLabel={cancelling ? "Cancelando…" : "Sí, cancelar"}
        loading={cancelling}
        onConfirm={cancelOrder}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
