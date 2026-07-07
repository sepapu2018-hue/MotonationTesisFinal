import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";

export default function ProtectedRoute({ children, permission, adminOnly }) {
  const { user } = useAuth();

  // user === null: la sesión todavía se está verificando (checkSession en curso).
  // No redirigir todavía o cualquier recarga de una página que no sea Dashboard
  // rebota a login y de ahí a Dashboard, perdiendo la página pedida.
  if (user === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[#10B981] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Si se requiere un permiso específico y el usuario no lo tiene, redirigir
  if (permission && !can(user.permissions, permission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
