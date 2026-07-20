import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
          <div className="max-w-md w-full border border-border rounded-card p-6 card-shadow bg-surface text-center">
            <h2 className="text-lg font-bold text-text mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-sm text-muted mb-4">
              Veuillez recharger la page pour continuer.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full px-5 h-10 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 transition-opacity"
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
