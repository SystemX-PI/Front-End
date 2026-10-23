import { useEffect, useId, useRef } from "react";
import { Send, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      className="confirm-dialog"
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={onCancel}
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
        <Send size={24} />
      </span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      <div className="dialog-actions">
        <button
          autoFocus
          className="button secondary"
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
        <button className="button primary" onClick={onConfirm} type="button">
          Confirmar envio
        </button>
      </div>
    </dialog>
  );
}
