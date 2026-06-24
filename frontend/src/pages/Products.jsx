import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import { Plus, Search, Edit2, Trash2, X, Package, Filter } from "lucide-react";

const empty = {
  sku: "", name: "", type: "motocicleta", brand: "", model: "",
  category_id: "", price: 0, stock: 0, min_stock: 5, image_url: "", description: "",
};

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = {};
    if (q) params.q = q;
    if (typeFilter) params.type = typeFilter;
    const { data } = await api.get("/products", { params });
    setItems(data);
  }, [q, typeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  // Soporte para FAB: ?new=1 abre el modal automáticamente
  useEffect(() => {
    if (searchParams.get("new") === "1" && isAdmin && cats.length > 0) {
      openCreate();
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAdmin, cats.length]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, category_id: cats[0]?.id || "" });
    setError("");
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p });
    setError("");
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
      };
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post("/products", payload);
      setShowForm(false);
      load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const del = async (p) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?`)) return;
    try { await api.delete(`/products/${p.id}`); load(); }
    catch (err) { alert(formatApiError(err)); }
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
            <span className="timer text-2xl text-zinc-600">[{String(items.length).padStart(3, "0")}]</span>
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
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors" data-testid={`row-${p.sku}`}>
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
                            <button onClick={() => openEdit(p)} className="p-2 hover:text-[#10B981] transition-colors" data-testid={`edit-${p.sku}`}>
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => del(p)} className="p-2 hover:text-amber-400 transition-colors" data-testid={`delete-${p.sku}`}>
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

      {/* Modal — sin cambios funcionales */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" data-testid="product-modal">
          <form onSubmit={save} className="w-full max-w-2xl bg-[#141414] border border-white/10 p-8 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// {editing ? "Editar" : "Crear"}</div>
                <h3 className="font-display font-black text-2xl uppercase">{editing ? "Editar Producto" : "Nuevo Producto"}</h3>
              </div>
              <button type="button" onClick={() => setShowForm(false)} data-testid="close-modal"><X /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU"><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass()} data-testid="form-sku" /></Field>
              <Field label="Nombre"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} data-testid="form-name" /></Field>
              <Field label="Tipo">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass()} data-testid="form-type">
                  <option value="motocicleta">Motocicleta</option>
                  <option value="accesorio">Accesorio</option>
                </select>
              </Field>
              <Field label="Categoría">
                <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass()} data-testid="form-category">
                  <option value="">— Seleccionar —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Marca"><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass()} data-testid="form-brand" /></Field>
              <Field label="Modelo"><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass()} data-testid="form-model" /></Field>
              <Field label="Precio (USD)"><input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass()} data-testid="form-price" /></Field>
              <Field label="Stock inicial"><input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass()} data-testid="form-stock" /></Field>
              <Field label="Stock mínimo"><input type="number" min="0" required value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className={inputClass()} data-testid="form-min-stock" /></Field>
              <Field label="URL Imagen"><input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass()} data-testid="form-image" /></Field>
              <div className="col-span-2">
                <Field label="Descripción"><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass()} /></Field>
              </div>
            </div>
            {error && <div className="mt-4 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400" data-testid="form-error">{error}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <GhostButton type="button" onClick={() => setShowForm(false)} testid="cancel-button">Cancelar</GhostButton>
              <PrimaryButton type="submit" testid="save-button">Guardar</PrimaryButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
