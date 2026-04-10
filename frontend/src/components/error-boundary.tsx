"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.warn("ErrorBoundary capturou:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-red-500/10">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  Algo deu errado
                </h1>
                <p className="text-slate-400 text-sm">
                  {this.state.error?.message ?? "Erro inesperado"}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() =>
                    this.setState({ hasError: false, error: null })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 text-slate-900 font-semibold hover:bg-yellow-400 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </button>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  Voltar ao início
                </a>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
