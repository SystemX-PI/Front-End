import { useEffect, useId, useRef } from "react";
import { Send, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar envio",
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const opener = document.activeElement;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [open]);
  return (
    <dialog
      className="confirm-dialog"
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={event => {
        event.preventDefault();
        onCancel();
      }}
    >
      <button
        className="dialog-close"
        type="button"
        onClick={onCancel}
        aria-label="Fechar confirmação"
      >
        <X size={18} />
      </button>
      <span className="empty-state-icon">
        <Send size={24} aria-hidden="true" />
      </span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      <div className="dialog-actions">
        <button
          ref={cancelRef}
          className="button secondary"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button className="button primary" onClick={onConfirm} type="button">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
