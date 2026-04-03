"use client";

import React, { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    __logError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.props.onError?.(error, errorInfo);
    if (typeof window !== "undefined" && window.__logError) {
      window.__logError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="app-panel w-full max-w-md border p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[var(--danger)]" />
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">Algo deu errado</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Ocorreu um erro inesperado. Tente recarregar a página.</p>
                {process.env.NODE_ENV === "development" && this.state.error ? (
                  <details className="mt-4 text-xs text-[var(--text-tertiary)]">
                    <summary className="cursor-pointer font-mono">Detalhes do erro</summary>
                    <pre className="app-surface-muted mt-2 overflow-auto rounded-[var(--radius-control)] p-3 text-xs">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                ) : null}
                <button type="button" onClick={() => window.location.reload()} className="btn-base btn-primary btn-md mt-4 w-full">
                  <RefreshCw className="h-4 w-4" />
                  Recarregar página
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function useErrorHandler() {
  const handleError = (error: Error) => {
    console.error("[useErrorHandler]", error);
    throw error;
  };

  return { handleError };
}
