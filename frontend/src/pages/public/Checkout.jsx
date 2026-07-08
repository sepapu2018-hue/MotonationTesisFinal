import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { CreditCard, Lock, Minus, Plus, X } from "lucide-react";
import PageLoader from "@/components/public/PageLoader";
import AnimatedCheck from "@/components/public/AnimatedCheck";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export default function Checkout() {
  const { items, totals, clear, updateQuantity, removeItem } = useCart();
  const { customer } = useCustomer();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState(customer?.address || "");
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (items.length === 0 && !success) return <Navigate to="/tienda" replace />;
  if (customer === null) return <PageLoader />;
  if (customer === false) {
    return <Navigate to="/cuenta/entrar?redirect=/checkout" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError("");
    try {
      const { data } = await api.post("/orders/checkout", {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: shippingAddress,
        notes,
      });
      // Simulación: pequeño delay para parecer pasarela real
      await new Promise((r) => setTimeout(r, 1200));
      clear();
      setSuccess(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center fade-up">
        <AnimatedCheck size={88} className="mb-6" />
        <h1 className="font-display font-black text-5xl uppercase">¡Pedido confirmado!</h1>
        <p className="text-zinc-400 mt-4">
          Tu pedido <span className="text-[#10B981] font-mono">{success.order_number}</span> fue procesado correctamente.
        </p>
        <div className="border border-white/10 bg-[#0E0E0E] p-6 mt-8 text-left">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-zinc-500 text-[10px] uppercase tracking-widest">Total</div><div className="timer text-2xl text-[#10B981]">{money(success.total)}</div></div>
            <div><div className="text-zinc-500 text-[10px] uppercase tracking-widest">Referencia</div><div className="font-mono text-xs">{success.payment_ref}</div></div>
            <div className="col-span-2"><div className="text-zinc-500 text-[10px] uppercase tracking-widest">Dirección</div><div>{success.shipping_address}</div></div>
          </div>
        </div>
        <div className="mt-8 flex gap-3 justify-center">
          <button onClick={() => navigate("/mis-pedidos")} className="bg-[#10B981] hover:bg-[#34D399] text-black px-6 py-3 font-display uppercase tracking-widest font-bold">Ver mis pedidos</button>
          <button onClick={() => navigate("/tienda")} className="border border-white/15 hover:border-[#10B981] hover:text-[#10B981] px-6 py-3 font-display uppercase tracking-widest font-bold">Seguir comprando</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Checkout</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none">Finalizar Compra</h1>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">1. Datos de contacto</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Nombre</div><div>{customer.name}</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Email</div><div>{customer.email}</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Teléfono</div><div>{customer.phone || "—"}</div></div>
            </div>
          </div>

          <div className="border border-white/10 bg-[#0E0E0E] p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">2. Envío</div>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold block">Dirección de envío</span>
              <textarea
                required minLength={5}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                placeholder="Calle, número, ciudad, código postal…"
                className="w-full bg-transparent border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
                data-testid="checkout-address"
              />
            </label>
            <label className="block mt-3">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold block">Notas (opcional)</span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Referencias, horario preferido…"
                className="w-full bg-transparent border border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#10B981]"
              />
            </label>
          </div>

          <div className="border border-[#10B981]/30 bg-[#10B981]/5 p-6">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4 flex items-center gap-2">
              <CreditCard className="h-3 w-3" /> 3. Pago
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-10 w-10 bg-[#10B981]/15 border border-[#10B981]/40 flex items-center justify-center">
                <Lock className="h-4 w-4 text-[#10B981]" />
              </div>
              <div>
                <div className="font-bold">Pago seguro simulado</div>
                <div className="text-xs text-zinc-400">Ambiente de demostración</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-6 sticky top-24">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">Resumen</div>
            <div className="space-y-3 mb-4 max-h-64 overflow-auto">
              {items.map((i) => (
                <div key={i.product_id} className="flex items-center gap-2 text-xs">
                  <div className="flex-1 min-w-0 truncate">{i.name}</div>
                  <div className="flex items-center border border-white/15 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(i.product_id, i.quantity - 1)}
                      data-testid={`checkout-qty-minus-${i.sku}`}
                      className="h-6 w-6 hover:bg-white/5"
                    >
                      <Minus className="h-2.5 w-2.5 mx-auto" />
                    </button>
                    <div className="w-6 text-center timer">{i.quantity}</div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(i.product_id, i.quantity + 1)}
                      data-testid={`checkout-qty-plus-${i.sku}`}
                      className="h-6 w-6 hover:bg-white/5"
                    >
                      <Plus className="h-2.5 w-2.5 mx-auto" />
                    </button>
                  </div>
                  <div className="timer w-16 text-right shrink-0">{money(i.price * i.quantity)}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(i.product_id)}
                    data-testid={`checkout-remove-${i.sku}`}
                    className="text-zinc-500 hover:text-amber-400 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span className="timer">{money(totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">IVA</span><span className="timer">{money(totals.tax)}</span></div>
              <div className="flex justify-between border-t border-white/10 pt-3 items-end">
                <span className="font-display font-bold uppercase">Total</span>
                <span className="timer text-3xl text-[#10B981]">{money(totals.total)}</span>
              </div>
            </div>
            {error && <div className="mt-3 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{error}</div>}
            <button
              type="submit"
              disabled={processing}
              data-testid="confirm-order-btn"
              className="mt-5 w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-4 transition-colors flex items-center justify-center gap-2"
            >
              {processing ? "Procesando pago…" : (<><Lock className="h-4 w-4" /> Pagar {money(totals.total)}</>)}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
