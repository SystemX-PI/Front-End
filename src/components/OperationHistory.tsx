import { useCallback } from "react";
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
  const load = useCallback(
    (signal: AbortSignal) =>
      backend.operation.history(processId, signal).catch(operationError),
    [processId],
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
    </section>
  );
}

