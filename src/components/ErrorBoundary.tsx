import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
          <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-8 shadow-lg">
            <h1 className="text-xl font-bold text-rose-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-slate-600">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
