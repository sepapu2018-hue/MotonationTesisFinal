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
import { Plus, Search, Edit2, Trash2, Package, Filter, ChevronLeft, ChevronRight } from "lucide-react";

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
            <div className="p-6"><PageLoader variant="list" /></div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="products-table">
              <thead className="border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const lowStock = p.stock <= p.min_stock;
                  return (
                    <tr key={p.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${p.id === highlightId ? "row-highlight" : ""}`} data-testid={`row-${p.sku}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 object-cover border border-white/10" />}
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-zinc-500">{p.brand} {p.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.sku}</td>
                      <td className="px-4 py-3 text-zinc-300">{catName(p.category_id)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.type === "motocicleta" ? "info" : "default"}>{p.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right timer text-base">{money(p.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`timer text-xl ${lowStock ? "text-amber-400" : ""}`}>{p.stock}</span>
                          {lowStock && <Badge variant="danger">Bajo</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(p)} aria-label={`Editar ${p.name}`} className="p-2 hover:text-[#10B981] transition-colors" data-testid={`edit-${p.sku}`}>
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setToDelete(p)} aria-label={`Eliminar ${p.name}`} className="p-2 hover:text-red-400 transition-colors" data-testid={`delete-${p.sku}`}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Sin productos que coincidan</td></tr>
                )}
              </tbody>
            </table>
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
              Los productos con stock por debajo del mínimo aparecen en <span className="text-amber-400">Alertas</span>.
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
    </div>
  );
}
