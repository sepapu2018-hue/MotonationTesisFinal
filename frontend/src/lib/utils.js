import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formato de moneda único para todo el sitio (antes cada página lo reimplementaba
// con distinta cantidad de decimales: catálogo mostraba "$1,234" y otras
// pantallas "$1,234.00" para el mismo precio).
export function formatCurrency(n) {
  return `$${Number(n || 0).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
