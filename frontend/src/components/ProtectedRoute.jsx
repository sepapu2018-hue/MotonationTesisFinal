import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";

export default function ProtectedRoute({ children, permission }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Si se requiere un permiso específico y el usuario no lo tiene, redirigir
  if (permission && !can(user.permissions, permission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}