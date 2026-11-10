import { useCallback, useState } from "react";
import { backend, type OperationEvent } from "../services/backend";
import { operationError } from "../services/operationErrors";
import { useResource } from "../hooks/useResource";
import { EmptyState, ErrorState, Skeleton } from "./DataUi";
import { formatDate, readable } from "../services/format";

type HistoryItem = Partial<OperationEvent> & {
  channel?: string | null;
  destinatario?: string | null;
  erro?: string | null;
  mensagem?: string | null;
  enviadaEm?: string | null;
  criadaEm?: string | null;
};

export default function OperationHistory({ processId }: { processId: number }) {
  const [page, setPage] = useState(0);
  const load = useCallback(
    (signal: AbortSignal) =>
      backend.operation.history(processId, page, signal).catch(operationError),
    [processId, page],
  );
  const result = useResource(load);
  const items: HistoryItem[] = Array.isArray(result.data?.items)
    ? result.data.items
    : Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <section className="panel data-panel">
      <h3>Histórico de comunicações</h3>
      {result.data && <p>{result.data.total} registros</p>}
      {result.loading ? (
        <Skeleton />
      ) : result.error ? (
        <ErrorState message={result.error} retry={result.refresh} />
      ) : items.length ? (
        <ol className="operation-history">
          {items.map((e, idx) => {
            const channelOrAction = e?.canal
              ? readable(e.canal)
              : e?.channel
                ? readable(e.channel)
                : e?.acao || "Comunicação";
            const timestamp = formatDate(
              e?.data || e?.enviadaEm || e?.criadaEm,
            );
            const actor =
              e?.usuarioNome ||
              e?.destinatario ||
              "Responsável não informado";
            const detail = e?.observacao || e?.erro || e?.mensagem || "";
            return (
              <li key={e?.id ?? idx}>
                <strong>
                  {channelOrAction} · {readable(e?.status || "PENDENTE")}
                </strong>
                <p>
                  {timestamp} · {actor}
                </p>
                {detail ? <p>{detail}</p> : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          title="Nenhuma comunicação registrada"
          description="As tentativas de contato aparecerão aqui quando registradas."
        />
      )}
      {result.data && result.data.total > result.data.size && (
        <nav className="split-actions" aria-label="Paginação do histórico">
          <button className="button secondary compact" disabled={page === 0 || result.loading}
            onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page + 1}</span>
          <button className="button secondary compact"
            disabled={result.loading || (page + 1) * result.data.size >= result.data.total}
            onClick={() => setPage(page + 1)}>Próxima</button>
        </nav>
      )}
    </section>
  );
}

