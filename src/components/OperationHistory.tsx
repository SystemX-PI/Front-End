import { useCallback, useState, type FormEvent } from "react";
import { backend, type OperationEvent } from "../services/backend";
import { operationError } from "../services/operationErrors";
import { useResource } from "../hooks/useResource";
import { EmptyState, ErrorState, Skeleton } from "./DataUi";
import { communicationStatus, formatDate, readable } from "../services/format";

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
  const [editing, setEditing] = useState<number | null>(null);
  const [evidence, setEvidence] = useState("");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");

  async function reconcile(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    if (!evidence.trim() || saving) return;
    setSaving(true);
    setFailure("");
    try {
      await backend.processes.reconcileCommunication(processId, id, "ACEITO_PROVEDOR", evidence.trim());
      setEditing(null);
      result.refresh();
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "Não foi possível reconciliar a tentativa.");
    } finally {
      setSaving(false);
    }
  }

  const items: HistoryItem[] = Array.isArray(result.data?.items)
    ? result.data.items
    : Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <section className="panel data-panel">
      <div className="split-actions">
        <h3>Histórico de comunicações</h3>
        <button type="button" className="button secondary compact" disabled={result.loading}
          onClick={result.refresh}>Atualizar histórico</button>
      </div>
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
                  {channelOrAction} · {communicationStatus(e?.status || "PENDENTE", e?.estadoDespacho)}
                </strong>
                <p>
                  {timestamp} · {actor}
                </p>
                {e?.comunicadoOriginalId != null && <p>Reenvio do comunicado #{e.comunicadoOriginalId}</p>}
                {detail ? <p>{detail}</p> : null}
                {e?.reconciliavel && e.id != null && (editing === e.id ? (
                  <form onSubmit={event => void reconcile(event, e.id!)} className="admin-form">
                    <p>Registre o aceite somente depois de verificá-lo no provedor. Resultados sem aceite verificado continuam bloqueados.</p>
                    <label className="field">Evidência verificada
                      <textarea required maxLength={255} value={evidence} onChange={event => setEvidence(event.target.value)} />
                    </label>
                    {failure && <p role="alert">{failure}</p>}
                    <button className="button secondary compact" disabled={saving || !evidence.trim()}>
                      Registrar reconciliação
                    </button>
                    <button type="button" className="button secondary compact" disabled={saving} onClick={() => setEditing(null)}>
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <button className="button secondary compact" disabled={saving} type="button" onClick={() => {
                    setEditing(e.id!);
                    setEvidence("");
                    setFailure("");
                  }}>Reconciliar tentativa #{e.id}</button>
                ))}

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

