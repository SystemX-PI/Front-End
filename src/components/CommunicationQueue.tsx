import { Mail, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { backend, type ChannelResponse } from "../services/backend";
import { communicationStatus, formatDate } from "../services/format";
import { EmptyState, ErrorState, Pagination, Skeleton } from "./DataUi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { InlineFeedback, StatusPill } from "./IntegrationUi";
import { useOperationBase } from "../hooks/useOperationBase";
import { notify } from "../services/notifications";

export function ChannelStatus({
  channel,
  name,
}: {
  channel: ChannelResponse | null;
  name: string;
}) {
  return (
    <div className="channel-status">
      <span>
        {name === "E-mail" ? <Mail size={15} /> : <MessageCircle size={15} />}
        <strong>{channel?.destinatario || "Não informado"}</strong>
        <StatusPill
          tone={
            channel?.status === "SUCESSO" || channel?.status === "REALIZADA"
              ? "green"
              : channel?.status === "FALHA"
                ? "red"
                : "amber"
          }
        >
          {channel ? communicationStatus(channel.status, channel.estadoDespacho) : "Sem canal"}
        </StatusPill>
      </span>
      {channel?.erro ? <p className="channel-error">{channel.erro}</p> : null}
    </div>
  );
}

export default function CommunicationQueue() {
  const operationBase = useOperationBase();
  const [confirmId,setConfirmId] = useState<number|null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState(7);
  const loadSummary = useCallback((signal: AbortSignal) => {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - period + 1);
    return backend.integrations.notificationSummary(
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
      signal,
    );
  }, [period]);
  const summary = useResource(loadSummary);
  const term = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => backend.integrations.queuePage(page - 1, term, status, signal), [page, term, status]);
  const { data, loading, error, refresh } = useResource(load);
  const [busy, setBusy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const queue = Array.isArray(data?.items) ? data.items : [];
  const confirmItem =
    confirmId !== null
      ? queue.find((item) => item?.processoId === confirmId) || null
      : null;
  const size = 20;
  const pendingRequest = useRef<{ id: number; key: ReturnType<typeof crypto.randomUUID> } | null>(null);
  async function send(id: number) {
    if (busy !== null || !Number.isSafeInteger(id) || id <= 0) return;
    setConfirmId(null);
    setBusy(id);
    setFeedback("");
    try {
      if (pendingRequest.current?.id !== id) pendingRequest.current = { id, key: crypto.randomUUID() };
      const result = await backend.processes.resendCommunication(id, pendingRequest.current.key);
      pendingRequest.current = null;
      const channels = [result.email, result.whatsapp].filter(channel => channel != null);
      const accepted = channels.filter(channel => ["SUCESSO", "REALIZADA"].includes(channel.status)).length;
      const errors = channels.map(channel => channel.erro).filter(Boolean).join(" ");
      const failed = channels.some(channel => channel.status === "FALHA");
      const queued = channels.some(channel => channel.estadoDespacho === "NA_FILA" || channel.estadoDespacho === "EM_ENVIO");
      const message = queued ? "Solicitação na fila. Consulte o histórico para acompanhar." : accepted > 0
        ? accepted === channels.length
          ? "Envio aceito pelos canais configurados."
          : "Envio parcial. Um canal aceitou a mensagem e o outro precisa de atenção."
        : failed ? "Os canais não confirmaram o envio." : "Envio sem confirmação. Confira a configuração dos canais.";
      const detail = errors ? `${message} ${errors}` : message;
      setFeedback(detail);
      notify(detail, accepted > 0 && accepted === channels.length ? "success" : failed && !accepted ? "error" : "info");
      refresh();
      summary.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar o envio.";
      setFeedback(message);
      notify(message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <ConfirmDialog
        open={confirmId !== null}
        title={`Enviar comunicação do processo #${confirmId}?`}
        description={
          confirmItem?.idExterno
            ? `O contato vinculado a ${confirmItem.idExterno} (${confirmItem.origem || "Integração"}) pode receber uma nova mensagem. Confira o processo antes de confirmar.`
            : "O contato pode receber uma nova mensagem. Confira o processo antes de confirmar."
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId !== null) void send(confirmId);
        }}
      />
      <section className="panel notification-summary" aria-labelledby="notification-summary-title">
        <div className="data-panel-heading">
          <div>
            <h3 id="notification-summary-title">Notificações no período</h3>
            <p>Uma tentativa por canal. O aceite do provedor não confirma a entrega.</p>
          </div>
          <label className="field">
            <span>Período</span>
            <select value={period} onChange={event => setPeriod(Number(event.target.value))}>
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
          </label>
        </div>
        {summary.error ? <ErrorState message={summary.error} retry={summary.refresh} /> : (
          <div className="notification-metrics" aria-busy={summary.loading}>
            {([
              ["Tentativas", "total"],
              ["Aceitas pelo provedor", "accepted"],
              ["Pendentes", "pending"],
              ["Falhas", "failed"],
            ] as const).map(([label, key]) => (
              <article key={key}>
                <small>{label}</small>
                <strong>{summary.loading ? "—" : summary.data?.[key]?.toLocaleString("pt-BR") ?? "—"}</strong>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Fila de comunicação</h3>
            <p>Busque pelo processo e confira o último envio de cada canal.</p>
          </div>
          <div className="split-actions">
            <Link
              className="button secondary compact"
              to={`${operationBase}/disparo-manual`}
            >
              <MessageCircle size={15} />
              Disparo manual
            </Link>
            <button
              type="button"
              className="button secondary compact"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
        <div className="list-toolbar">
          <label className="search-control">
            <Search size={17} />
            <input
              aria-label="Buscar na fila"
              placeholder="ID, e-mail, telefone ou origem"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Filtrar comunicações"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendentes</option>
            <option value="COMUNICADO_PARCIAL">Envio parcial</option>
            <option value="COMUNICADO_NOS_DOIS">Envio nos dois canais</option>
            <option value="FALHA">Com falha</option>
          </select>
        </div>
        {feedback ? <InlineFeedback message={feedback} /> : null}
        {error ? (
          <ErrorState message={error} retry={refresh} />
        ) : loading ? (
          <Skeleton />
        ) : !queue.length ? (
          <EmptyState
            title={
              search || status
                ? "Nenhum resultado para esse filtro"
                : "Tudo pronto para o primeiro evento"
            }
            description={
              search || status
                ? "Ajuste sua busca para encontrar outros processos."
                : "Receba uma contemplação no formulário abaixo para iniciar a comunicação."
            }
          />
        ) : (
          <>
            <div className="communication-list">
              {queue.map((item, index) => {
                const hasValidId =
                  Number.isSafeInteger(item?.processoId) && item.processoId > 0;
                const statusGeral = item?.comunicacao?.statusGeral || "PENDENTE";
                const cardKey = hasValidId
                  ? `comm-card-${item.processoId}`
                  : `comm-card-fallback-${index}`;
                return (
                  <article className="communication-card" key={cardKey}>
                    <div className="communication-card-heading">
                      <div>
                        {hasValidId ? (
                          <Link
                            className="text-link"
                            to={`${operationBase}/contemplados?processo=${item.processoId}`}
                          >
                            {item.idExterno || `Processo #${item.processoId}`}
                          </Link>
                        ) : (
                          <strong>
                            {item?.idExterno || "Processo sem identificador"}
                          </strong>
                        )}
                        <p>
                          {item?.origem || "Integração"} ·{" "}
                          {hasValidId ? `#${item.processoId}` : "ID indisponível"}{" "}
                          · {formatDate(item?.recebidaEm)}
                        </p>
                      </div>
                      <div className="split-actions">
                        {hasValidId ? (
                          <Link
                            className="button secondary compact"
                            to={`${operationBase}/disparo-manual?processo=${item.processoId}`}
                          >
                            <MessageCircle size={14} />
                            Mensagem manual
                          </Link>
                        ) : null}
                        {operationBase === "/admin" && <button
                          type="button"
                          className="button primary compact"
                          disabled={busy !== null || !hasValidId}
                          onClick={() => {
                            if (hasValidId) setConfirmId(item.processoId);
                          }}
                        >
                          {hasValidId && busy === item.processoId ? (
                            <span className="spinner" />
                          ) : (
                            <Send size={15} />
                          )}
                          {hasValidId && busy === item.processoId
                            ? "Enviando…"
                            : statusGeral === "PENDENTE"
                              ? "Notificar"
                              : "Reenviar"}
                        </button>}
                      </div>
                    </div>
                    <div className="channel-grid">
                      <ChannelStatus
                        channel={item?.comunicacao?.email ?? null}
                        name="E-mail"
                      />
                      <ChannelStatus
                        channel={item?.comunicacao?.whatsapp ?? null}
                        name="WhatsApp"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              total={data?.total || 0}
              page={page}
              onChange={setPage}
              size={size}
            />
          </>
        )}
      </section>
    </>
  );
}
