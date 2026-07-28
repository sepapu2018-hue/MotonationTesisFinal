import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import ConfirmDialog from "@/components/ConfirmDialog";
import ProductFormModal from "@/components/products/ProductFormModal";
import { formatCurrency as money } from "@/lib/utils";
import PageLoader from "@/components/public/PageLoader";
import { Plus, Search, Edit2, Trash2, Package, Filter, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

const PAGE_SIZE = 20;

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (q) params.q = q;
      if (typeFilter) params.type = typeFilter;
      const { data } = await api.get("/products", { params });
      setItems(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [q, typeFilter, page]);

  useEffect(() => { load(); }, [load]);
  // Vuelve a la página 1 cuando cambian los filtros de búsqueda/tipo
  useEffect(() => { setPage(1); }, [q, typeFilter]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)).catch((err) => toast.error(formatApiError(err))); }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setShowForm(true);
  }, []);
  const openEdit = (p) => {
    setEditing(p);
    setShowForm(true);
  };
  const closeForm = useCallback(() => setShowForm(false), []);

  // Soporte para FAB: ?new=1 abre el modal automáticamente
  useEffect(() => {
    if (searchParams.get("new") === "1" && isAdmin && cats.length > 0) {
      openCreate();
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAdmin, cats.length]);

  const handleSaved = (savedId) => {
    setShowForm(false);
    load();
    setHighlightId(savedId);
    setTimeout(() => setHighlightId(null), 1800);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete.id}`);
      toast.success(`Producto "${toDelete.name}" eliminado`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const catName = (id) => cats.find((c) => c.id === id)?.name || "—";

  // Mini-stats laterales (calculadas del set filtrado)
  const sideStats = useMemo(() => {
    const total = items.length;
    const lowCount = items.filter((p) => p.stock <= p.min_stock).length;
    const value = items.reduce((s, p) => s + p.stock * p.price, 0);
    return { total, lowCount, value };
  }, [items]);

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      {/* Encabezado tipo "ticker" */}
      <div className="flex items-end justify-between gap-4 mb-6" data-testid="products-header">
        <div>
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Inventario · Catálogo</div>
          <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
            Productos
            <span className="timer text-2xl text-zinc-400">[{String(total).padStart(3, "0")}]</span>
          </h1>
        </div>
        {isAdmin && (
          <PrimaryButton testid="new-product-button" onClick={openCreate}>
            <Plus className="h-4 w-4 inline -mt-0.5 mr-1" /> Nuevo
          </PrimaryButton>
        )}
      </div>

      {/* Layout asimétrico: 9 cols tabla + 3 cols lateral */}
      <div className="grid grid-cols-12 gap-4">
        {/* Tabla */}
        <div className="col-span-12 lg:col-span-9 border border-white/10 bg-[#0E0E0E]">
          {/* Filtros inline */}
          <div className="flex flex-wrap gap-3 p-4 border-b border-white/10">
            <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-white/15 px-3 py-2 focus-within:border-[#10B981] transition-colors">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre, SKU, marca…"
                aria-label="Buscar productos por nombre, SKU o marca"
                className="flex-1 bg-transparent outline-none text-sm"
                data-testid="search-input"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={inputClass() + " max-w-[200px]"}
              data-testid="type-filter"
            >
              <option value="">Todos los tipos</option>
              <option value="motocicleta">Motocicletas</option>
              <option value="accesorio">Accesorios</option>
            </select>
          </div>

          {loading ? (
            <div className="p-6"><PageLoader variant="grid" /></div>
          ) : items.length === 0 ? (
            <div className="px-4 py-16 text-center text-zinc-500">Sin productos que coincidan</div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-4" data-testid="products-table">
            {items.map((p) => {
              const lowStock = p.stock <= p.min_stock;
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailProduct(p)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDetailProduct(p); }}
                  className={`group relative border border-white/10 bg-black/20 hover:border-[#10B981]/40 transition-colors cursor-pointer flex flex-col overflow-hidden ${p.id === highlightId ? "row-highlight" : ""}`}
                  data-testid={`row-${p.sku}`}
                >
                  <div className="relative aspect-square bg-black/40 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-zinc-600" /></div>
                    )}
                    <span className="absolute top-2 left-2">
                      <Badge variant={p.type === "motocicleta" ? "info" : "default"}>{p.type}</Badge>
                    </span>
                    {lowStock && (
                      <span className="absolute top-2 right-2"><Badge variant="danger">Bajo</Badge></span>
                    )}
                  </div>

                  <div className="p-3 flex-1">
                    <div className="font-semibold text-sm truncate" title={p.name}>{p.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{p.brand} {p.model}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="timer text-base">{money(p.price)}</span>
                      <span className={`timer text-lg ${lowStock ? "text-amber-400" : "text-zinc-300"}`}>{p.stock}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setDetailProduct(p)} aria-label={`Ver ${p.name}`} className="p-1.5 text-zinc-500 hover:text-white transition-colors" data-testid={`view-${p.sku}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="p-1.5 text-zinc-500 hover:text-[#10B981] transition-colors" data-testid={`edit-${p.sku}`}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setToDelete(p)} aria-label={`Eliminar ${p.name}`} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" data-testid={`delete-${p.sku}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/10 text-sm" data-testid="pagination">
              <span className="text-zinc-500 text-xs">
                Página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} productos
              </span>
              <div className="flex gap-2">
                <GhostButton
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  testid="prev-page"
                  className="px-3 py-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </GhostButton>
                <GhostButton
                  type="button"
                  onClick={() => setPage((p) => (p * PAGE_SIZE < total ? p + 1 : p))}
                  disabled={page * PAGE_SIZE >= total}
                  testid="next-page"
                  className="px-3 py-1.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </GhostButton>
              </div>
            </div>
          )}
        </div>

        {/* Lateral asimétrico — contexto del filtro actual */}
        <aside className="col-span-12 lg:col-span-3 space-y-4">
          <div className="border border-white/10 bg-[#0E0E0E] p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">
              <Filter className="h-3 w-3" /> Resultado actual
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Productos visibles</div>
                <div className="timer text-4xl">{sideStats.total}</div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">En alerta</div>
                <div className={`timer text-4xl ${sideStats.lowCount > 0 ? "text-amber-400" : "text-emerald-400"}`}>{sideStats.lowCount}</div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">Valor visible</div>
                <div className="timer text-2xl truncate">{money(sideStats.value)}</div>
              </div>
            </div>
          </div>

          {/* Tip operativo */}
          <div className="border border-[#10B981]/20 bg-[#10B981]/5 p-5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-2">
              <Package className="h-3 w-3" /> Tip
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Los productos con stock por debajo del mínimo aparecen en <span className="text-amber-400">Bajo stock</span> dentro del Dashboard.
              Registra entradas desde el botón <span className="text-[#10B981]">+</span> flotante.
            </p>
          </div>
        </aside>
      </div>

      <ProductFormModal
        open={showForm}
        editing={editing}
        cats={cats}
        onClose={closeForm}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar producto"
        message={toDelete && `¿Eliminar "${toDelete.name}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setDetailProduct(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            className="w-full max-w-lg bg-[#141414] border border-white/10 p-8 shadow-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="product-detail-modal"
          >
            <div className="flex items-start justify-between mb-6 gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {detailProduct.image_url && (
                  <img src={detailProduct.image_url} alt="" className="h-16 w-16 object-cover border border-white/10 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Ficha de producto</div>
                  <h3 id="product-detail-title" className="font-display font-black text-xl uppercase truncate">{detailProduct.name}</h3>
                  <div className="text-xs text-zinc-500 truncate">{detailProduct.brand} {detailProduct.model}</div>
                </div>
              </div>
              <button type="button" onClick={() => setDetailProduct(null)} aria-label="Cerrar" className="text-zinc-500 hover:text-white shrink-0"><X /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">SKU</div>
                <div className="font-mono text-zinc-200">{detailProduct.sku}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Tipo</div>
                <Badge variant={detailProduct.type === "motocicleta" ? "info" : "default"}>{detailProduct.type}</Badge>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Categoría</div>
                <div className="text-zinc-200">{catName(detailProduct.category_id)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Precio</div>
                <div className="timer text-xl">{money(detailProduct.price)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Stock</div>
                <div className={`timer text-xl ${detailProduct.stock <= detailProduct.min_stock ? "text-amber-400" : ""}`}>
                  {detailProduct.stock} <span className="text-xs text-zinc-500 font-sans">/ {detailProduct.min_stock} mín.</span>
                </div>
              </div>
            </div>

            {detailProduct.description && (
              <div className="mb-6">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Descripción</div>
                <p className="text-sm text-zinc-300 leading-relaxed">{detailProduct.description}</p>
              </div>
            )}

            {detailProduct.specs && Object.keys(detailProduct.specs).length > 0 && (
              <div className="mb-6">
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Ficha técnica</div>
                <div className="border border-white/10 divide-y divide-white/5">
                  {Object.entries(detailProduct.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-zinc-500">{key}</span>
                      <span className="text-zinc-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <GhostButton type="button" onClick={() => setDetailProduct(null)}>Cerrar</GhostButton>
              {isAdmin && (
                <PrimaryButton type="button" onClick={() => { setDetailProduct(null); openEdit(detailProduct); }}>
                  <Edit2 className="h-4 w-4 inline -mt-0.5 mr-1" /> Editar
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
