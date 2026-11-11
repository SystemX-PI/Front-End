import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";

import type { Toast } from "../services/notifications";

function ToastItem({
  toast,
  dismiss,
}: {
  toast: Toast;
  dismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(
      () => dismiss(toast.id),
      toast.kind === "error" ? 10000 : 6000,
    );
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.kind, dismiss]);
  const Icon =
    toast.kind === "success"
      ? CircleCheck
      : toast.kind === "error"
        ? CircleAlert
        : Info;
  return (
    <div
      className={`toast toast-${toast.kind}`}
      role={toast.kind === "error" ? "alert" : "status"}
    >
      <Icon size={20} />
      <p>{toast.message}</p>
      <button
        type="button"
        aria-label="Fechar notificação"
        onClick={() => dismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const handler = (event: Event) =>
      setToasts((current) => [
        ...current.slice(-3),
        (event as CustomEvent<Toast>).detail,
      ]);
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);
  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  return (
    <>
      {children}
      <div className="toast-region" aria-label="Notificações do sistema">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </>
  );
}
