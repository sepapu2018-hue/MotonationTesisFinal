import { useEffect, useRef, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, PageHeader, PrimaryButton, Field, inputClass, Badge } from "@/components/ui-kit";
import Avatar from "@/components/Avatar";
import { Trash2, UserPlus, Upload, X, Pencil } from "lucide-react";

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

export default function Users() {
  const { user: me, refresh } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "empleado", permissions: [], avatar_url: "" });
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const load = () => api.get("/users").then((r) => setUsers(r.data));
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
        setForm((f) => ({ ...f, avatar_url: dataUrl }));
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

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/users", form);
      setForm({ email: "", password: "", name: "", role: "empleado", permissions: [], avatar_url: "" });
      load();
    } catch (err) { setError(formatApiError(err)); }
  };

  const removeAvatar = async (u) => {
    await api.patch(`/users/${u.id}`, { avatar_url: "" });
    load();
    if (u.id === me?.id) refresh();
  };

  // CORREGIDO: detecta si es customer y llama a la ruta correcta
  const del = async (u) => {
    if (!window.confirm(`Eliminar usuario "${u.email}"?`)) return;
    try {
      if (u.role === "customer") {
        await api.delete(`/customer/${u.id}`);
      } else {
        await api.delete(`/users/${u.id}`);
      }
      load();
    } catch (err) { alert(formatApiError(err)); }
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
                <span className="ml-2 text-zinc-600">({staff.length})</span>
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
                      <td className="px-4 py-3"><Badge variant={u.role === "admin" ? "danger" : "info"}>{u.role}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {u.avatar_url && (
                          <button onClick={() => removeAvatar(u)} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"><X className="h-4 w-4" /></button>
                        )}
                        {u.id !== me.id && (
                          <button onClick={() => del(u)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-600 text-xs uppercase tracking-widest">
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
                <span className="ml-2 text-zinc-600">({customers.length})</span>
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
                          <button onClick={() => removeAvatar(u)} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors"><X className="h-4 w-4" /></button>
                        )}
                        {u.id !== me.id && (
                          <button onClick={() => del(u)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-zinc-600 text-xs uppercase tracking-widest">
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
          <form onSubmit={create} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={form.avatar_url} name={form.name} size={64} />
              <div className="flex-1 flex flex-col gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-white/15 hover:border-[#10B981] hover:text-[#10B981] text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 justify-center">
                  <Upload className="h-3 w-3" /> Subir foto
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleFile(e, "form")} />
              </div>
            </div>

            <Field label="Nombre"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass()} /></Field>
            <Field label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass()} /></Field>
            <Field label="Contraseña"><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass()} /></Field>
            <Field label="Rol">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass()}>
                <option value="empleado">Empleado</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            {/* SECCIÓN DE PERMISOS — ampliada a todas las secciones del admin */}
            <div className="space-y-2 mt-2">
              <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">Permisos Específicos</label>
              <div className="grid grid-cols-1 gap-2 border border-white/10 p-3 bg-[#0E0E0E]">
                {[
                  { id: 'view_dashboard',  label: 'Ver Dashboard' },
                  { id: 'view_products',   label: 'Ver Productos' },
                  { id: 'view_categories', label: 'Ver Categorías' },
                  { id: 'create_sale',     label: 'Registrar Ventas / Movimientos' },
                  { id: 'view_kardex',     label: 'Ver Kárdex' },
                  { id: 'view_alerts',     label: 'Ver Alertas' },
                  { id: 'view_reports',    label: 'Ver Reportes' },
                  { id: 'view_finance',    label: 'Ver Finanzas' },
                ].map((p) => (
                  <label key={p.id} className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer hover:text-white">
                    <input 
                      type="checkbox"
                      className="accent-[#10B981]"
                      checked={form.permissions?.includes(p.id)}
                      onChange={(e) => {
                        const current = form.permissions || [];
                        const updated = e.target.checked 
                          ? [...current, p.id] 
                          : current.filter(item => item !== p.id);
                        setForm({ ...form, permissions: updated });
                      }}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">{error}</div>}
            <PrimaryButton type="submit" className="w-full">Crear Usuario</PrimaryButton>
          </form>
        </Card>

      </div>
    </div>
  );
}