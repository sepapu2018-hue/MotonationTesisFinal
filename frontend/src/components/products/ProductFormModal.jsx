import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { PrimaryButton, GhostButton, Field, inputClass } from "@/components/ui-kit";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { Plus, X, ImageIcon, ArrowUpRight } from "lucide-react";

const MAX_IMAGE_DATA_URL_LENGTH = 1.5 * 1024 * 1024; // ~1.5MB en base64, generoso tras comprimir
const MAX_GALLERY_IMAGES = 6;

const empty = {
  sku: "", name: "", type: "motocicleta", brand: "", model: "",
  category_id: "", price: 0, stock: 0, min_stock: 5, image_url: "", images: [], description: "",
};

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

// Modal de creación/edición de producto — extraído de Products.jsx (que mezclaba
// esto con la tabla, filtros y paginación en un solo archivo de 570+ líneas).
export default function ProductFormModal({ open, editing, cats, onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [galleryError, setGalleryError] = useState("");
  const [specsList, setSpecsList] = useState([]);
  const formDialogRef = useDialogA11y(open, onClose);

  // Carga los datos del producto a editar (o el formulario vacío) cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({ ...editing, images: editing.images || [] });
      setSpecsList(Object.entries(editing.specs || {}).map(([key, value]) => ({ key, value })));
    } else {
      setForm({ ...empty, category_id: cats[0]?.id || "" });
      setSpecsList([]);
    }
    setError("");
    setImageError("");
    setGalleryError("");
  }, [open, editing, cats]);

  if (!open) return null;

  const goAdjustStock = () => {
    if (!editing) return;
    onClose();
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
        setImageError("La imagen es muy grande incluso comprimida, prueba con otra");
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
        setGalleryError("La imagen es muy grande incluso comprimida, prueba con otra");
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
      onSaved(savedId);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" data-testid="product-modal">
      <form
        ref={formDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        onSubmit={save}
        className="w-full max-w-2xl bg-[#141414] border border-white/10 p-8 max-h-[90vh] overflow-auto outline-none"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// {editing ? "Editar" : "Crear"}</div>
            <h3 id="product-modal-title" className="font-display font-black text-2xl uppercase">{editing ? "Editar Producto" : "Nuevo Producto"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" data-testid="close-modal"><X /></button>
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
                    <ImageIcon className="h-6 w-6 text-zinc-400" />
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
                    <img src={img} alt={`Imagen de galería ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      aria-label={`Quitar imagen de galería ${idx + 1}`}
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
                    <button type="button" onClick={() => removeSpecRow(idx)} aria-label="Quitar ficha técnica" className="p-2 text-zinc-500 hover:text-red-400" data-testid={`spec-remove-${idx}`}>
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
          <GhostButton type="button" onClick={onClose} testid="cancel-button">Cancelar</GhostButton>
          <PrimaryButton type="submit" testid="save-button">Guardar</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
