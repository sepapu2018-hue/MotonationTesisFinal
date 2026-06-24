import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Package, ArrowLeftRight, BarChart3, Users, LogOut,
  AlertTriangle, FolderKanban, Menu, X, Plus, FileText, DollarSign,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "@/components/Avatar";

const items = [
  { to: "/admin/dashboard",    label: "Dashboard",    icon: LayoutDashboard, testid: "nav-dashboard",  permission: "view_dashboard" },
  { to: "/admin/productos",    label: "Productos",    icon: Package,         testid: "nav-products",   permission: "view_products" },
  { to: "/admin/categorias",   label: "Categorías",   icon: FolderKanban,    testid: "nav-categories", permission: "view_categories" },
  { to: "/admin/movimientos",  label: "Movimientos",  icon: ArrowLeftRight,  testid: "nav-movements",  permission: "create_sale" },
  { to: "/admin/kardex",       label: "Kárdex",       icon: FileText,        testid: "nav-kardex",     permission: "view_kardex" },
  { to: "/admin/alertas",      label: "Alertas",      icon: AlertTriangle,   testid: "nav-alerts",     permission: "view_alerts" },
  { to: "/admin/reportes",     label: "Reportes",     icon: BarChart3,       testid: "nav-reports",    permission: "view_reports" },
  { to: "/admin/finanzas",     label: "Finanzas",     icon: DollarSign,      testid: "nav-finance",    permission: "view_finance" },
  { to: "/admin/usuarios",     label: "Usuarios",     icon: Users,           testid: "nav-users",      adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Admin ve todo. Empleado solo ve items sin permission, o donde tenga el permiso.
  const visible = items.filter((item) => {
    if (item.adminOnly) return user?.role === "admin";
    if (item.permission) return user?.role === "admin" || user?.permissions?.includes(item.permission);
    return true;
  });

  const doLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const showFab = !["/admin/usuarios", "/admin/categorias", "/admin/finanzas", "/admin/kardex"].some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative">
      <div className="h-1 checker w-full" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-md" data-testid="top-bar">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-3 mr-2">
            <BrandLogo size={36} />
            <div className="hidden sm:block">
              <div className="font-display font-black text-base uppercase leading-none tracking-tight">Motonation</div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 mt-0.5">Control Center</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {visible.map(({ to, label, icon: Icon, testid }) => (
              <NavLink
                key={to}
                to={to}
                data-testid={testid}
                className={({ isActive }) =>
                  ["group relative flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest font-display font-bold transition-all",
                    isActive ? "text-white" : "text-zinc-500 hover:text-white"].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                    {isActive && <span className="absolute left-0 right-0 -bottom-[17px] h-[2px] bg-[#10B981]" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 ml-auto">
            <div className="text-right">
              <div className="text-sm font-semibold leading-tight">{user?.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-zinc-500">{user?.role}</div>
            </div>
            <div className="h-9 w-9 flex items-center justify-center">
              <Avatar src={user?.avatar_url} name={user?.name} size={36} />
            </div>
            <button
              onClick={doLogout}
              data-testid="logout-button"
              className="ml-2 px-3 py-2 border border-white/10 hover:border-[#10B981] hover:text-[#10B981] text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="h-3 w-3" /> Salir
            </button>
          </div>

          <button className="lg:hidden ml-auto p-2 border border-white/10" onClick={() => setOpen((s) => !s)} data-testid="mobile-toggle" aria-label="Menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-white/10 bg-[#0A0A0A]">
            <div className="max-w-[1600px] mx-auto px-4 py-3 grid grid-cols-2 gap-2">
              {visible.map(({ to, label, icon: Icon, testid }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  data-testid={`${testid}-mobile`}
                  className={({ isActive }) =>
                    ["flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border",
                      isActive ? "bg-[#10B981]/10 border-[#10B981] text-white" : "border-white/10 text-zinc-400"].join(" ")
                  }
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </NavLink>
              ))}
              <button onClick={doLogout} className="col-span-2 mt-1 px-3 py-2.5 border border-white/10 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                <LogOut className="h-3.5 w-3.5" /> Salir ({user?.name})
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative">
        <Outlet />
      </main>

      {showFab && (
        <div className="fixed bottom-20 right-6 z-30">
          {menuOpen && (
            <div className="absolute bottom-16 right-0 bg-[#141414] border border-white/10 p-1.5 w-52 shadow-2xl fade-up">
              <button
                onClick={() => { setMenuOpen(false); navigate("/admin/movimientos?new=1"); }}
                data-testid="fab-new-movement"
                className="w-full text-left px-3 py-2 text-xs uppercase tracking-widest font-display font-bold hover:bg-[#10B981]/15 hover:text-[#10B981] transition-colors"
              >
                + Nuevo movimiento
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => { setMenuOpen(false); navigate("/admin/productos?new=1"); }}
                  data-testid="fab-new-product"
                  className="w-full text-left px-3 py-2 text-xs uppercase tracking-widest font-display font-bold hover:bg-[#10B981]/15 hover:text-[#10B981] transition-colors"
                >
                  + Nuevo producto
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setMenuOpen((s) => !s)}
            data-testid="fab-button"
            className="h-14 w-14 bg-[#10B981] hover:bg-[#34D399] text-black flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all"
            aria-label="Acciones rápidas"
          >
            <Plus className={`h-6 w-6 transition-transform ${menuOpen ? "rotate-45" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}