import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api, { formatApiError } from "@/lib/api";
import { Card, PageHeader, PrimaryButton, Field, inputClass } from "@/components/ui-kit";
import PageLoader from "@/components/public/PageLoader";
import CountUp from "@/components/CountUp";
import { Download, TrendingUp } from "lucide-react";

const money = (n) => `$${Number(n || 0).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

export default function Reports() {
  const [from, setFrom] = useState(monthAgoStr());
  const [to, setTo] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get("/reports/sales", { params: { from, to } });
      setReport(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, W, 60, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MOTONATION", 40, 32);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(`REPORTE DE VENTAS — ${report.from} a ${report.to}`, 40, 48);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const summary = [
      ["Pedidos", String(report.order_count)],
      ["Subtotal", money(report.subtotal)],
      ["Impuestos", money(report.tax)],
      ["Total vendido", money(report.revenue)],
    ];
    let y = 90;
    summary.forEach(([label, value]) => {
      doc.setTextColor(120, 120, 120);
      doc.text(label, 40, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(value, 200, y);
      doc.setFont("helvetica", "normal");
      y += 18;
    });

    autoTable(doc, {
      startY: y + 20,
      head: [["Producto", "SKU", "Cantidad vendida", "Ingresos"]],
      body: report.top_products.map((p) => [p.product_name, p.product_sku, String(p.quantity), money(p.revenue)]),
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    });

    doc.save(`reporte-ventas_${report.from}_${report.to}.pdf`);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <PageHeader kicker="Análisis" title="Reportes" testid="reports-header" />
      <p className="text-xs text-zinc-500 -mt-4 mb-6">
        Resumen de ventas por rango de fechas (no incluye pedidos cancelados), exportable a PDF.
      </p>

      <Card className="p-6 mb-6">
        <form onSubmit={generate} className="flex flex-wrap items-end gap-4">
          <Field label="Desde">
            <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass()} data-testid="report-from" />
          </Field>
          <Field label="Hasta">
            <input type="date" required value={to} onChange={(e) => setTo(e.target.value)} className={inputClass()} data-testid="report-to" />
          </Field>
          <PrimaryButton type="submit" testid="report-generate" disabled={loading}>
            {loading ? "Generando..." : "Generar reporte"}
          </PrimaryButton>
          {report && (
            <button type="button" onClick={exportPdf} data-testid="report-export-pdf"
              className="px-4 py-2 border border-white/15 hover:border-[#10B981] hover:text-[#10B981] text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors">
              <Download className="h-4 w-4" /> Exportar PDF
            </button>
          )}
        </form>
      </Card>

      {loading && (
        <Card className="p-6 mb-6"><PageLoader variant="list" /></Card>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Pedidos", value: report.order_count, format: (n) => n, testid: "report-order-count" },
              { label: "Subtotal", value: report.subtotal, format: money },
              { label: "Impuestos", value: report.tax, format: money },
              { label: "Total vendido", value: report.revenue, format: money, highlight: true },
            ].map((k, i) => (
              <Card key={i} className="p-5 fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">{k.label}</div>
                <div className={`timer text-3xl mt-1 ${k.highlight ? "text-[#10B981]" : ""}`} data-testid={k.testid}>
                  <CountUp value={k.value} format={k.format} />
                </div>
              </Card>
            ))}
          </div>

          <Card className="fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 px-4 pt-4 text-[10px] font-mono uppercase tracking-[0.3em] text-[#10B981]">
              <TrendingUp className="h-3.5 w-3.5" /> Productos más vendidos
            </div>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm" data-testid="report-top-products">
                <thead className="border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold text-left">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_products.map((p) => (
                    <tr key={p.product_sku} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold">{p.product_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.product_sku}</td>
                      <td className="px-4 py-3 text-right timer text-lg">{p.quantity}</td>
                      <td className="px-4 py-3 text-right">{money(p.revenue)}</td>
                    </tr>
                  ))}
                  {report.top_products.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-zinc-500">Sin ventas en este rango</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
