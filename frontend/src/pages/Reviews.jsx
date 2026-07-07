import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Trash2, Star } from "lucide-react";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get("/reviews").then((r) => setReviews(r.data)).catch((err) => toast.error(formatApiError(err)));
  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${toDelete.id}`);
      toast.success("Reseña eliminada");
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <PageHeader kicker="Tienda" title="Reseñas" testid="reviews-header" count={reviews.length} />
      <p className="text-xs text-zinc-500 -mt-4 mb-6">
        Los testimonios generales de la Home solo muestran los 3 más recientes (las anteriores se borran automáticamente). Las reseñas ligadas a un producto no tienen ese límite.
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="reviews-table">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Calificación</th>
                <th className="px-4 py-3">Comentario</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.name}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{r.city}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {r.product_name || <span className="text-zinc-600">— General —</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-[360px] truncate">{r.text}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("es", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setToDelete(r)} className="p-2 hover:text-red-400" data-testid={`delete-review-${r.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-600 text-xs uppercase tracking-widest">
                    Sin reseñas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar reseña"
        message={toDelete && `¿Eliminar la reseña de "${toDelete.name}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
