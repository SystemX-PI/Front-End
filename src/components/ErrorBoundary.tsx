import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "./DataUi";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "Falha ao renderizar a interface",
      error,
      info.componentStack,
    );
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <ErrorState
          message="Não foi possível exibir esta tela. Recarregue a página para continuar."
          retry={() => window.location.reload()}
        />
      </main>
    ) : (
      this.props.children
    );
  }
}
