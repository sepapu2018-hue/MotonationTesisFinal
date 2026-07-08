import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, ArrowLeft, Check, Minus, Plus, Package, Shield, Truck, Star, MapPin, Quote } from "lucide-react";
import PageLoader from "@/components/public/PageLoader";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function ProductDetail() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ transform: "scale(1)" });

  const handleImageMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(1.9)" });
  };
  const handleImageLeave = () => setZoomStyle({ transform: "scale(1)" });

  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: "", city: "", rating: 5, text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setProduct(null);
    api.get(`/public/products/${sku}`)
      .then((r) => { setProduct(r.data); setActiveImage(0); })
      .catch(() => setProduct(false));
    api.get(`/public/products/${sku}/reviews`)
      .then((r) => setReviews(r.data))
      .catch(() => setReviews([]));
  }, [sku]);

  const onAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.city.trim() || !reviewForm.text.trim()) {
      toast.error("Completá nombre, ciudad y comentario");
      return;
    }
    setSubmittingReview(true);
    api.post(`/public/products/${sku}/reviews`, reviewForm)
      .then((r) => {
        setReviews((prev) => [r.data, ...prev]);
        setReviewForm({ name: "", city: "", rating: 5, text: "" });
        toast.success("¡Gracias por tu reseña!");
      })
      .catch((err) => toast.error(formatApiError(err)))
      .finally(() => setSubmittingReview(false));
  };

  if (product === null) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <PageLoader variant="detail" />
      </div>
    );
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

  const gallery = [product.image_url, ...(product.images || [])].filter(Boolean);
  const specsEntries = Object.entries(product.specs || {});

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 hover:text-[#10B981]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div
            className="bg-[#0E0E0E] border border-white/10 aspect-square overflow-hidden cursor-zoom-in"
            onMouseMove={handleImageMove}
            onMouseLeave={handleImageLeave}
          >
            {gallery[activeImage] && (
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-150 ease-out"
                style={zoomStyle}
              />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  data-testid={`product-thumb-${i}`}
                  className={`h-16 w-16 border overflow-hidden shrink-0 transition-colors ${activeImage === i ? "border-[#10B981]" : "border-white/10 hover:border-white/30"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
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

      {specsEntries.length > 0 && (
        <section className="mt-16">
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-4">// Ficha técnica</div>
          <div className="border border-white/10 bg-[#0E0E0E] divide-y divide-white/5">
            {specsEntries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 px-5 py-3 text-sm">
                <span className="text-zinc-500">{key}</span>
                <span className="text-zinc-200">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {product.related_products?.length > 0 && (
        <section className="mt-16">
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-4">// Productos relacionados</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.related_products.map((r) => (
              <Link
                key={r.id}
                to={`/producto/${r.sku}`}
                className="group border border-white/10 bg-[#0E0E0E] hover:border-[#10B981] transition-colors overflow-hidden"
              >
                <div className="aspect-square bg-black overflow-hidden">
                  {r.image_url && (
                    <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">{r.brand}</div>
                  <div className="font-display font-bold text-sm uppercase mt-0.5 line-clamp-1">{r.name}</div>
                  <div className="timer text-lg text-[#10B981] mt-1">{money(r.price)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-4">
          // Reseñas {reviews.length > 0 && `(${reviews.length})`}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4">
            {reviews.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-10 border border-white/10 bg-[#0E0E0E]">
                Todavía no hay reseñas de este producto. ¡Sé el primero!
              </div>
            )}
            {reviews.map((r, i) => (
              <div key={r.id} data-testid={`product-review-${i}`} className="border border-white/10 bg-[#0E0E0E] p-6">
                <Quote className="h-6 w-6 text-[#10B981]/30 mb-3" />
                <p className="text-zinc-300 leading-relaxed text-sm">"{r.text}"</p>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold uppercase text-sm">{r.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {r.city}
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(r.rating)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-white/10 bg-[#0E0E0E] p-6">
            <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-4">// Dejá tu reseña</div>
            <form onSubmit={submitReview} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  className="bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm"
                  data-testid="product-review-name"
                />
                <input
                  type="text"
                  placeholder="Tu ciudad"
                  value={reviewForm.city}
                  onChange={(e) => setReviewForm({ ...reviewForm, city: e.target.value })}
                  className="bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm"
                  data-testid="product-review-city"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-zinc-500">Calificación</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })} data-testid={`product-review-star-${n}`}>
                      <Star className={`h-5 w-5 ${n <= reviewForm.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-zinc-600"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Contanos tu experiencia con este producto..."
                value={reviewForm.text}
                onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                rows={3}
                className="w-full bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm resize-none"
                data-testid="product-review-text"
              />
              <button
                type="submit"
                disabled={submittingReview}
                data-testid="product-review-submit"
                className="w-full bg-[#10B981] hover:bg-[#34D399] disabled:opacity-60 text-black font-display uppercase tracking-widest font-black py-3 transition-colors"
              >
                {submittingReview ? "Enviando..." : "Publicar reseña"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
