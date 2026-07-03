import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Badge } from "@/components/ui-kit";
import { AlertTriangle, AlertCircle } from "lucide-react";

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/low-stock")
      .then((r) => setItems(r.data))
      .catch((err) => {
        console.error("Error al cargar alertas:", err);
        setError(formatApiError(err));
      })
      .finally(() => setLoading(false));
  }, []);

  // Si aún está cargando, mostramos un indicador neutro
  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-20 text-center text-zinc-500 uppercase tracking-widest font-mono">
        Cargando alertas...
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6" data-testid="alerts-header">
        <div>
          <div className="text-[10px] text-amber-400 font-mono uppercase tracking-[0.3em] mb-2">// Stock Crítico</div>
          <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight flex items-end gap-3">
            Alertas
            <span className="timer text-2xl text-zinc-600">[{String(items.length).padStart(3, "0")}]</span>
          </h1>
        </div>
      </div>

      {error ? (
        <div className="border border-red-500/30 bg-red-500/[0.03] p-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <div className="font-display font-black text-2xl uppercase text-red-400">No se pudieron cargar las alertas</div>
          <p className="text-zinc-500 mt-2">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-emerald-500/30 bg-emerald-500/[0.03] p-16 text-center">
          <div className="font-display font-black text-4xl uppercase text-emerald-400">✓ Stock OK</div>
          <p className="text-zinc-400 mt-2">Sin productos por debajo del mínimo configurado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4" data-testid="alerts-grid">
          {items.map((p, idx) => (
            <div
              key={p.id}
              className={`${idx === 0 ? "col-span-12 lg:col-span-8" : "col-span-12 md:col-span-6 lg:col-span-4"} border border-amber-500/30 bg-amber-500/[0.03] p-5`}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/40 flex items-center justify-center pulse-accent shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-lg truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{p.sku} · {p.brand}</div>
                  <div className="mt-4 flex items-end gap-6 flex-wrap">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Actual</div>
                      <div className="timer text-4xl text-amber-400">{p.stock}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Mínimo</div>
                      <div className="timer text-4xl text-zinc-400">{p.min_stock}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Faltan</div>
                      <div className="timer text-4xl text-amber-400">{Math.max(1, p.min_stock - p.stock + 1)}</div>
                    </div>
                    {/* Asegúrate de que Badge soporte el variant="danger" en ui-kit */}
                    <Badge variant="danger">Crítico</Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}