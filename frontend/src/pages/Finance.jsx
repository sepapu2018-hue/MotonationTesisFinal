import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DollarSign, TrendingUp, Package, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend, Area, AreaChart,
} from "recharts";

const money = (n) => `$${Number(n || 0).toLocaleString("es", { maximumFractionDigits: 0 })}`;
const moneyFull = (n) => `$${Number(n || 0).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + "%" : "—");

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 min-w-[140px]" style={{ background: "#0A0A0A", border: "1px solid #262626", color: "#fff", fontSize: 11 }}>
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs font-mono">
          {p.name}: {money(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Finance() {
  const [stats, setStats] = useState(null);
  const [cashFlow, setCashFlow] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resSummary, resCash, resTop] = await Promise.all([
          api.get("/finance/summary"),
          api.get(`/finance/cash-flow?days=${days}`),
          api.get("/finance/top-products"),
        ]);
        setStats(resSummary.data);
        setCashFlow(resCash.data);
        setTopProducts(resTop.data);
      } catch (err) {
        console.error("Error al cargar datos financieros:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading) return (
    <div className="p-20 text-center text-zinc-500">
      <Loader2 className="animate-spin mx-auto h-8 w-8" />
    </div>
  );

  const totalRevenue = Number(stats?.revenue || 0);
  const totalCost = Number(stats?.cost_of_goods_sold || 0);
  const grossMargin = Number(stats?.gross_margin || 0);
  const marginRate = pct(grossMargin, totalRevenue);

  const maxRevenue = topProducts[0]?.revenue || 1;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-1">// Administración</p>
          <h1 className="font-display font-black text-5xl uppercase leading-none tracking-tight">Finanzas</h1>
        </div>
        <div className="flex items-center gap-1 border border-white/10 p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                days === d ? "bg-[#10B981] text-black" : "text-zinc-500 hover:text-white"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Package}
          label="Valor inventario (costo)"
          value={money(stats.inventory_cost_value)}
          sub={`A venta: ${money(stats.inventory_sale_value)}`}
        />
        <KPICard
          icon={DollarSign}
          label="Ingresos totales"
          value={money(totalRevenue)}
          sub={`${stats.orders_count} pedidos`}
          accent
        />
        <KPICard
          icon={TrendingUp}
          label="Margen bruto"
          value={money(grossMargin)}
          sub={`Tasa: ${marginRate}`}
          accent
        />
        <KPICard
          icon={ArrowUpRight}
          label="Margen potencial"
          value={money(stats.potential_margin)}
          sub="Sobre inventario actual"
        />
      </section>

      {/* ── Flujo de caja + Top productos ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico área — 2/3 */}
        <div className="lg:col-span-2 border border-white/10 bg-[#0A0A0A] p-6">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Flujo de caja</p>
            <p className="text-xs text-zinc-600 mt-0.5">Ingresos vs costos — últimos {days} días</p>
          </div>
          {cashFlow.length === 0 ? (
            <EmptyState text="Sin movimientos en este período" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={cashFlow} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} style={{ background: "transparent" }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={{ stroke: "#262626" }}
                  tickFormatter={(v) => v?.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={46}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }} />
                <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10B981" strokeWidth={2} fill="url(#gIncome)" dot={false} />
                <Area type="monotone" dataKey="cost" name="Costo" stroke="#818cf8" strokeWidth={1.5} fill="url(#gCost)" dot={false} strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top productos — 1/3 */}
        <div className="border border-white/10 bg-[#0A0A0A] p-6">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Top productos</p>
            <p className="text-xs text-zinc-600 mt-0.5">Por ingresos generados</p>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState text="Sin ventas registradas" />
          ) : (
            <div className="space-y-4">
              {topProducts.slice(0, 8).map((p, i) => {
                const barWidth = Math.max(4, (p.revenue / maxRevenue) * 100);
                return (
                  <div key={p.product_id || i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate text-zinc-300 max-w-[150px]">{p.product_name}</span>
                      <span className="text-xs font-mono text-[#10B981]">{money(p.revenue)}</span>
                    </div>
                    <div className="h-[3px] bg-white/5 w-full">
                      <div className="h-full bg-[#10B981]" style={{ width: `${barWidth}%`, opacity: 1 - i * 0.07 }} />
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{p.units_sold} uds · margen {money(p.margin)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Gráfico de barras por producto ── */}
      {topProducts.length > 0 && (
        <section className="border border-white/10 bg-[#0A0A0A] p-6">
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Ingresos vs margen por producto</p>
            <p className="text-xs text-zinc-600 mt-0.5">Comparativo de los productos más vendidos</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={topProducts.slice(0, 8).map((p) => ({ ...p, name: p.product_name }))}
              margin={{ top: 4, right: 4, left: 0, bottom: 8 }}
              style={{ background: "transparent" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "#262626" }}
                interval={0}
                tickFormatter={(v) => v?.length > 12 ? v.slice(0, 12) + "…" : v}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={46}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }} />
              <Bar dataKey="revenue" name="Ingresos" fill="#10B981" opacity={0.85} radius={[2, 2, 0, 0]} />
              <Bar dataKey="margin" name="Margen" fill="#818cf8" opacity={0.75} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Tabla resumen ── */}
      <section className="border border-white/10 bg-[#0A0A0A]">
        <div className="px-6 py-4 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Resumen financiero</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { label: "Ingresos brutos totales", value: moneyFull(totalRevenue), hl: true },
            { label: "Costo de ventas total", value: moneyFull(totalCost) },
            { label: "Margen bruto", value: moneyFull(grossMargin), hl: true },
            { label: "Tasa de margen", value: marginRate },
            { label: "Pedidos completados", value: stats.orders_count },
            { label: "Valor inventario a costo", value: moneyFull(stats.inventory_cost_value) },
            { label: "Valor inventario a precio de venta", value: moneyFull(stats.inventory_sale_value) },
            { label: "Margen potencial sobre inventario", value: moneyFull(stats.potential_margin), hl: true },
          ].map(({ label, value, hl }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
              <span className="text-xs text-zinc-400 uppercase tracking-widest">{label}</span>
              <span className={`font-mono text-sm ${hl ? "text-[#10B981]" : "text-white"}`}>{value}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className={`relative border p-5 ${accent ? "border-[#10B981]/30 bg-[#10B981]/[0.03]" : "border-white/10 bg-[#0E0E0E]"}`}>
      {accent && <span className="absolute top-0 left-0 h-full w-[3px] bg-[#10B981]" />}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 leading-tight max-w-[80%]">{label}</span>
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${accent ? "text-[#10B981]" : "text-zinc-600"}`} />
      </div>
      <div className="font-mono text-2xl lg:text-3xl truncate">{value}</div>
      {sub && <p className="text-[10px] text-zinc-600 mt-1 truncate">{sub}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-zinc-700">
      <AlertCircle className="h-8 w-8 mb-2" />
      <p className="text-xs uppercase tracking-widest">{text}</p>
    </div>
  );
}