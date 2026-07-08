import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { Search, Filter, X, ShoppingCart, Sparkles } from "lucide-react";
import PageLoader from "@/components/public/PageLoader";
import { useTilt } from "@/hooks/useTilt";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [debouncedPrice, setDebouncedPrice] = useState({ min: minPrice, max: maxPrice });
  const { addItem } = useCart();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPrice({ min: minPrice, max: maxPrice }), 400);
    return () => clearTimeout(t);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    api.get("/public/brands").then((r) => setBrands(r.data)).catch(() => setBrands([]));
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

  const type = searchParams.get("type") || "";
  const categoryId = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const sort = searchParams.get("sort") || "newest";

  useEffect(() => {
    api.get("/public/categories").then((r) => setCats(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { in_stock: "true" };
    if (debouncedQ) params.q = debouncedQ;
    if (type) params.type = type;
    if (categoryId) params.category_id = categoryId;
    if (brand) params.brand = brand;
    if (debouncedPrice.min) params.min_price = debouncedPrice.min;
    if (debouncedPrice.max) params.max_price = debouncedPrice.max;
    api.get("/public/products", { params })
      .then((r) => setProducts(r.data))
      .catch((err) => toast.error(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [debouncedQ, type, categoryId, brand, debouncedPrice]);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price-asc") arr.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") arr.sort((a, b) => b.price - a.price);
    if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [products, sort]);

  const setParam = (k, v) => {
    const np = new URLSearchParams(searchParams);
    if (v) np.set(k, v); else np.delete(k);
    setSearchParams(np, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
    setMinPrice("");
    setMaxPrice("");
  };
  const hasFilters = type || categoryId || q || brand || minPrice || maxPrice;

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Catálogo</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none">
          Tienda
          <span className="timer text-2xl text-zinc-600 ml-3">[{String(sorted.length).padStart(3, "0")}]</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar filtros */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Filtros
            </div>
            <div className="flex items-center gap-2 border border-white/15 px-3 py-2 mb-4 focus-within:border-[#10B981]">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="flex-1 bg-transparent outline-none text-sm"
                data-testid="shop-search"
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Tipo</div>
                <div className="space-y-1">
                  {[
                    { v: "", l: "Todos" },
                    { v: "motocicleta", l: "Motocicletas" },
                    { v: "accesorio", l: "Accesorios" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setParam("type", opt.v)}
                      className={`w-full text-left px-3 py-2 text-xs uppercase tracking-widest font-bold transition-colors border-l-2 ${
                        type === opt.v ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]" : "border-transparent text-zinc-400 hover:text-white"
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Categoría</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setParam("category", "")}
                    className={`w-full text-left px-3 py-2 text-xs uppercase tracking-widest font-bold border-l-2 ${
                      !categoryId ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]" : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                  >
                    Todas
                  </button>
                  {cats.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setParam("category", c.id)}
                      className={`w-full text-left px-3 py-2 text-xs uppercase tracking-widest font-bold border-l-2 flex items-center justify-between ${
                        categoryId === c.id ? "border-[#10B981] bg-[#10B981]/5 text-[#10B981]" : "border-transparent text-zinc-400 hover:text-white"
                      }`}
                    >
                      {c.name} <span className="text-zinc-600">{c.product_count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {brands.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Marca</div>
                  <select
                    value={brand}
                    onChange={(e) => setParam("brand", e.target.value)}
                    className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs uppercase tracking-widest font-bold focus:outline-none focus:border-[#10B981]"
                    data-testid="shop-brand-filter"
                  >
                    <option value="">Todas</option>
                    {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Precio (USD)</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Mín"
                    className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                    data-testid="shop-min-price"
                  />
                  <span className="text-zinc-600">—</span>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Máx"
                    className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs focus:outline-none focus:border-[#10B981]"
                    data-testid="shop-max-price"
                  />
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full mt-3 px-3 py-2 border border-white/15 text-[10px] uppercase tracking-widest font-bold hover:border-[#10B981] hover:text-[#10B981] flex items-center justify-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Grilla productos */}
        <section className="col-span-12 lg:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-zinc-500 uppercase tracking-widest">
              {sorted.length} {sorted.length === 1 ? "resultado" : "resultados"}
            </div>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value)}
              className="bg-transparent border border-white/15 px-3 py-2 text-xs uppercase tracking-widest font-bold focus:outline-none focus:border-[#10B981]"
              data-testid="shop-sort"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>

          {loading ? (
            <PageLoader variant="grid" />
          ) : sorted.length === 0 ? (
            <div className="border border-white/10 bg-[#0E0E0E] py-20 text-center">
              <div className="font-display font-black text-3xl uppercase">Sin resultados</div>
              <p className="text-zinc-500 mt-2">Probá con otros filtros</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="shop-grid">
              {sorted.map((p, i) => (
                <ProductCard key={p.id} p={p} i={i} onQuickAdd={quickAdd} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ p, i, onQuickAdd }) {
  const tilt = useTilt(6);
  // Señales reales, no arbitrarias: "Últimas" por stock bajo real, "Nuevo" por fecha de alta real
  const isNew = p.created_at && (Date.now() - new Date(p.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000;
  const badge = p.stock <= 3 ? "LAST" : isNew ? "NEW" : null;
  const badgeColor = badge === "LAST" ? "bg-red-500 text-white"
                  : badge === "NEW" ? "bg-[#10B981] text-black" : "";

  return (
    <div className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
    <Link
      to={`/producto/${p.sku}`}
      data-testid={`product-card-${p.sku}`}
      className="group relative bg-[#0E0E0E] border border-white/10 hover:border-[#10B981] transition-all overflow-hidden [transform-style:preserve-3d]"
      style={tilt.style}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
    >
      {badge && (
        <div className={`absolute top-3 left-3 z-10 ${badgeColor} text-[10px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1`}>
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
          onClick={(e) => onQuickAdd(e, p)}
          disabled={p.stock <= 0}
          data-testid={`quick-add-${p.sku}`}
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all bg-[#10B981] hover:bg-[#34D399] disabled:bg-zinc-700 text-black font-display uppercase tracking-widest font-black text-[10px] px-3 py-2 flex items-center gap-1.5"
        >
          <ShoppingCart className="h-3 w-3" /> Agregar
        </button>
      </div>
      <div className="p-4">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">{p.brand}</div>
        <div className="font-display font-bold text-base uppercase mt-1 line-clamp-1">{p.name}</div>
        <div className="flex items-end justify-between mt-3">
          <div className="timer text-2xl text-[#10B981]">{money(p.price)}</div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">Stock {p.stock}</div>
        </div>
      </div>
    </Link>
    </div>
  );
}
