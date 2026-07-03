import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import {
  ArrowRight, Zap, Shield, Truck, Award, Star, Quote,
  Flame, Sparkles, MapPin, Phone, Mail, ShoppingCart,
} from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=2000&q=80";
const COLLECTION_MOTO = "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1400&q=80";
const COLLECTION_GEAR = "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1400&q=80";

const BRANDS = ["YAMAHA", "HONDA", "SUZUKI", "KAWASAKI", "BMW MOTORRAD", "DUCATI", "KTM", "HARLEY-DAVIDSON", "TRIUMPH", "APRILIA", "ROYAL ENFIELD", "INDIAN"];

const STATS = [
  { value: "15+", label: "Años en el mercado" },
  { value: "8.500", label: "Clientes felices" },
  { value: "120+", label: "Modelos disponibles" },
  { value: "24/7", label: "Las 24 hora" },
];

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [cats, setCats] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ name: "", city: "", rating: 5, text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    api.get("/public/featured").then((r) => setFeatured(r.data)).catch((err) => toast.error(formatApiError(err)));
    api.get("/public/categories").then((r) => setCats(r.data)).catch((err) => toast.error(formatApiError(err)));
    api.get("/public/reviews").then((r) => setReviews(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  const quickAdd = (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stock <= 0) return;
    addItem(p, 1);
    toast.success(`${p.name} agregado al carrito`, {
      description: "Revisa tu carrito para finalizar la compra",
    });
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.city.trim() || !reviewForm.text.trim()) {
      toast.error("Completá todos los campos");
      return;
    }
    setSubmittingReview(true);
    api.post("/public/reviews", reviewForm)
      .then((r) => {
        setReviews((prev) => [r.data, ...prev].slice(0, 3));
        setReviewForm({ name: "", city: "", rating: 5, text: "" });
        toast.success("¡Gracias por tu reseña!", { description: "Ya se publicó en la página" });
      })
      .catch((err) => {
        toast.error(formatApiError ? formatApiError(err) : "No se pudo enviar la reseña");
      })
      .finally(() => setSubmittingReview(false));
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 hero-zoom" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
        <div className="absolute inset-0 circuit-grid opacity-50" />

        <div className="relative h-full max-w-[1400px] mx-auto px-6 flex items-center">
          <div className="max-w-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#10B981] mb-6 fade-up">
              <span className="inline-block h-2 w-2 bg-[#10B981] mr-2 animate-pulse" />
              Nueva colección 2026
            </div>
            <h1 className="font-display font-black text-6xl md:text-8xl uppercase leading-[0.85] tracking-tight fade-up">
              Domina<br />cada<br />
              <span className="text-[#10B981]">curva</span>
            </h1>
            <p className="text-zinc-300 text-lg mt-6 max-w-lg leading-relaxed fade-up" style={{ animationDelay: '0.2s' }}>
              Las mejores marcas de motocicletas y equipamiento premium. Selección curada por expertos. Envío a todo Ecuador.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 fade-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/tienda" data-testid="hero-shop-btn"
                className="group bg-[#10B981] hover:bg-[#34D399] text-black font-display uppercase tracking-widest font-black px-8 py-4 transition-all flex items-center gap-3">
                Ver catálogo <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/tienda?type=motocicleta"
                className="border border-white/30 hover:border-[#10B981] hover:text-[#10B981] font-display uppercase tracking-widest font-bold px-8 py-4 transition-colors">
                Motocicletas
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500">
          <div className="text-[10px] uppercase tracking-widest font-mono">Scroll</div>
          <div className="w-px h-12 bg-gradient-to-b from-zinc-500 to-transparent animate-pulse" />
        </div>
      </section>

      {/* Beneficios — banda */}
      <section className="border-y border-white/10 bg-[#0E0E0E]">
        <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Envío rápido", desc: "Todo Ecuador en 48-72h" },
            { icon: Shield, title: "Garantía oficial", desc: "Cobertura completa" },
            { icon: Zap, title: "Stock en vivo", desc: "Inventario en tiempo real" },
            { icon: Award, title: "Marcas premium", desc: "Solo lo mejor del mercado" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-12 w-12 border border-[#10B981]/30 bg-[#10B981]/5 flex items-center justify-center">
                <b.icon className="h-5 w-5 text-[#10B981]" />
              </div>
              <div>
                <div className="font-display font-bold uppercase text-sm">{b.title}</div>
                <div className="text-xs text-zinc-500">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MARCAS — ticker infinito */}
      <section className="border-b border-white/10 bg-black py-8 overflow-hidden">
        <div className="text-center mb-6">
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em]">// Distribuidores oficiales</div>
        </div>
        <div className="relative">
          <div className="flex ticker-track whitespace-nowrap gap-12 px-6">
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <div key={i} className="font-display font-black text-3xl md:text-4xl uppercase text-zinc-700 hover:text-[#10B981] transition-colors shrink-0">
                {brand}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" />
        </div>
      </section>

      {/* COLECCIONES — split banner */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Colecciones</div>
            <h2 className="font-display font-black text-5xl uppercase leading-none">Elegí tu estilo</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/tienda?type=motocicleta" data-testid="collection-moto"
            className="group relative aspect-[16/10] overflow-hidden border border-white/10 hover:border-[#10B981] transition-all">
            <img src={COLLECTION_MOTO} alt="Motocicletas" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#10B981] font-mono mb-2">01 — Motos</div>
              <div className="font-display font-black text-4xl md:text-5xl uppercase leading-none">Motocicletas</div>
              <div className="text-zinc-300 text-sm mt-3 max-w-md">Sport, naked, adventure, scooter. Encontrá la moto que se adapta a tu ruta.</div>
              <div className="mt-5 inline-flex items-center gap-2 text-[#10B981] text-xs uppercase tracking-widest font-bold">
                Explorar <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
          <Link to="/tienda?type=accesorio" data-testid="collection-gear"
            className="group relative aspect-[16/10] overflow-hidden border border-white/10 hover:border-[#10B981] transition-all">
            <img src={COLLECTION_GEAR} alt="Accesorios" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="text-[10px] uppercase tracking-[0.3em] text-[#10B981] font-mono mb-2">02 — Gear</div>
              <div className="font-display font-black text-4xl md:text-5xl uppercase leading-none">Equipamiento</div>
              <div className="text-zinc-300 text-sm mt-3 max-w-md">Cascos, chaquetas, guantes, botas. Seguridad y estilo certificados.</div>
              <div className="mt-5 inline-flex items-center gap-2 text-[#10B981] text-xs uppercase tracking-widest font-bold">
                Explorar <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Categorías */}
      <section className="max-w-[1400px] mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Categorías</div>
            <h2 className="font-display font-black text-5xl uppercase leading-none">Explorá</h2>
          </div>
          <Link to="/tienda" className="text-xs uppercase tracking-widest font-bold text-[#10B981] hover:underline">Ver todo →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cats.map((c, i) => (
            <Link key={c.id} to={`/tienda?category=${c.id}`} data-testid={`category-${c.name}`}
              className="group border border-white/10 bg-[#0E0E0E] hover:border-[#10B981] hover:bg-[#10B981]/5 p-5 transition-all fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-[#10B981] transition-colors">
                {c.product_count} items
              </div>
              <div className="font-display font-bold uppercase text-lg mt-2">{c.name}</div>
              <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{c.description}</div>
              <div className="mt-3 h-0.5 w-6 bg-[#10B981] transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados con badges + quick add */}
      <section className="max-w-[1400px] mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Top del mes</div>
            <h2 className="font-display font-black text-5xl uppercase leading-none">Destacados</h2>
          </div>
          <Link to="/tienda" className="text-xs uppercase tracking-widest font-bold text-[#10B981] hover:underline">Ver todo →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="featured-grid">
          {featured.map((p, i) => {
            const badge = i === 0 ? "HOT" : (p.stock <= 3 ? "LAST" : i % 3 === 1 ? "NEW" : null);
            const badgeColor = badge === "HOT" ? "bg-[#F59E0B] text-black"
                            : badge === "LAST" ? "bg-red-500 text-white"
                            : badge === "NEW" ? "bg-[#10B981] text-black" : "";
            return (
              <Link key={p.id} to={`/producto/${p.sku}`}
                className="group relative bg-[#0E0E0E] border border-white/10 hover:border-[#10B981] transition-all overflow-hidden fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                {badge && (
                  <div className={`absolute top-3 left-3 z-10 ${badgeColor} text-[10px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1`}>
                    {badge === "HOT" && <Flame className="h-3 w-3" />}
                    {badge === "NEW" && <Sparkles className="h-3 w-3" />}
                    {badge}
                  </div>
                )}
                <div className="aspect-[4/3] overflow-hidden bg-black relative">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  )}
                  <button
                    onClick={(e) => quickAdd(e, p)}
                    disabled={p.stock <= 0}
                    data-testid={`quick-add-${p.sku}`}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all bg-[#10B981] hover:bg-[#34D399] disabled:bg-zinc-700 text-black font-display uppercase tracking-widest font-black text-[10px] px-3 py-2 flex items-center gap-1.5"
                  >
                    <ShoppingCart className="h-3 w-3" /> Agregar
                  </button>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500">{p.brand}</div>
                  <div className="font-display font-bold text-lg uppercase mt-1 truncate">{p.name}</div>
                  <div className="flex items-end justify-between mt-4">
                    <div className="timer text-3xl text-[#10B981]">{money(p.price)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">Stock: {p.stock}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* STATS counter */}
      <section className="relative border-y border-white/10 overflow-hidden">
        <div className="absolute inset-0 diag-stripe" />
        <div className="relative max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="timer text-5xl md:text-7xl text-[#10B981] leading-none">{s.value}</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mt-3 font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Voces de la ruta</div>
            <h2 className="font-display font-black text-5xl uppercase leading-none">Lo que dicen<br /><span className="text-[#10B981]">nuestros riders</span></h2>
          </div>
          {reviews.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />)}
              </div>
              <span className="font-display font-bold text-base">
                {(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)}/5
              </span>
              <span className="text-xs text-zinc-600 uppercase tracking-widest">· {reviews.length} reseñas</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Columna izquierda: reseñas */}
          <div className="flex flex-col gap-4">
            {reviews.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-10 border border-white/10 bg-[#0E0E0E]">
                Todavía no hay reseñas. ¡Sé el primero en dejar la tuya!
              </div>
            )}
            {reviews.map((t, i) => (
              <div key={t.id ?? i} data-testid={`testimonial-${i}`}
                className="relative border border-white/10 bg-[#0E0E0E] p-7 hover:border-[#10B981] transition-colors fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <Quote className="h-8 w-8 text-[#10B981]/30 mb-4" />
                <p className="text-zinc-300 leading-relaxed text-sm">"{t.text}"</p>
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold uppercase text-sm">{t.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {t.city}
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Columna derecha: formulario */}
          <div className="border border-white/10 bg-[#0E0E0E] p-7 sticky top-6">
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-4">// Dejá tu reseña</div>
          <form onSubmit={submitReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tu nombre"
                value={reviewForm.name}
                onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                className="bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm"
                data-testid="review-name"
              />
              <input
                type="text"
                placeholder="Tu ciudad"
                value={reviewForm.city}
                onChange={(e) => setReviewForm({ ...reviewForm, city: e.target.value })}
                className="bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm"
                data-testid="review-city"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-zinc-500">Calificación</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    data-testid={`review-star-${n}`}
                  >
                    <Star className={`h-5 w-5 ${n <= reviewForm.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-zinc-600"}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Contanos tu experiencia..."
              value={reviewForm.text}
              onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
              rows={3}
              className="w-full bg-black border border-white/15 focus:border-[#10B981] outline-none px-4 py-3 text-sm resize-none"
              data-testid="review-text"
            />

            <button
              type="submit"
              disabled={submittingReview}
              data-testid="review-submit"
              className="bg-[#10B981] hover:bg-[#34D399] disabled:opacity-50 text-black font-display uppercase tracking-widest font-black px-6 py-3 transition-colors"
            >
              {submittingReview ? "Enviando..." : "Publicar reseña"}
            </button>
          </form>
          </div>

        </div>
      </section>

      {/* CONTACTO RÁPIDO */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: MapPin, title: "Visítanos", line1: "Av. Francisco de Orellana", line2: "Guayaquil · Ecuador" },
            { icon: Phone, title: "Llámanos", line1: "+593 99 999 9999", line2: "Lun a Sáb · 9:00 – 19:00" },
            { icon: Mail, title: "Escríbenos", line1: "contacto@motonation.com", line2: "Respuesta en <24h" },
          ].map((c, i) => (
            <div key={i} className="group border border-white/10 hover:border-[#10B981] bg-[#0E0E0E] p-7 transition-colors fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-12 w-12 border border-[#10B981]/30 bg-[#10B981]/5 flex items-center justify-center mb-5 group-hover:bg-[#10B981] transition-colors">
                <c.icon className="h-5 w-5 text-[#10B981] group-hover:text-black transition-colors" />
              </div>
              <div className="font-display font-bold uppercase text-lg tracking-wide">{c.title}</div>
              <div className="text-sm text-zinc-300 mt-2">{c.line1}</div>
              <div className="text-xs text-zinc-500 mt-1">{c.line2}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="relative border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 diag-stripe" />
        <div className="relative max-w-[1400px] mx-auto px-6 py-20 text-center">
          <h2 className="font-display font-black text-5xl md:text-7xl uppercase leading-none">
            Listos para<br /><span className="text-[#10B981]">acelerar</span>?
          </h2>
          <p className="text-zinc-400 mt-6 max-w-xl mx-auto">
            Encontrá la moto perfecta o el equipamiento que necesitás para tu próxima ruta.
          </p>
          <Link to="/tienda"
            className="inline-flex items-center gap-3 mt-10 bg-[#10B981] hover:bg-[#34D399] text-black font-display uppercase tracking-widest font-black px-10 py-4 transition-colors">
            Empezar a comprar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}