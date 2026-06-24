import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui-kit";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

export default function Reports() {
  const [byCat, setByCat] = useState([]);
  const [movsSum, setMovsSum] = useState([]);

  useEffect(() => {
    api.get("/reports/stock-by-category").then((r) => setByCat(r.data));
    api.get("/reports/movements-summary?days=7").then((r) => setMovsSum(r.data));
  }, []);

  const tooltipStyle = { background: "#0A0A0A", border: "1px solid #262626", color: "#fff", fontSize: 12 };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <PageHeader kicker="Análisis" title="Reportes" testid="reports-header" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6" >
          <h3 className="font-display uppercase font-bold tracking-wider text-lg mb-4">Stock por Categoría</h3>
          <div data-testid="chart-stock-by-category" style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={byCat}>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" stroke="#71717A" fontSize={11} tick={{ fill: "#A1A1AA" }} />
                <YAxis stroke="#71717A" fontSize={11} tick={{ fill: "#A1A1AA" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                <Bar dataKey="stock" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display uppercase font-bold tracking-wider text-lg mb-4">Movimientos Últimos 7 Días</h3>
          <div data-testid="chart-movements" style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={movsSum}>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="date" stroke="#71717A" fontSize={11} tick={{ fill: "#A1A1AA" }} />
                <YAxis stroke="#71717A" fontSize={11} tick={{ fill: "#A1A1AA" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#A1A1AA" }} />
                <Line type="monotone" dataKey="entradas" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="salidas" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="font-display uppercase font-bold tracking-wider text-lg mb-4">Valor de Inventario por Categoría</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="report-table">
              <thead className="border-b border-white/10">
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Productos</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Valor (USD)</th>
                </tr>
              </thead>
              <tbody>
                {byCat.map((c) => (
                  <tr key={c.name} className="border-b border-white/5">
                    <td className="px-4 py-3 font-semibold">{c.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{c.items}</td>
                    <td className="px-4 py-3 text-right font-mono">{c.stock}</td>
                    <td className="px-4 py-3 text-right font-display font-bold">${c.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
