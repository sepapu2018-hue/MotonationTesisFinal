import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ArrowLeft, Check, Minus, Plus, Package, Shield, Truck } from "lucide-react";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function ProductDetail() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.get(`/public/products/${sku}`)
      .then((r) => setProduct(r.data))
      .catch(() => setProduct(false));
  }, [sku]);

  const onAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (product === null) {
    return <div className="py-32 text-center text-zinc-500 uppercase tracking-widest">Cargando…</div>;
  }
  if (product === false) {
    return (
      <div className="max-w-xl mx-auto py-32 text-center">
        <div className="font-display font-black text-4xl uppercase">Producto no encontrado</div>
        <Link to="/tienda" className="mt-6 inline-flex items-center gap-2 text-[#10B981] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-[#10B981]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0E0E0E] border border-white/10 aspect-square overflow-hidden">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover fade-up" />
          )}
        </div>

        <div className="fade-up" style={{animationDelay:'0.1s'}}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#10B981] font-mono mb-2">
            // {product.type} · {product.brand}
          </div>
          <h1 className="font-display font-black text-5xl uppercase leading-[0.95]">{product.name}</h1>
          <div className="text-zinc-500 font-mono text-xs mt-2">{product.sku} · {product.model}</div>

          <div className="my-8 flex items-end gap-4">
            <div className="timer text-6xl text-[#10B981]">{money(product.price)}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 pb-2">USD · Incluye IVA</div>
          </div>

          <div className="border-y border-white/10 py-4 mb-6">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 ${product.stock > 0 ? "bg-[#10B981] animate-pulse" : "bg-amber-500"}`} />
              <span className="text-sm">
                {product.stock > 0
                  ? <><span className="text-[#10B981] font-bold">En stock</span> · {product.stock} unidades disponibles</>
                  : <span className="text-amber-400 font-bold">Agotado temporalmente</span>}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="text-zinc-300 leading-relaxed mb-8">{product.description}</p>
          )}

          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cantidad</div>
                <div className="flex items-center border border-white/15">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10 hover:bg-white/5">
                    <Minus className="h-4 w-4 mx-auto" />
                  </button>
                  <div className="w-12 text-center timer text-lg" data-testid="qty-display">{qty}</div>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="h-10 w-10 hover:bg-white/5">
                    <Plus className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>

              <button
                onClick={onAdd}
                data-testid="add-to-cart-btn"
                disabled={added}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-display uppercase tracking-widest font-black transition-all ${
                  added ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500" : "bg-[#10B981] hover:bg-[#34D399] text-black"
                }`}
              >
                {added ? (<><Check className="h-5 w-5" /> Agregado al carrito</>) : (<><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>)}
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { icon: Truck, label: "Envío 48-72h" },
              { icon: Shield, label: "Garantía" },
              { icon: Package, label: "Stock real" },
            ].map((b, i) => (
              <div key={i} className="border border-white/10 p-3 text-center">
                <b.icon className="h-4 w-4 text-[#10B981] mx-auto mb-2" />
                <div className="text-[10px] uppercase tracking-widest font-bold">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
