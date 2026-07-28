import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router no resetea el scroll al navegar (a diferencia de una navegación
// de página completa): sin esto, ir de un producto al listado deja la página
// nueva scrolleada a la misma posición en la que estaba la anterior.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
