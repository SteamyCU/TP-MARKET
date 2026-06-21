import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Atrapa errores de render de sus hijos para evitar que React desmonte
 * todo el árbol y deje la pantalla en blanco. Usa <a href> (navegación
 * completa del navegador) en vez de react-router, para no depender de
 * que el propio Router siga en un estado utilizable tras el error.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-tp-gray-soft shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-tp-red" />
            </div>
            <h2 className="text-xl font-bold text-tp-blue mb-2">Algo salió mal</h2>
            <p className="text-tp-blue/60 mb-6 text-sm">
              Ha ocurrido un error inesperado. Intenta recargar la página.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-tp-red hover:bg-[#D91F33] text-white px-5 py-2.5 rounded-xl font-bold transition-colors"
              >
                🔄 Recargar página
              </button>
              <a
                href="/"
                className="bg-tp-blue-light text-tp-blue hover:bg-tp-blue/10 px-5 py-2.5 rounded-xl font-bold transition-colors"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
