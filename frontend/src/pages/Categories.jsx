import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, PageHeader, PrimaryButton, Field, inputClass } from "@/components/ui-kit";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageLoader from "@/components/public/PageLoader";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editError, setEditError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const load = () => api.get("/categories").then((r) => setCats(r.data)).catch((err) => toast.error(formatApiError(err))).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const flashHighlight = (id) => {
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1800);
  };

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/categories", form);
      setForm({ name: "", description: "" });
      await load();
      flashHighlight(data?.id);
    } catch (err) { setError(formatApiError(err)); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${toDelete.id}`);
      toast.success(`Categoría "${toDelete.name}" eliminada`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditForm({ name: c.name, description: c.description || "" });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const saveEdit = async (id) => {
    setEditError("");
    try {
      await api.put(`/categories/${id}`, editForm);
      setEditingId(null);
      await load();
      flashHighlight(id);
    } catch (err) { setEditError(formatApiError(err)); }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <PageHeader kicker="Catálogo" title="Categorías" testid="categories-header" count={cats.length} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="fade-up">
            {loading ? (
              <div className="p-6"><PageLoader variant="list" /></div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="categories-table">
                <thead className="border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map((c) => (
                    <tr key={c.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${c.id === highlightId ? "row-highlight" : ""}`}>
                      {editingId === c.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className={inputClass()}
                              data-testid={`edit-cat-name-${c.id}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className={inputClass()}
                              data-testid={`edit-cat-desc-${c.id}`}
                            />
                            {editError && <div className="mt-1 text-xs text-amber-400">{editError}</div>}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => saveEdit(c.id)} className="p-2 hover:text-[#10B981]" data-testid={`save-cat-${c.id}`}>
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 hover:text-amber-400" data-testid={`cancel-cat-${c.id}`}>
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-semibold">{c.name}</td>
                          <td className="px-4 py-3 text-zinc-400">{c.description || "—"}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {isAdmin && (
                              <>
                                <button onClick={() => startEdit(c)} className="p-2 hover:text-[#10B981]" data-testid={`edit-cat-${c.name}`}>
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => setToDelete(c)} className="p-2 hover:text-red-400" data-testid={`delete-cat-${c.name}`}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </Card>
        </div>

        {isAdmin && (
          <Card className="p-6 fade-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="font-display uppercase font-bold tracking-wider text-lg mb-4">Nueva Categoría</h3>
            <form onSubmit={create} className="space-y-4">
              <Field label="Nombre"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} data-testid="cat-name" /></Field>
              <Field label="Descripción"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass()} data-testid="cat-desc" /></Field>
              {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{error}</div>}
              <PrimaryButton type="submit" testid="cat-create" className="w-full">
                <Plus className="h-4 w-4 inline -mt-0.5 mr-1" /> Crear
              </PrimaryButton>
            </form>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar categoría"
        message={toDelete && `¿Eliminar categoría "${toDelete.name}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}