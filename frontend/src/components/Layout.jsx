import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Package, ArrowLeftRight, Users, LogOut,
  FolderKanban, Menu, X, Plus, FileText, Truck, Star, Contact,
  BarChart3, ShieldAlert,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import Avatar from "@/components/Avatar";

// Agrupado por dominio, no por orden de creación: así el sidebar se lee como
// mapa del negocio (Catálogo / Operaciones / Análisis / Sistema) en vez de
// una lista plana de 12 páginas sin jerarquía.
const GROUPS = [
  {
    label: "Panel",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", permission: "view_dashboard" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { to: "/admin/productos", label: "Productos", icon: Package, testid: "nav-products", permission: "view_products" },
      { to: "/admin/categorias", label: "Categorías", icon: FolderKanban, testid: "nav-categories", permission: "view_categories" },
      { to: "/admin/proveedores", label: "Proveedores", icon: Contact, testid: "nav-suppliers", permission: "view_suppliers" },
      { to: "/admin/resenas", label: "Reseñas", icon: Star, testid: "nav-reviews", permission: "view_reviews" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { to: "/admin/movimientos", label: "Movimientos", icon: ArrowLeftRight, testid: "nav-movements", permission: "create_sale" },
      { to: "/admin/kardex", label: "Kárdex", icon: FileText, testid: "nav-kardex", permission: "view_kardex" },
      { to: "/admin/pedidos", label: "Pedidos", icon: Truck, testid: "nav-orders", permission: "view_orders" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { to: "/admin/reportes", label: "Reportes", icon: BarChart3, testid: "nav-reports", permission: "view_reports" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/usuarios", label: "Usuarios", icon: Users, testid: "nav-users", adminOnly: true },
      { to: "/admin/auditoria", label: "Auditoría", icon: ShieldAlert, testid: "nav-audit", adminOnly: true },
    ],
  },
];

function canSee(item, user) {
  if (item.adminOnly) return user?.role === "admin";
  if (item.permission) {
    const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
    return user?.role === "admin" || perms.some((p) => user?.permissions?.includes(p));
  }
  return true;
}

function NavItem({ to, label, icon: Icon, testid, onClick, idSuffix = "" }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      data-testid={`${testid}${idSuffix}`}
      className={({ isActive }) =>
        ["group relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-xs uppercase tracking-widest font-display font-bold border-l-2 transition-colors",
          isActive
            ? "border-[#10B981] bg-[#10B981]/10 text-white"
            : "border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.03]"].join(" ")
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarContent({ groups, onNavigate, user, doLogout, idSuffix = "" }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-white/10">
        <BrandLogo size={32} />
        <div>
          <div className="font-display font-black text-sm uppercase leading-none tracking-tight">Motonation</div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 mt-1">Control Center</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-5 mb-1.5 text-[10px] font-display font-bold uppercase tracking-[0.2em] text-zinc-600">
              // {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={onNavigate} idSuffix={idSuffix} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={user?.avatar_url} name={user?.name} size={36} />
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">{user?.name}</div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-500">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={doLogout}
          data-testid={`logout-button${idSuffix}`}
          className="w-full px-3 py-2 border border-white/10 hover:border-[#10B981] hover:text-[#10B981] text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-1.5"
        >
          <LogOut className="h-3.5 w-3.5" /> Salir
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const groups = GROUPS
    .map((g) => ({ ...g, items: g.items.filter((item) => canSee(item, user)) }))
    .filter((g) => g.items.length > 0);

  const doLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const showFab = !["/admin/usuarios", "/admin/categorias", "/admin/proveedores", "/admin/kardex", "/admin/pedidos", "/admin/resenas", "/admin/reportes", "/admin/auditoria"].some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="h-1 checker w-full" />

      <div className="flex" style={{ minHeight: "calc(100vh - 4px)" }}>
        {/* Sidebar de escritorio — fija, con franja tipo bandera a cuadros como
            borde derecho: el mismo motivo del stripe superior, en vertical. */}
        <aside className="hidden lg:flex w-60 shrink-0 border-r border-white/10 bg-[#0A0A0A] sticky top-0 h-screen">
          <SidebarContent groups={groups} user={user} doLogout={doLogout} />
          <div className="checker w-1 absolute top-0 right-0 h-full" />
        </aside>

        {/* Drawer móvil */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="w-72 bg-[#0A0A0A] border-r border-white/10 relative">
              <SidebarContent groups={groups} user={user} doLogout={doLogout} onNavigate={() => setOpen(false)} idSuffix="-mobile" />
              <div className="checker w-1 absolute top-0 right-0 h-full" />
            </div>
            <button
              className="flex-1 bg-black/70 backdrop-blur-sm"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="lg:hidden sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-md" data-testid="top-bar">
            <div className="px-4 h-16 flex items-center gap-3">
              <button className="p-2 border border-white/10" onClick={() => setOpen((s) => !s)} data-testid="mobile-toggle" aria-label="Menú">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <BrandLogo size={28} />
              <div className="font-display font-black text-sm uppercase leading-none tracking-tight">Motonation</div>
              <div className="ml-auto">
                <Avatar src={user?.avatar_url} name={user?.name} size={32} />
              </div>
            </div>
          </header>

          <main className="relative flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      {showFab && (
        <div className="fixed bottom-6 right-6 z-30">
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
