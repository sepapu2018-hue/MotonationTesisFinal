import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api from "@/lib/api";
import { useCustomer } from "@/context/CustomerContext";
import { Package, ChevronRight } from "lucide-react";

const money = (n) => `$${Number(n).toLocaleString("es", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
const STATUS = {
  pendiente: { c: "text-zinc-400 border-zinc-400/40 bg-zinc-400/10", l: "Pendiente" },
  pagado: { c: "text-[#10B981] border-[#10B981]/40 bg-[#10B981]/10", l: "Pagado" },
  enviado: { c: "text-sky-400 border-sky-400/40 bg-sky-400/10", l: "Enviado" },
  entregado: { c: "text-emerald-300 border-emerald-300/40 bg-emerald-300/10", l: "Entregado" },
  cancelado: { c: "text-amber-400 border-amber-400/40 bg-amber-400/10", l: "Cancelado" },
};

export default function MyOrders() {
  const { customer } = useCustomer();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (customer && customer !== false) {
      api.get("/orders/mine")
        .then((r) => setOrders(r.data))
        .catch((err) => {
          // ✅ CORREGIDO: Atajamos el error 401 para que React no se caiga
          console.log("No se pudieron cargar los pedidos (sesión inválida o expirada):", err.message);
          setOrders([]);
        });
    }
  }, [customer]);

  if (customer === null) return <div className="py-20 text-center text-zinc-500">Cargando…</div>;
  if (customer === false) return <Navigate to="/cuenta/entrar?redirect=/mis-pedidos" replace />;

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      <div className="mb-8">
        <div className="text-[10px] text-[#10B981] font-mono uppercase tracking-[0.3em] mb-2">// Cuenta</div>
        <h1 className="font-display font-black text-5xl uppercase leading-none">Mis Pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <div className="border border-white/10 bg-[#0E0E0E] p-16 text-center">
          <Package className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <div className="font-display font-bold text-2xl uppercase">Aún no tienes pedidos</div>
          <Link to="/tienda" className="inline-block mt-6 bg-[#10B981] hover:bg-[#34D399] text-black px-6 py-3 font-display uppercase tracking-widest font-bold">
            Empezar a comprar
          </Link>
        </div>
      ) : (
        <div className="border border-white/10 bg-[#0E0E0E]">
          {orders.map((o) => {
            const s = STATUS[o.status] || STATUS.pendiente;
            return (
              <div key={o.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <div>
                  <div className="font-mono text-xs text-zinc-500">{o.order_number}</div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">
                    {new Date(o.created_at).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold border px-2 py-0.5 ${s.c}`}>{s.l}</span>
                <div className="timer text-xl text-[#10B981]">{money(o.total)}</div>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}