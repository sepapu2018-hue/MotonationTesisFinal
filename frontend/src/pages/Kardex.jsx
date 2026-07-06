import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, FileText, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, ClipboardCheck, Download, Printer } from "lucide-react";

const money = (n) => `$${Number(n || 0).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const TYPE_META = {
  entrada: { l: "Entrada", icon: ArrowDownToLine, c: "text-emerald-400 border-emerald-500/40 bg-emerald-500/5", sign: "+" },
  salida: { l: "Salida", icon: ArrowUpFromLine, c: "text-amber-400 border-amber-500/40 bg-amber-500/5", sign: "−" },
  venta: { l: "Venta", icon: ShoppingCart, c: "text-sky-400 border-sky-500/40 bg-sky-500/5", sign: "−" },
};

// El ajuste no tiene un signo fijo: depende de la dirección (conteo físico +/-)
const metaFor = (entry) => {
  if (entry.type === "ajuste") {
    const positive = entry.direction === "positivo";
    return {
      l: `Ajuste (${positive ? "+" : "−"})`,
      icon: ClipboardCheck,
      c: "text-sky-400 border-sky-500/40 bg-sky-500/5",
      sign: positive ? "+" : "−",
    };
  }
  return TYPE_META[entry.type] || TYPE_META.entrada;
};

export default function Kardex() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/products").then((r) => setProducts(r.data)).catch((err) => toast.error(formatApiError(err))); }, []);

  useEffect(() => {
    if (!selected) { setData(null); return; }
    api.get(`/kardex/${selected.id}`).then((r) => setData(r.data)).catch((err) => toast.error(formatApiError(err)));
  }, [selected]);

  const filtered = products.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
  );

  const buildPdf = () => {
    if (!data) return null;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();

    // Encabezado del PDF
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, W, 60, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MOTONATION", 40, 32);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text("REPORTE KÁRDEX — Historial de Movimientos", 40, 48);
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date().toLocaleString("es", { dateStyle: "long", timeStyle: "short" })}`, W - 40, 32, { align: "right" });

    // Información del Producto
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(data.product.name, 40, 90);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`SKU: ${data.product.sku} · Marca: ${data.product.brand || "—"}`, 40, 106);

    // KPIs en PDF
    const kpis = [
      ["Stock actual", String(data.product.current_stock)],
      ["Costo prom.", money(data.product.avg_cost)],
      ["Costo actual", money(data.product.current_cost)],
      ["Precio venta", money(data.product.current_price)],
    ];
    const colW = 140;
    const kpiX = W - (colW * kpis.length) - 40;
    kpis.forEach((k, i) => {
      const x = kpiX + i * colW;
      doc.setDrawColor(220, 220, 220);
      doc.rect(x, 75, colW - 10, 40);
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(k[0].toUpperCase(), x + 8, 88);
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.text(k[1], x + 8, 108);
    });

    // Tabla de Movimientos
    const rows = data.entries.map((e) => {
      const meta = metaFor(e);
      return [
        new Date(e.created_at).toLocaleDateString("es"),
        meta.l.toUpperCase(),
        (e.reason || "—"),
        meta.sign + e.quantity,
        money(e.unit_cost),
        money(e.unit_price),
        String(e.balance),
        money(e.avg_cost),
        money(e.balance_value),
      ];
    });

    autoTable(doc, {
      startY: 140,
      head: [["Fecha", "Tipo", "Motivo", "Cant.", "C. Unit.", "P. Unit.", "Saldo", "C. Prom.", "V. Saldo"]],
      body: rows,
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [16, 185, 129], textColor: [0, 0, 0], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: "center" },
        2: { cellWidth: 140 },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
      },
      didParseCell: (d) => {
        if (d.section === "body" && d.column.index === 1) {
          const raw = String(d.cell.raw);
          d.cell.styles.textColor = raw.startsWith("ENTRADA") ? [16, 185, 129]
            : raw.startsWith("VENTA") ? [2, 132, 199]
            : raw.startsWith("AJUSTE") ? [56, 189, 248]
            : [245, 158, 11];
        }
      },
      didDrawPage: (d) => {
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text("Motonation — Sistema de Control de Inventarios", 40, doc.internal.pageSize.getHeight() - 20);
        doc.text(`Página ${d.pageNumber}`, W - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
      }
    });

    return doc;
  };

  const downloadPdf = () => {
    const doc = buildPdf();
    if (doc) doc.save(`Kardex_${data.product.sku}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const printPdf = () => {
    const doc = buildPdf();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Historial Contable</div>
          <h1 className="font-display font-black text-5xl uppercase leading-none">Kárdex</h1>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button onClick={printPdf} className="px-4 py-2.5 border border-white/15 hover:border-[#10B981] hover:text-[#10B981] text-xs uppercase tracking-widest font-display font-bold transition-colors flex items-center gap-2">
              <Printer className="h-3.5 w-3.5" /> Imprimir
            </button>
            <button onClick={downloadPdf} className="bg-[#10B981] hover:bg-[#34D399] text-black px-4 py-2.5 text-xs uppercase tracking-widest font-display font-bold transition-colors flex items-center gap-2">
              <Download className="h-3.5 w-3.5" /> Exportar PDF
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <div className="border border-white/10 bg-[#0E0E0E] p-3">
            <div className="flex items-center gap-2 border border-white/15 px-2 py-2 focus-within:border-[#10B981]">
              <Search className="h-4 w-4 text-zinc-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto…" className="flex-1 bg-transparent outline-none text-sm" />
            </div>
          </div>
          <div className="border border-white/10 bg-[#0E0E0E] max-h-[70vh] overflow-auto">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className={`w-full text-left px-4 py-3 border-l-2 border-b border-white/5 ${selected?.id === p.id ? "border-l-[#10B981] bg-[#10B981]/5" : "border-l-transparent"}`}>
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">{p.sku} · stock {p.stock}</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-9">
          {!data ? (
            <div className="border border-white/10 bg-[#0E0E0E] p-16 text-center">
              <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <div className="font-display font-bold text-2xl uppercase">Selecciona un producto</div>
            </div>
          ) : (
            <div className="border border-white/10 bg-[#0E0E0E] p-5 mb-4">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{data.product.brand}</div>
                    <div className="font-display font-black text-2xl uppercase">{data.product.name}</div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">{data.product.sku}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
                    <div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Stock</div><div className="timer text-2xl">{data.product.current_stock}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Costo prom.</div><div className="timer text-2xl text-amber-400">{money(data.product.avg_cost)}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Costo actual</div><div className="timer text-2xl">{money(data.product.current_cost)}</div></div>
                    <div><div className="text-[10px] uppercase tracking-widest text-zinc-500">Precio venta</div><div className="timer text-2xl text-[#10B981]">{money(data.product.current_price)}</div></div>
                </div>
              </div>
            </div>
          )}

          {data && (
            data.entries.length === 0 ? (
              <div className="border border-white/10 bg-[#0E0E0E] p-12 text-center">
                <div className="text-sm text-zinc-500 uppercase tracking-widest">Sin movimientos registrados para este producto</div>
              </div>
            ) : (
              <div className="border border-white/10 bg-[#0E0E0E] overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500">
                      <th className="text-left px-4 py-3">Fecha</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3">Motivo</th>
                      <th className="text-right px-4 py-3">Cant.</th>
                      <th className="text-right px-4 py-3">C. Unit.</th>
                      <th className="text-right px-4 py-3">P. Unit.</th>
                      <th className="text-right px-4 py-3">Saldo</th>
                      <th className="text-right px-4 py-3">C. Prom.</th>
                      <th className="text-right px-4 py-3">V. Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((e) => {
                      const meta = metaFor(e);
                      const Icon = meta.icon;
                      return (
                        <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                            {new Date(e.created_at).toLocaleDateString("es")}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 border text-[10px] uppercase tracking-widest font-bold ${meta.c}`}>
                              <Icon className="h-3 w-3" /> {meta.l}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">{e.reason || "—"}</td>
                          <td className={`px-4 py-3 text-right font-mono ${meta.sign === "+" ? "text-emerald-400" : "text-amber-400"}`}>
                            {meta.sign}{e.quantity}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-400">{money(e.unit_cost)}</td>
                          <td className="px-4 py-3 text-right font-mono text-zinc-400">{money(e.unit_price)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">{e.balance}</td>
                          <td className="px-4 py-3 text-right font-mono text-amber-400">{money(e.avg_cost)}</td>
                          <td className="px-4 py-3 text-right font-mono text-[#10B981]">{money(e.balance_value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}