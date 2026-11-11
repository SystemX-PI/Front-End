import { useEffect, useId, useRef } from "react";
import { Send, X, type LucideIcon } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar envio",
  busy = false,
  icon: Icon = Send,
  danger = false,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  busy?: boolean;
  icon?: LucideIcon;
  danger?: boolean;
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
      onCancel={(e) => { if (busy) e.preventDefault(); else onCancel(); }}
    >
      <button
        className="dialog-close"
        type="button"
        onClick={onCancel}
        disabled={busy}
        aria-label="Fechar confirmação"
      >
        <X size={18} />
      </button>
      <span className="empty-state-icon">
        <Icon size={24} />
      </span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      <div className="dialog-actions">
        <button
          autoFocus
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
          type="button"
        >
          Cancelar
        </button>
        <button className={`button ${danger ? "danger" : "primary"}`} onClick={onConfirm} disabled={busy} type="button">
          {busy ? "Processando…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
