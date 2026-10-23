import AppRoutes from "./routes";
import ToastProvider from "./components/ToastProvider";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ErrorBoundary>
  );
}
