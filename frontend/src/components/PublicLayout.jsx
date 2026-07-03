import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import BrandLogo from "@/components/BrandLogo";
import { ShoppingCart, User, LogOut, Package, Menu, X } from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/", label: "Inicio", end: true },
  { to: "/tienda", label: "Tienda" },
  { to: "/tienda?type=motocicleta", label: "Motocicletas" },
  { to: "/tienda?type=accesorio", label: "Accesorios" },
];

export default function PublicLayout() {
  const { totals } = useCart();
  const { customer, logout } = useCustomer();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <div className="h-1 checker w-full" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size={36} />
            <div className="hidden sm:block">
              <div className="font-display font-black text-base uppercase leading-none tracking-tight">Motonation</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 mt-0.5">Riding gear store</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-2 text-xs uppercase tracking-widest font-display font-bold transition-colors ${
                    isActive ? "text-[#10B981]" : "text-zinc-400 hover:text-white"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {customer && customer !== false ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/mis-pedidos"
                  className="px-3 py-2 text-xs uppercase tracking-widest font-display font-bold text-zinc-300 hover:text-[#10B981] flex items-center gap-1.5"
                >
                  <Package className="h-3.5 w-3.5" /> Mis pedidos
                </Link>
                <Link
                  to="/mi-cuenta"
                  data-testid="account-link"
                  className="px-3 py-2 text-xs uppercase tracking-widest font-display font-bold text-zinc-300 hover:text-[#10B981] flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5" /> {customer.name?.split(" ")[0]}
                </Link>
                <button onClick={doLogout} className="p-2 text-zinc-400 hover:text-[#10B981]" title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/cuenta/entrar"
                className="hidden md:flex px-3 py-2 text-xs uppercase tracking-widest font-display font-bold text-zinc-300 hover:text-[#10B981] items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5" /> Entrar
              </Link>
            )}

            <Link
              to="/carrito"
              data-testid="cart-link"
              className="relative px-3 py-2 border border-white/10 hover:border-[#10B981] text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Carrito</span>
              {totals.count > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#10B981] text-black text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full">
                  {totals.count}
                </span>
              )}
            </Link>

            <button onClick={() => setOpen(!open)} className="md:hidden p-2 border border-white/10" aria-label="Menú">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 grid grid-cols-2 gap-2">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border border-white/10">
                {n.label}
              </Link>
            ))}
            {customer && customer !== false ? (
              <>
                <Link to="/mis-pedidos" onClick={() => setOpen(false)} className="px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border border-white/10">Mis pedidos</Link>
                <Link to="/mi-cuenta" onClick={() => setOpen(false)} className="px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border border-white/10">Mi cuenta</Link>
                <button onClick={doLogout} className="col-span-2 px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border border-white/10">Salir</button>
              </>
            ) : (
              <Link to="/cuenta/entrar" onClick={() => setOpen(false)} className="col-span-2 px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border border-[#10B981] text-[#10B981]">
                Entrar / Crear cuenta
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-black mt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo size={40} />
              <div className="font-display font-black uppercase">Motonation</div>
            </div>
            <p className="text-zinc-400 leading-relaxed text-xs">
              Distribuidor oficial de motocicletas y accesorios premium. Calidad garantizada,
              envíos seguros, asesoría experta.
            </p>
          </div>
          <div>
            <div className="font-display uppercase font-bold text-xs tracking-widest mb-3 text-zinc-300">Tienda</div>
            <ul className="space-y-2 text-zinc-500 text-xs">
              <li><Link to="/tienda" className="hover:text-[#10B981]">Catálogo completo</Link></li>
              <li><Link to="/tienda?type=motocicleta" className="hover:text-[#10B981]">Motocicletas</Link></li>
              <li><Link to="/tienda?type=accesorio" className="hover:text-[#10B981]">Accesorios</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-display uppercase font-bold text-xs tracking-widest mb-3 text-zinc-300">Mi cuenta</div>
            <ul className="space-y-2 text-zinc-500 text-xs">
              <li><Link to="/cuenta/entrar" className="hover:text-[#10B981]">Iniciar sesión</Link></li>
              <li><Link to="/cuenta/registro" className="hover:text-[#10B981]">Crear cuenta</Link></li>
              <li><Link to="/mi-cuenta" className="hover:text-[#10B981]">Mi cuenta</Link></li>
              <li><Link to="/mis-pedidos" className="hover:text-[#10B981]">Mis pedidos</Link></li>
              <li><Link to="/carrito" className="hover:text-[#10B981]">Mi carrito</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-display uppercase font-bold text-xs tracking-widest mb-3 text-zinc-300">Contacto</div>
            <ul className="space-y-2 text-zinc-500 text-xs">
              <li>contacto@motonation.com</li>
              <li>+593 99 999 9999</li>
              <li>Guayaquil, Ecuador</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
            <span>© {new Date().getFullYear()} Motonation · Todos los derechos reservados</span>
            <Link to="/admin/login" className="hover:text-zinc-400 transition-colors" data-testid="admin-discrete-link">
              · Sistema interno ·
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
