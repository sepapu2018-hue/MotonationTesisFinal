import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { PrimaryButton, GhostButton } from "@/components/ui-kit";

// Red de seguridad: si un componente de React lanza una excepción en render,
// evita que toda la app quede en pantalla blanca sin ningún aviso.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-sm text-center">
          <div className="h-14 w-14 mx-auto bg-red-500/10 border border-red-500/40 flex items-center justify-center mb-5">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="font-display font-black text-2xl uppercase">Algo salió mal</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Ocurrió un error inesperado en la aplicación. Podés volver al inicio o recargar la página.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <GhostButton type="button" onClick={() => window.location.reload()}>Recargar</GhostButton>
            <PrimaryButton type="button" onClick={this.handleReload}>Ir al inicio</PrimaryButton>
          </div>
        </div>
      </div>
    );
  }
}
