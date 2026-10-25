import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  error: Error | null;
}

// Shows a recovery screen instead of a blank page when a render crashes
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-zinc-100">
        <div className="max-w-md w-full rounded-3xl p-6 border border-rose-200 dark:border-rose-500/30 bg-white dark:bg-slate-900 shadow-2xl space-y-4 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold">Une erreur inattendue est survenue</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono break-words">{this.state.error.message}</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Vos idées enregistrées sont conservées dans le navigateur.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-spark-600 hover:bg-spark-500 text-white text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
}
