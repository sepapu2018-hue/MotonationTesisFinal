import { AlertTriangle, X } from "lucide-react";
import { GhostButton, DangerButton } from "@/components/ui-kit";

// Reemplazo estilizado de window.confirm(), consistente con el resto del panel.
export default function ConfirmDialog({
  open, title = "Confirmar acción", message, confirmLabel = "Eliminar",
  loading = false, onConfirm, onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" data-testid="confirm-dialog">
      <div className="w-full max-w-sm bg-[#141414] border border-white/10 p-7">
        <div className="flex items-start justify-between mb-4">
          <div className="h-11 w-11 bg-red-500/10 border border-red-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <h3 className="font-display font-black text-xl uppercase">{title}</h3>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <GhostButton type="button" onClick={onCancel} disabled={loading}>Cancelar</GhostButton>
          <DangerButton type="button" onClick={onConfirm} disabled={loading} data-testid="confirm-dialog-accept">
            {loading ? "Eliminando…" : confirmLabel}
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
