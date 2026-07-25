import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, PageHeader, PrimaryButton, GhostButton, Field, inputClass, Badge } from "@/components/ui-kit";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { Trash2, UserPlus, Upload, X, Pencil, Edit2 } from "lucide-react";

export const PERMISSION_OPTIONS = [
  { id: 'view_dashboard',  label: 'Ver Dashboard' },
  { id: 'view_products',   label: 'Ver Productos' },
  { id: 'view_categories', label: 'Ver Categorías' },
  { id: 'view_suppliers',  label: 'Ver Proveedores' },
  { id: 'create_sale',     label: 'Registrar Ventas / Movimientos' },
  { id: 'view_kardex',     label: 'Ver Kárdex' },
  { id: 'view_orders',     label: 'Ver Pedidos' },
  { id: 'view_reviews',    label: 'Ver Reseñas' },
  { id: 'view_alerts',     label: 'Ver Alertas' },
  { id: 'view_reports',    label: 'Ver Reportes' },
];

// Mismas reglas que el backend (routes/users.js) para dar feedback antes de llamar a la API.
const createUserSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().min(1, "El nombre es obligatorio"),
  role: z.enum(["admin", "empleado"]),
  permissions: z.array(z.string()).default([]),
});

const editUserSchema = z.object({
  email: z.string().email("Correo inválido"),
  name: z.string().min(1, "El nombre es obligatorio"),
  role: z.enum(["admin", "empleado"]),
  permissions: z.array(z.string()).default([]),
  password: z.union([z.string().min(6, "Mínimo 6 caracteres"), z.literal("")]).optional(),
});

// Convierte un archivo a base64 (data URL). Limita a 800KB.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 800 * 1024) {
      reject(new Error("La imagen supera los 800KB. Comprímela e intenta de nuevo."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Checklist de permisos reutilizable entre el form de creación y el de edición.
function PermissionChecklist({ selected, onToggle }) {
  return (
    <div className="space-y-2 mt-2">
      <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Permisos Específicos</label>
      <div className="grid grid-cols-1 gap-2 border border-white/10 p-3 bg-[#0E0E0E]">
        {PERMISSION_OPTIONS.map((p) => (
          <label key={p.id} className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              className="accent-[#10B981]"
              checked={selected?.includes(p.id) || false}
              onChange={(e) => onToggle(p.id, e.target.checked)}
            />
            {p.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Users() {
  const { user: me, refresh } = useAuth();
  const [users, setUsers] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const createForm = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: "", password: "", name: "", role: "empleado", permissions: [] },
  });

  const [editing, setEditing] = useState(null);
  const closeEdit = useCallback(() => setEditing(null), []);
  const editDialogRef = useDialogA11y(Boolean(editing), closeEdit);
  const [editError, setEditError] = useState("");
  const editForm = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: { email: "", name: "", role: "empleado", permissions: [], password: "" },
  });

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const load = () => api.get("/users").then((r) => setUsers(r.data)).catch((err) => toast.error(formatApiError(err)));
  useEffect(() => { load(); }, []);

  // Filtrado: staff = admin + empleado, customers = customer
  const staff = users.filter((u) => u.role === "admin" || u.role === "empleado");
  const customers = users.filter((u) => u.role === "customer");

  const handleFile = async (e, target = "form") => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToBase64(file);
      if (target === "form") {
        setAvatarUrl(dataUrl);
      } else {
        await api.patch(`/users/${target}`, { avatar_url: dataUrl });
        load();
        if (target === me?.id) refresh();
      }
    } catch (err) {
      setError(err.message || formatApiError(err));
    } finally {
      e.target.value = "";
    }
  };

  const create = async (data) => {
    setError("");
    try {
      const { data: created } = await api.post("/users", { ...data, avatar_url: avatarUrl });
      createForm.reset({ email: "", password: "", name: "", role: "empleado", permissions: [] });
      setAvatarUrl("");
      await load();
      setHighlightId(created?.id);
      setTimeout(() => setHighlightId(null), 1800);
    } catch (err) { setError(formatApiError(err)); }
  };

  const removeAvatar = async (u) => {
    await api.patch(`/users/${u.id}`, { avatar_url: "" });
    load();
    if (u.id === me?.id) refresh();
  };

  const openEdit = (u) => {
    setEditing(u);
    editForm.reset({ email: u.email, name: u.name, role: u.role, permissions: u.permissions || [], password: "" });
    setEditError("");
  };

  const saveEdit = async (data) => {
    setEditError("");
    try {
      const payload = { ...data };
      if (!payload.password) delete payload.password;
      await api.put(`/users/${editing.id}`, payload);
      const editedId = editing.id;
      setEditing(null);
      await load();
      setHighlightId(editedId);
      setTimeout(() => setHighlightId(null), 1800);
      if (editedId === me?.id) refresh();
    } catch (err) { setEditError(formatApiError(err)); }
  };

  // Detecta si es customer y llama a la ruta correcta
  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      if (toDelete.role === "customer") {
        await api.delete(`/customer/${toDelete.id}`);
      } else {
        await api.delete(`/users/${toDelete.id}`);
      }
      toast.success(`Usuario "${toDelete.email}" eliminado`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const createPermissions = createForm.watch("permissions");
  const toggleCreatePermission = (id, checked) => {
    const current = createForm.getValues("permissions") || [];
    createForm.setValue("permissions", checked ? [...current, id] : current.filter((item) => item !== id), { shouldValidate: true });
  };

  const editPermissions = editForm.watch("permissions");
  const toggleEditPermission = (id, checked) => {
    const current = editForm.getValues("permissions") || [];
    editForm.setValue("permissions", checked ? [...current, id] : current.filter((item) => item !== id), { shouldValidate: true });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <PageHeader kicker="Administración" title="Usuarios" testid="users-header" count={users.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: tablas de staff y clientes */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* ── Tabla: Personal Administrativo ── */}
          <Card>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Personal Administrativo
                <span className="ml-2 text-zinc-400">({staff.length})</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="users-table">
                <thead className="border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                    <th className="px-4 py-3 w-16">Foto</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 w-36 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => (
                    <tr key={u.id} className={`border-b border-white/5 ${u.id === highlightId ? "row-highlight" : ""}`} data-testid={`user-row-${u.email}`}>
                      <td className="px-4 py-3">
                        <label className="inline-block cursor-pointer group relative" title="Cambiar foto">
                          <Avatar src={u.avatar_url} name={u.name} size={40} />
                          <span className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Pencil className="h-3.5 w-3.5 text-white" />
                          </span>
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFile(e, u.id)} />
                        </label>
                      </td>
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant={u.role === "admin" ? "danger" : "info"}>{u.role}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {u.avatar_url && (
                          <button onClick={() => removeAvatar(u)} aria-label={`Quitar foto de ${u.name}`} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"><X className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => openEdit(u)} aria-label={`Editar ${u.name}`} data-testid={`edit-user-${u.email}`} className="p-2 text-zinc-400 hover:text-[#10B981] transition-colors"><Edit2 className="h-4 w-4" /></button>
                        {u.id !== me.id && (
                          <button onClick={() => setToDelete(u)} aria-label={`Eliminar ${u.name}`} className="p-2 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-400 text-xs uppercase tracking-widest">
                        Sin personal registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Tabla: Clientes de la Tienda ── */}
          <Card>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Clientes de la Tienda
                <span className="ml-2 text-zinc-400">({customers.length})</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="customers-table">
                <thead className="border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                    <th className="px-4 py-3 w-16">Foto</th>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 w-36 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((u) => (
                    <tr key={u.id} className="border-b border-white/5" data-testid={`user-row-${u.email}`}>
                      <td className="px-4 py-3">
                        <label className="inline-block cursor-pointer group relative" title="Cambiar foto">
                          <Avatar src={u.avatar_url} name={u.name} size={40} />
                          <span className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Pencil className="h-3.5 w-3.5 text-white" />
                          </span>
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFile(e, u.id)} />
                        </label>
                      </td>
                      <td className="px-4 py-3 font-semibold">{u.name}</td>
                      <td className="px-4 py-3 text-zinc-300">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant="success">{u.role}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {u.avatar_url && (
                          <button onClick={() => removeAvatar(u)} aria-label={`Quitar foto de ${u.name}`} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"><X className="h-4 w-4" /></button>
                        )}
                        {u.id !== me.id && (
                          <button onClick={() => setToDelete(u)} aria-label={`Eliminar ${u.name}`} className="p-2 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-400 text-xs uppercase tracking-widest">
                        Sin clientes registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

        {/* Columna derecha: formulario nuevo usuario */}
        <Card className="p-6">
          <h3 className="font-display uppercase font-bold tracking-wider text-lg mb-4">
            <UserPlus className="h-4 w-4 inline -mt-0.5 mr-1" /> Nuevo Usuario
          </h3>
          <form onSubmit={createForm.handleSubmit(create)} className="space-y-4" noValidate>
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl} name={createForm.watch("name")} size={64} />
              <div className="flex-1 flex flex-col gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-white/15 hover:border-[#10B981] hover:text-[#10B981] text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 justify-center">
                  <Upload className="h-3 w-3" /> Subir foto
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFile(e, "form")} />
              </div>
            </div>

            <Field label="Nombre">
              <input {...createForm.register("name")} className={inputClass()} />
              {createForm.formState.errors.name && <p className="mt-1 text-xs text-amber-400">{createForm.formState.errors.name.message}</p>}
            </Field>
            <Field label="Email">
              <input type="email" {...createForm.register("email")} className={inputClass()} />
              {createForm.formState.errors.email && <p className="mt-1 text-xs text-amber-400">{createForm.formState.errors.email.message}</p>}
            </Field>
            <Field label="Contraseña">
              <input type="password" {...createForm.register("password")} className={inputClass()} />
              {createForm.formState.errors.password && <p className="mt-1 text-xs text-amber-400">{createForm.formState.errors.password.message}</p>}
            </Field>
            <Field label="Rol">
              <select {...createForm.register("role")} className={inputClass()}>
                <option value="empleado">Empleado</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <PermissionChecklist selected={createPermissions} onToggle={toggleCreatePermission} />

            {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{error}</div>}
            <PrimaryButton type="submit" className="w-full" disabled={createForm.formState.isSubmitting}>Crear Usuario</PrimaryButton>
          </form>
        </Card>

      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" data-testid="edit-user-modal">
          <form
            ref={editDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-modal-title"
            tabIndex={-1}
            onSubmit={editForm.handleSubmit(saveEdit)}
            className="w-full max-w-lg bg-[#141414] border border-white/10 p-8 max-h-[90vh] overflow-auto outline-none"
            noValidate
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-1">// Editar</div>
                <h3 id="edit-user-modal-title" className="font-display font-black text-2xl uppercase">Editar Usuario</h3>
              </div>
              <button type="button" onClick={closeEdit} aria-label="Cerrar"><X /></button>
            </div>

            <div className="space-y-4">
              <Field label="Nombre">
                <input {...editForm.register("name")} className={inputClass()} />
                {editForm.formState.errors.name && <p className="mt-1 text-xs text-amber-400">{editForm.formState.errors.name.message}</p>}
              </Field>
              <Field label="Email">
                <input type="email" {...editForm.register("email")} className={inputClass()} />
                {editForm.formState.errors.email && <p className="mt-1 text-xs text-amber-400">{editForm.formState.errors.email.message}</p>}
              </Field>
              <Field label="Nueva contraseña (opcional)">
                <input type="password" placeholder="Dejar en blanco para no cambiarla" {...editForm.register("password")} className={inputClass()} />
                {editForm.formState.errors.password && <p className="mt-1 text-xs text-amber-400">{editForm.formState.errors.password.message}</p>}
              </Field>
              <Field label="Rol">
                <select {...editForm.register("role")} className={inputClass()}>
                  <option value="empleado">Empleado</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              <PermissionChecklist selected={editPermissions} onToggle={toggleEditPermission} />
            </div>

            {editError && <div className="mt-4 border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{editError}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <GhostButton type="button" onClick={closeEdit}>Cancelar</GhostButton>
              <PrimaryButton type="submit" disabled={editForm.formState.isSubmitting}>Guardar cambios</PrimaryButton>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        message={toDelete && `¿Eliminar usuario "${toDelete.email}"? Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
