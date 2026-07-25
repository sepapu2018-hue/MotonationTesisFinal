import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Accesibilidad básica para modales hechos a mano (no-<dialog>):
// - Escape cierra el modal
// - Foco atrapado dentro del modal (Tab/Shift+Tab no se escapan al fondo)
// - Al abrir, el foco entra al modal; al cerrar, vuelve a quien lo abrió
export function useDialogA11y(open, onClose) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;

    const container = containerRef.current;
    const focusables = container ? container.querySelectorAll(FOCUSABLE) : [];
    (focusables[0] || container)?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const nodes = container.querySelectorAll(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  return containerRef;
}
