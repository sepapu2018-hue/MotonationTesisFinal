import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

export default function Cart() {
  const { items, updateQuantity, removeItem, totals } = useCart();
  const [removingIds, setRemovingIds] = useState(() => new Set());

  // Deja correr la transición de colapso antes de sacar el item del estado real
  const handleRemove = (productId) => {
    setRemovingIds((prev) => new Set(prev).add(productId));
    setTimeout(() => {
      removeItem(productId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }, 280);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center px-6">
        <ShoppingBag className="h-16 w-16 text-zinc-700 mx-auto mb-6" />
        <div className="font-display font-black text-4xl uppercase">Tu carrito está vacío</div>
        <p className="text-zinc-500 mt-3">Empezá a agregar productos desde la tienda</p>
        <Link to="/tienda" className="inline-block mt-8 bg-[#10B981] hover:bg-[#34D399] text-black px-8 py-3 font-display uppercase tracking-widest font-bold">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Tu pedido</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none">
          Carrito
          <span className="timer text-2xl text-zinc-600 ml-3">[{String(totals.count).padStart(2, "0")}]</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 border border-white/10 bg-[#0E0E0E]" data-testid="cart-items">
          {items.map((i, idx) => {
            const removing = removingIds.has(i.product_id);
            return (
              <div
                key={i.product_id}
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in ${idx !== items.length - 1 ? "border-b border-white/5" : ""}`}
                style={{ gridTemplateRows: removing ? "0fr" : "1fr" }}
              >
                <div className="overflow-hidden">
                  <div
                    className={`grid grid-cols-[80px,1fr,auto] sm:grid-cols-[100px,1fr,auto,auto] gap-4 items-center p-4 transition-all duration-300 ${removing ? "opacity-0 -translate-x-6" : "opacity-100 translate-x-0"}`}
                  >
                    <div className="aspect-square bg-black overflow-hidden">
                      {i.image_url && <img src={i.image_url} alt={i.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-bold uppercase truncate">{i.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{i.sku}</div>
                      <div className="timer text-lg text-[#10B981] mt-1">{money(i.price)}</div>
                      {/* Selector de cantidad en mobile — en desktop se usa la columna aparte de al lado */}
                      <div className="flex sm:hidden items-center border border-white/15 mt-2 w-fit">
                        <button onClick={() => updateQuantity(i.product_id, i.quantity - 1)} data-testid={`cart-qty-minus-${i.sku}`} className="h-8 w-8 hover:bg-white/5">
                          <Minus className="h-3 w-3 mx-auto" />
                        </button>
                        <div className="w-8 text-center timer text-sm">{i.quantity}</div>
                        <button onClick={() => updateQuantity(i.product_id, i.quantity + 1)} data-testid={`cart-qty-plus-${i.sku}`} className="h-8 w-8 hover:bg-white/5">
                          <Plus className="h-3 w-3 mx-auto" />
                        </button>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center border border-white/15">
                      <button onClick={() => updateQuantity(i.product_id, i.quantity - 1)} className="h-9 w-9 hover:bg-white/5">
                        <Minus className="h-3.5 w-3.5 mx-auto" />
                      </button>
                      <div className="w-10 text-center timer">{i.quantity}</div>
                      <button onClick={() => updateQuantity(i.product_id, i.quantity + 1)} className="h-9 w-9 hover:bg-white/5">
                        <Plus className="h-3.5 w-3.5 mx-auto" />
                      </button>
                    </div>
                    <button onClick={() => handleRemove(i.product_id)} data-testid={`cart-remove-${i.sku}`} className="p-2 text-zinc-500 hover:text-amber-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-6 sticky top-24">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">Resumen</div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="timer">{money(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">IVA (15%)</span>
                <span className="timer">{money(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Envío</span>
                <span className="text-emerald-400 uppercase tracking-widest text-xs font-bold">Gratis</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                <span className="font-display font-bold uppercase">Total</span>
                <span className="timer text-3xl text-[#10B981]" data-testid="cart-total">{money(totals.total)}</span>
              </div>
            </div>
            <Link to="/checkout" data-testid="checkout-btn" className="mt-6 w-full block text-center bg-[#10B981] hover:bg-[#34D399] text-black font-display uppercase tracking-widest font-black py-4 transition-colors">
              Finalizar compra
            </Link>
            <Link to="/tienda" className="mt-3 w-full block text-center text-xs uppercase tracking-widest text-zinc-500 hover:text-[#10B981]">
              Seguir comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
