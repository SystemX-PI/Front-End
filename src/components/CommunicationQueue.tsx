import { Mail, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useResource } from "../hooks/useResource";
import { backend, type ChannelResponse } from "../services/backend";
import { formatDate, readable } from "../services/format";
import { EmptyState, ErrorState, Pagination, Skeleton } from "./DataUi";
import { usePagination } from "../hooks/usePagination";
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
  const { data, loading, error, refresh } = useResource(
    backend.integrations.queue,
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const queue = data || [];
  const filtered = queue.filter(
    (item) =>
      (!status ||
        (status === "FALHA"
          ? item.comunicacao.email?.status === "FALHA" ||
            item.comunicacao.whatsapp?.status === "FALHA"
          : item.comunicacao.statusGeral === status)) &&
      `${item.processoId} ${item.idExterno || ""} ${item.origem || ""} ${item.comunicacao.email?.destinatario || ""} ${item.comunicacao.whatsapp?.destinatario || ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const { page, setPage, pageItems, size } = usePagination(filtered);
  async function send(id: number) {
    if (busy !== null) return;
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
      <section
        className="notification-metrics"
        aria-label="Resumo da comunicação"
      >
        {[
          { label: "Recebidos", value: queue.length },
          {
            label: "Pendentes",
            value: queue.filter(
              (item) => item.comunicacao.statusGeral === "PENDENTE",
            ).length,
          },
          {
            label: "Envio em algum canal",
            value: queue.filter(
              (item) => item.comunicacao.statusGeral !== "PENDENTE",
            ).length,
          },
          {
            label: "Com falha",
            value: queue.filter(
              (item) =>
                item.comunicacao.email?.status === "FALHA" ||
                item.comunicacao.whatsapp?.status === "FALHA",
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
            <p>Acompanhe os canais e solicite o envio de cada processo.</p>
          </div>
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
        ) : !filtered.length ? (
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
              {pageItems.map((item) => (
                <article className="communication-card" key={item.processoId}>
                  <div className="communication-card-heading">
                    <div>
                      <Link
                        className="text-link"
                        to={`/admin/contemplados?processo=${item.processoId}`}
                      >
                        {item.idExterno || `Processo #${item.processoId}`}
                      </Link>
                      <p>
                        {item.origem || "Integração"} · #{item.processoId} ·{" "}
                        {formatDate(item.recebidaEm)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="button primary compact"
                      disabled={busy !== null}
                      onClick={() => void send(item.processoId)}
                    >
                      {busy === item.processoId ? (
                        <span className="spinner" />
                      ) : (
                        <Send size={15} />
                      )}
                      {busy === item.processoId
                        ? "Enviando…"
                        : item.comunicacao.statusGeral === "PENDENTE"
                          ? "Notificar"
                          : "Reenviar"}
                    </button>
                  </div>
                  <div className="channel-grid">
                    <ChannelStatus
                      channel={item.comunicacao.email}
                      name="E-mail"
                    />
                    <ChannelStatus
                      channel={item.comunicacao.whatsapp}
                      name="WhatsApp"
                    />
                  </div>
                </article>
              ))}
            </div>
            <Pagination
              total={filtered.length}
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
