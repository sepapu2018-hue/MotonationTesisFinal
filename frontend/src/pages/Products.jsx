import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Plus, Search, Edit2, Trash2, X, Package, Filter, ChevronLeft, ChevronRight, Image as ImageIcon, ArrowUpRight } from "lucide-react";

const PAGE_SIZE = 20;
const MAX_IMAGE_DATA_URL_LENGTH = 1.5 * 1024 * 1024; // ~1.5MB en base64, generoso tras comprimir
const MAX_GALLERY_IMAGES = 6;

const empty = {
  sku: "", name: "", type: "motocicleta", brand: "", model: "",
  category_id: "", price: 0, stock: 0, min_stock: 5, image_url: "", images: [], description: "",
};

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

// Redimensiona/comprime la imagen elegida en el navegador antes de guardarla como data URL,
// así no dependemos de subir el archivo a un servidor de storage externo.
function fileToCompressedDataUrl(file, maxSize = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [specsList, setSpecsList] = useState([]);
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
    }
  }, [q, typeFilter, page]);

  useEffect(() => { load(); }, [load]);
  // Vuelve a la página 1 cuando cambian los filtros de búsqueda/tipo
  useEffect(() => { setPage(1); }, [q, typeFilter]);
  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)).catch((err) => toast.error(formatApiError(err))); }, []);

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
    setSpecsList([]);
    setError("");
    setImageError("");
    setGalleryError("");
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ ...p, images: p.images || [] });
    setSpecsList(Object.entries(p.specs || {}).map(([key, value]) => ({ key, value })));
    setError("");
    setImageError("");
    setGalleryError("");
    setShowForm(true);
  };

  const goAdjustStock = () => {
    if (!editing) return;
    setShowForm(false);
    navigate(`/admin/movimientos?new=1&product_id=${editing.id}&type=ajuste`);
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo despues
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("El archivo debe ser una imagen");
      return;
    }
    setImageError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setImageError("La imagen es muy grande incluso comprimida, probá con otra");
        return;
      }
      setForm((f) => ({ ...f, image_url: dataUrl }));
    } catch (err) {
      setImageError(err.message);
    }
  };

  const handleGalleryFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setGalleryError("El archivo debe ser una imagen");
      return;
    }
    if (form.images.length >= MAX_GALLERY_IMAGES) {
      setGalleryError(`Máximo ${MAX_GALLERY_IMAGES} imágenes en la galería`);
      return;
    }
    setGalleryError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        setGalleryError("La imagen es muy grande incluso comprimida, probá con otra");
        return;
      }
      setForm((f) => ({ ...f, images: [...f.images, dataUrl] }));
    } catch (err) {
      setGalleryError(err.message);
    }
  };

  const removeGalleryImage = (idx) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const addSpecRow = () => setSpecsList((list) => [...list, { key: "", value: "" }]);
  const updateSpecRow = (idx, field, val) => {
    setSpecsList((list) => list.map((s, i) => (i === idx ? { ...s, [field]: val } : s)));
  };
  const removeSpecRow = (idx) => setSpecsList((list) => list.filter((_, i) => i !== idx));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const specs = Object.fromEntries(
        specsList.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value])
      );
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        specs,
      };
      let savedId;
      if (editing) {
        const { data } = await api.put(`/products/${editing.id}`, payload);
        savedId = data?.id ?? editing.id;
      } else {
        const { data } = await api.post("/products", payload);
        savedId = data?.id;
      }
      setShowForm(false);
      await load();
      setHighlightId(savedId);
      setTimeout(() => setHighlightId(null), 1800);
    } catch (err) {
      setError(formatApiError(err));
    }
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
            <span className="timer text-2xl text-zinc-600">[{String(total).padStart(3, "0")}]</span>
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
                            <button onClick={() => openEdit(p)} className="p-2 hover:text-[#10B981] transition-colors" data-testid={`edit-${p.sku}`}>
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => setToDelete(p)} className="p-2 hover:text-red-400 transition-colors" data-testid={`delete-${p.sku}`}>
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
              <Field label={editing ? "Stock" : "Stock inicial"}>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <div className={inputClass() + " flex-1 text-zinc-400"} data-testid="form-stock-readonly">{form.stock}</div>
                    <GhostButton type="button" onClick={goAdjustStock} className="whitespace-nowrap px-3 text-xs" testid="goto-adjust-stock">
                      Ajustar <ArrowUpRight className="h-3.5 w-3.5 inline -mt-0.5 ml-0.5" />
                    </GhostButton>
                  </div>
                ) : (
                  <input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass()} data-testid="form-stock" />
                )}
              </Field>
              <Field label="Stock mínimo"><input type="number" min="0" required value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className={inputClass()} data-testid="form-min-stock" /></Field>
              <div className="col-span-2">
                <Field label="Imagen del producto">
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 shrink-0 border border-white/10 bg-black/30 flex items-center justify-center overflow-hidden">
                      {form.image_url ? (
                        <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={form.image_url.startsWith("data:") ? "" : form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder={form.image_url.startsWith("data:") ? "Imagen subida desde archivo" : "https://... (pegar URL de imagen)"}
                        disabled={form.image_url.startsWith("data:")}
                        className={inputClass()}
                        data-testid="form-image"
                      />
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer text-xs font-bold uppercase tracking-widest text-[#10B981] hover:underline">
                          Subir archivo
                          <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" data-testid="form-image-file" />
                        </label>
                        {form.image_url && (
                          <button type="button" onClick={() => setForm((f) => ({ ...f, image_url: "" }))} className="text-xs text-zinc-500 hover:text-red-400" data-testid="form-image-clear">
                            Quitar imagen
                          </button>
                        )}
                      </div>
                      {imageError && <div className="text-xs text-amber-400">{imageError}</div>}
                    </div>
                  </div>
                </Field>
              </div>

              <div className="col-span-2">
                <Field label={`Galería adicional (${form.images.length}/${MAX_GALLERY_IMAGES})`}>
                  <div className="flex flex-wrap items-center gap-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative h-16 w-16 border border-white/10 bg-black/30 overflow-hidden group">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(idx)}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          data-testid={`gallery-remove-${idx}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {form.images.length < MAX_GALLERY_IMAGES && (
                      <label className="h-16 w-16 border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#10B981] text-zinc-500 hover:text-[#10B981] transition-colors">
                        <Plus className="h-5 w-5" />
                        <input type="file" accept="image/*" onChange={handleGalleryFile} className="hidden" data-testid="form-gallery-file" />
                      </label>
                    )}
                  </div>
                  {galleryError && <div className="text-xs text-amber-400 mt-2">{galleryError}</div>}
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Ficha técnica">
                  <div className="space-y-2">
                    {specsList.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={s.key}
                          onChange={(e) => updateSpecRow(idx, "key", e.target.value)}
                          placeholder="Ej: Cilindraje"
                          className={inputClass() + " flex-1"}
                          data-testid={`spec-key-${idx}`}
                        />
                        <input
                          value={s.value}
                          onChange={(e) => updateSpecRow(idx, "value", e.target.value)}
                          placeholder="Ej: 150cc"
                          className={inputClass() + " flex-1"}
                          data-testid={`spec-value-${idx}`}
                        />
                        <button type="button" onClick={() => removeSpecRow(idx)} className="p-2 text-zinc-500 hover:text-red-400" data-testid={`spec-remove-${idx}`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSpecRow}
                      className="text-xs font-bold uppercase tracking-widest text-[#10B981] hover:underline flex items-center gap-1"
                      data-testid="add-spec-row"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agregar especificación
                    </button>
                  </div>
                </Field>
              </div>

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
