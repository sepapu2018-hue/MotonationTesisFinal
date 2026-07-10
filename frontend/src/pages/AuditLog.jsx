import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import { Card, PageHeader, GhostButton } from "@/components/ui-kit";
import PageLoader from "@/components/public/PageLoader";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { PERMISSION_OPTIONS } from "@/pages/Users";

const PAGE_SIZE = 50;

const ACTION_LABELS = {
  crear_usuario: "Creó usuario",
  editar_permisos_usuario: "Editó permisos",
  eliminar_usuario: "Eliminó usuario",
  eliminar_producto: "Eliminó producto",
};

const permLabel = (id) => PERMISSION_OPTIONS.find((p) => p.id === id)?.label || id;

// Resumen legible en JSX según el tipo de acción, en vez de mostrar el JSON crudo.
// El JSON completo queda disponible como tooltip (title) para quien lo necesite.
function renderDetail(entry) {
  const d = entry.details || {};
  switch (entry.action) {
    case "editar_permisos_usuario": {
      const before = d.permisos_antes || [];
      const after = d.permisos_despues || [];
      const added = after.filter((p) => !before.includes(p)).map(permLabel);
      const removed = before.filter((p) => !after.includes(p)).map(permLabel);
      if (!added.length && !removed.length && d.role_antes === d.role_despues) {
        return <span className="text-zinc-500">Sin cambios en rol/permisos</span>;
      }
      return (
        <span className="space-x-2">
          {d.role_antes !== d.role_despues && (
            <span className="text-zinc-300">Rol: {d.role_antes} → {d.role_despues}</span>
          )}
          {added.length > 0 && <span className="text-emerald-400">+ {added.join(", ")}</span>}
          {removed.length > 0 && <span className="text-red-400">− {removed.join(", ")}</span>}
        </span>
      );
    }
    case "crear_usuario":
      return (
        <span>
          {d.email} como <span className="text-zinc-300">{d.role}</span>
          {d.permissions?.length > 0 && <span className="text-zinc-500"> ({d.permissions.map(permLabel).join(", ")})</span>}
        </span>
      );
    case "eliminar_usuario":
      return <span>{d.email} <span className="text-zinc-500">({d.role})</span></span>;
    case "eliminar_producto":
      return <span>{d.name} <span className="text-zinc-500">— SKU {d.sku}</span></span>;
    default:
      return JSON.stringify(d);
  }
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/audit-log", { params: { page, page_size: PAGE_SIZE } });
      setEntries(data.data);
      setTotal(data.total);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <PageHeader kicker="Administración" title="Auditoría" testid="audit-log-header" count={total} />
      <p className="text-xs text-zinc-500 -mt-4 mb-6">
        Registro de acciones administrativas: creación/edición de permisos de usuarios y eliminación de productos.
      </p>

      <Card className="fade-up">
        {loading ? (
          <div className="p-6"><PageLoader variant="list" /></div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="audit-log-table">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("es")}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{e.user_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-amber-400">
                      <ShieldAlert className="h-3.5 w-3.5" /> {ACTION_LABELS[e.action] || e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs max-w-[420px] truncate" title={JSON.stringify(e.details)}>
                    {renderDetail(e)}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-zinc-500">Sin acciones registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/10 text-sm">
            <span className="text-zinc-500 text-xs">
              Página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} registros
            </span>
            <div className="flex gap-2">
              <GhostButton type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5">
                <ChevronLeft className="h-4 w-4" />
              </GhostButton>
              <GhostButton type="button" onClick={() => setPage((p) => (p * PAGE_SIZE < total ? p + 1 : p))} disabled={page * PAGE_SIZE >= total} className="px-3 py-1.5">
                <ChevronRight className="h-4 w-4" />
              </GhostButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
