import { ShieldAlert } from "lucide-react";

// Destino neutral para permisos insuficientes: a diferencia de redirigir a
// /admin/dashboard, esta página nunca exige un permiso propio, así que no
// puede terminar en un loop si el usuario tampoco tiene acceso al dashboard.
export default function NoAccess() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="border border-amber-500/30 bg-amber-500/[0.03] p-16 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto mb-4" />
        <div className="font-display font-black text-2xl uppercase text-amber-400">Acceso restringido</div>
        <p className="text-zinc-400 mt-2">No tienes permiso para ver esta sección. Contacta a un administrador si crees que esto es un error.</p>
      </div>
    </div>
  );
}
