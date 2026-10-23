import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="admin-page-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Inbox size={26} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <TriangleAlert size={22} aria-hidden="true" />
      <div>
        <strong>Não foi possível carregar</strong>
        <p>{message}</p>
      </div>
      {retry ? (
        <button
          className="button secondary compact"
          onClick={retry}
          type="button"
        >
          <RefreshCw size={15} />
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      className="skeleton-list"
      role="status"
      aria-label="Carregando dados"
      aria-busy="true"
    >
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  total,
  size = 8,
  onChange,
}: {
  page: number;
  total: number;
  size?: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <nav className="pagination" aria-label="Paginação">
      <span>
        {total === 0
          ? "0 registros"
          : `${(page - 1) * size + 1}–${Math.min(page * size, total)} de ${total} registros`}
      </span>
      <div>
        <button
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          type="button"
        >
          <ChevronLeft size={16} />
        </button>
        <span aria-live="polite">
          {page} / {pages}
        </span>
        <button
          aria-label="Próxima página"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          type="button"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
