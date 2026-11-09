import { Mail, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { backend, type ChannelResponse } from "../services/backend";
import { formatDate, readable } from "../services/format";
import { EmptyState, ErrorState, Pagination, Skeleton } from "./DataUi";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { InlineFeedback, StatusPill } from "./IntegrationUi";
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
            channel?.status === "SUCESSO"
              ? "green"
              : channel?.status === "FALHA"
                ? "red"
                : "amber"
          }
        >
          {channel ? readable(channel.status) : "Sem canal"}
        </StatusPill>
      </span>
      {channel?.erro ? <p className="channel-error">{channel.erro}</p> : null}
    </div>
  );
}

export default function CommunicationQueue() {
  const [confirmId,setConfirmId] = useState<number|null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const term = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => backend.integrations.queuePage(page - 1, term, status, signal), [page, term, status]);
  const { data, loading, error, refresh } = useResource(load);
  const [busy, setBusy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const queue = Array.isArray(data?.items) ? data.items : [];
  const size = 20;
  async function send(id: number) {
    if (busy !== null || !Number.isSafeInteger(id) || id <= 0) return;
    setConfirmId(null);
    setBusy(id);
    setFeedback("");
    try {
      const result = await backend.processes.resendCommunication(id);
      const channels = [result.email, result.whatsapp].filter(
        (channel) => channel !== null,
      );
      const errors = channels
        .filter((channel) => channel.erro)
        .map((channel) => channel.erro)
        .join(" ");
      const message =
        errors ||
        (channels.length > 0 &&
        channels.every((channel) => channel.status === "SUCESSO")
          ? "Envio aceito pelos canais configurados."
          : "Envio ainda pendente. Confira a configuração dos canais.");
      setFeedback(message);
      notify(
        message,
        errors
          ? "error"
          : result.statusGeral === "PENDENTE"
            ? "info"
            : "success",
      );
      refresh();
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
      <ConfirmDialog open={confirmId!==null} title={`Enviar comunicação do processo #${confirmId}?`} description="O contato pode receber uma nova mensagem. Confira o processo antes de confirmar." onCancel={()=>setConfirmId(null)} onConfirm={()=>{if(confirmId!==null)void send(confirmId);}}/>
      <section
        className="notification-metrics"
        aria-label="Resumo da comunicação"
      >
        {[
          { label: "Nesta pagina", value: queue.length },
          {
            label: "Pendentes",
            value: queue.filter(
              (item) =>
                (item?.comunicacao?.statusGeral || "PENDENTE") === "PENDENTE",
            ).length,
          },
          {
            label: "Envio em algum canal",
            value: queue.filter(
              (item) =>
                Boolean(item?.comunicacao?.statusGeral) &&
                item.comunicacao.statusGeral !== "PENDENTE",
            ).length,
          },
          {
            label: "Com falha",
            value: queue.filter(
              (item) =>
                item?.comunicacao?.email?.status === "FALHA" ||
                item?.comunicacao?.whatsapp?.status === "FALHA",
            ).length,
          },
        ].map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>{loading || error ? "—" : metric.value}</strong>
          </article>
        ))}
      </section>
      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Fila de comunicação</h3>
            <p>Busque em toda a fila. Os indicadores resumem a pagina atual.</p>
          </div>
          <div className="split-actions">
            <Link
              className="button secondary compact"
              to="/admin/disparo-manual"
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
                            to={`/admin/contemplados?processo=${item.processoId}`}
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
                            to={`/admin/disparo-manual?processo=${item.processoId}`}
                          >
                            <MessageCircle size={14} />
                            Mensagem manual
                          </Link>
                        ) : null}
                        <button
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
                        </button>
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
