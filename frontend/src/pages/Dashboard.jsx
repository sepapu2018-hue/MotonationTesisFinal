import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Badge } from "@/components/ui-kit";
import {
  Package, AlertTriangle, DollarSign, Activity, Bike, ShoppingBag, ArrowRight,
  ArrowDownToLine, ArrowUpFromLine, TrendingUp,
} from "lucide-react";

// Pequeño helper para formatear $ con miles
const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 0 })}`;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [movs, setMovs] = useState([]);
  const [low, setLow] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, m, l] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/movements?limit=6"),
          api.get("/dashboard/low-stock"),
        ]);
        setStats(s.data);
        setMovs(m.data);
        setLow(l.data);
      } catch (e) {
        // Si algún endpoint falla, mostramos lo que sí cargó (evita pantalla en blanco)
        console.error("dashboard load:", e);
      }
    })();
  }, []);

  if (!stats) {
    return <div className="p-12 text-center text-zinc-500 font-display uppercase tracking-widest">Cargando…</div>;
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8" data-testid="dashboard-header">
      {/* Hero — valor del inventario en cronómetro gigante */}
      <section className="relative border border-white/10 bg-[#0E0E0E] overflow-hidden mb-6 fade-up">
        <div className="absolute inset-0 circuit-grid opacity-70 pointer-events-none" />
        <div className="absolute right-0 top-0 h-full w-2 checker opacity-60" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-8 p-8 lg:p-10">
          {/* Métrica principal */}
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981] mb-4">
              <span className="h-2 w-2 bg-[#10B981] animate-pulse" />
              Valor total del inventario
            </div>
            <div className="timer text-7xl md:text-8xl lg:text-[112px] leading-[0.85] text-white">
              {money(stats.total_value)}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest font-bold text-zinc-400">
              <span><span className="text-white timer text-base">{stats.total_units}</span> unidades</span>
              <span className="text-zinc-700">·</span>
              <span><span className="text-white timer text-base">{stats.total_products}</span> productos</span>
              <span className="text-zinc-700">·</span>
              <span><span className="text-white timer text-base">{stats.movements_today}</span> movs hoy</span>
            </div>
          </div>

          {/* Alerta crítica vertical */}
          <div className="lg:border-l lg:border-white/10 lg:pl-8 flex flex-col justify-center">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" /> Stock crítico
            </div>
            <div className="flex items-baseline gap-3">
              <div className={`timer text-7xl md:text-8xl ${stats.low_stock_count > 0 ? "text-amber-400" : "text-emerald-400"}`} data-testid="stat-low">
                {String(stats.low_stock_count).padStart(2, "0")}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                productos<br />en alerta
              </div>
            </div>
            <Link
              to="/admin/alertas"
              className="mt-5 inline-flex items-center gap-2 self-start text-xs uppercase tracking-widest font-bold text-[#10B981] hover:gap-3 transition-all"
              data-testid="link-all-alerts"
            >
              Revisar alertas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bento grid asimétrico */}
      <section className="grid grid-cols-12 gap-4 mb-6" data-testid="stats-grid">
        {/* Productos totales — span 3 */}
        <Tile className="col-span-12 sm:col-span-6 lg:col-span-3" icon={Package} kicker="Productos">
          <div className="timer text-5xl" data-testid="stat-products">{stats.total_products}</div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">total registrados</div>
        </Tile>

        {/* Motos — span 2 */}
        <Tile className="col-span-6 sm:col-span-3 lg:col-span-2" icon={Bike} kicker="Motos" accent>
          <div className="timer text-5xl text-white" data-testid="stat-motos">{stats.motos_count}</div>
        </Tile>

        {/* Accesorios — span 2 */}
        <Tile className="col-span-6 sm:col-span-3 lg:col-span-2" icon={ShoppingBag} kicker="Accesorios">
          <div className="timer text-5xl" data-testid="stat-accesorios">{stats.accesorios_count}</div>
        </Tile>

        {/* Unidades — span 2 */}
        <Tile className="col-span-6 sm:col-span-6 lg:col-span-2" icon={Activity} kicker="Unidades">
          <div className="timer text-5xl" data-testid="stat-units">{stats.total_units}</div>
        </Tile>

        {/* Valor (chip pequeño con tendencia) — span 3 */}
        <Tile className="col-span-6 sm:col-span-6 lg:col-span-3" icon={DollarSign} kicker="Valor (USD)">
          <div className="timer text-3xl truncate" data-testid="stat-value">{money(stats.total_value)}</div>
          <div className="text-[10px] uppercase tracking-widest text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> inventario activo
          </div>
        </Tile>
      </section>

      {/* Dos columnas asimétricas (movs + alertas detalladas) */}
      <section className="grid grid-cols-12 gap-4">
        {/* Movimientos recientes — span 7 */}
        <div className="col-span-12 lg:col-span-7 border border-white/10 bg-[#0E0E0E]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-1 w-8 bg-[#10B981]" />
              <h3 className="font-display uppercase font-bold tracking-widest text-sm">Movimientos recientes</h3>
            </div>
            <Link to="/admin/movimientos" className="text-[10px] uppercase tracking-widest font-bold text-[#10B981] hover:underline" data-testid="link-all-movements">
              Ver historial →
            </Link>
          </div>
          <div data-testid="recent-movements">
            {movs.length === 0 && (
              <div className="px-5 py-12 text-center text-zinc-500 text-sm">Sin movimientos aún</div>
            )}
            {movs.map((m, idx) => (
              <div
                key={m.id}
                className="grid grid-cols-[40px,1fr,auto,auto] items-center gap-4 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className={`h-9 w-9 flex items-center justify-center border ${m.type === "entrada" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-amber-500/40 text-amber-400 bg-amber-500/5"}`}>
                  {m.type === "entrada" ? <ArrowDownToLine className="h-4 w-4" /> : <ArrowUpFromLine className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{m.product_name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">{m.product_sku} · {m.user_name}</div>
                </div>
                <div className={`timer text-2xl ${m.type === "entrada" ? "text-emerald-400" : "text-amber-400"}`}>
                  {m.type === "entrada" ? "+" : "−"}{m.quantity}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono uppercase w-20 text-right">
                  {new Date(m.created_at).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bajo stock — span 5 */}
        <div className="col-span-12 lg:col-span-5 border border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <span className="h-1 w-8 bg-amber-400" />
              <h3 className="font-display uppercase font-bold tracking-widest text-sm flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Bajo stock
              </h3>
            </div>
            <Badge variant="danger">{low.length}</Badge>
          </div>
          <div data-testid="low-stock-list">
            {low.length === 0 && (
              <div className="px-5 py-12 text-center">
                <div className="font-display font-black text-2xl uppercase text-emerald-400">✓ Stock OK</div>
                <div className="text-xs text-zinc-500 mt-1">Sin alertas activas</div>
              </div>
            )}
            {low.slice(0, 6).map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr,auto] gap-3 items-center px-5 py-3 border-b border-amber-500/10 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">{p.sku}</div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="timer text-3xl text-amber-400">{p.stock}</div>
                  <div className="text-[9px] uppercase tracking-widest text-zinc-500 pb-1">/ {p.min_stock} min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ children, className = "", icon: Icon, kicker, accent = false }) {
  return (
    <div
      className={`${className} relative bg-[#0E0E0E] border ${accent ? "border-[#10B981]/30" : "border-white/10"} p-5 fade-up overflow-hidden`}
    >
      {accent && <span className="absolute top-0 left-0 h-full w-[3px] bg-[#10B981]" />}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">{kicker}</span>
        {Icon && <Icon className={`h-3.5 w-3.5 ${accent ? "text-[#10B981]" : "text-zinc-600"}`} />}
      </div>
      {children}
    </div>
  );
}
