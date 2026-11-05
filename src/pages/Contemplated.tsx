import { MessageCircle, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import { EmptyState, Skeleton } from "../components/DataUi";
import ProcessStatusEditor from "../components/ProcessStatusEditor";
import OperationHistory from "../components/OperationHistory";
import { Link } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import { ChannelStatus } from "../components/CommunicationQueue";
import { notify } from "../services/notifications";
import {
  backend,
  type CommunicationResponse,
  type ProcessResponse,
  type ProcessStatus,
} from "../services/backend";

type Feedback = { kind: "info" | "success" | "error"; message: string } | null;

const statuses: ProcessStatus[] = [
  "CONTEMPLADO",
  "AGUARDANDO_COMUNICACAO",
  "EM_COMUNICACAO",
  "CLIENTE_CONTATADO",
  "AGUARDANDO_DOCUMENTOS",
  "DOCUMENTOS_RECEBIDOS",
  "EM_ANALISE",
  "EM_PROCESSO_DE_BAIXA",
  "FINALIZADO",
  "CANCELADO",
];

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(date);
}

export default function Contemplated() {
  const [params] = useSearchParams();
  const [processId, setProcessId] = useState(params.get("processo") || "");
  const [process, setProcess] = useState<ProcessResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [communication, setCommunication] =
    useState<CommunicationResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(processId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({
        kind: "error",
        message: "Informe um identificador de processo válido.",
      });
      setProcess(null);
      return;
    }
    setLoading(true);
    setFeedback(null);
    setCommunication(null);
    try {
      setProcess(await backend.processes.get(id));
    } catch (error) {
      setProcess(null);
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar o processo.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCommunication() {
    if (!process) return;
    try {
      setCommunication(await backend.processes.communication(process.id));
      setFeedback(null);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a comunicação.",
      });
    }
  }

  async function handleResend() {
    if (!process || resending) return;
    setConfirming(false);
    setResending(true);
    setFeedback(null);
    try {
      const response = await backend.processes.resendCommunication(process.id);
      setCommunication(response);
      const errors = [response.email?.erro, response.whatsapp?.erro]
        .filter(Boolean)
        .join(" ");
      notify(
        errors ||
          "Solicitação de envio processada. Confira o resultado de cada canal.",
        errors ? "error" : "info",
      );
      setFeedback({
        kind: "info",
        message: `Solicitação de reenvio processada. Status retornado pelo backend: ${readable(response.statusGeral)}. Isso não confirma a entrega.`,
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível solicitar o reenvio.",
      });
    } finally {
      setResending(false);
    }
  }

  const filteredProcess =
    process && (!filterStatus || process.status === filterStatus)
      ? process
      : null;

  return (
    <AdminShell
      title="Contemplados"
      subtitle="Consulta individual dos processos disponíveis na API"
    >
      <section className="admin-page-heading">
        <div>
          <h2>Consultar processo</h2>
          <p>
            Consulte os dados e acompanhe a comunicação de um processo pelo
            identificador.
          </p>
        </div>
      </section>

      <form className="panel admin-search-form" onSubmit={handleSearch}>
        <label className="field">
          <span>ID do processo</span>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={processId}
            onChange={(event) => setProcessId(event.target.value)}
            placeholder="Informe o identificador"
          />
        </label>
        <label className="field">
          <span>Filtrar status</span>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {readable(status)}
              </option>
            ))}
          </select>
        </label>
        <button className="button primary" type="submit" disabled={loading}>
          <Search size={16} aria-hidden="true" />
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {feedback ? (
        <InlineFeedback kind={feedback.kind} message={feedback.message} />
      ) : null}

      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Resultado da consulta</h3>
            <p>Detalhes do registro e ações de comunicação.</p>
          </div>
        </div>
        {loading ? (
          <Skeleton rows={2} />
        ) : filteredProcess ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Contemplação</th>
                  <th>Responsável ID</th>
                  <th>Status</th>
                  <th>Criado em</th>
                  <th>Atualizado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>#{filteredProcess.id}</td>
                  <td>#{filteredProcess.contemplacaoId}</td>
                  <td>{filteredProcess.responsavelId ?? "Não informado"}</td>
                  <td>
                    <StatusPill
                      tone={
                        filteredProcess.status === "FINALIZADO"
                          ? "green"
                          : "amber"
                      }
                    >
                      {readable(filteredProcess.status)}
                    </StatusPill>
                  </td>
                  <td>{formatDate(filteredProcess.criadoEm)}</td>
                  <td>{formatDate(filteredProcess.atualizadoEm)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="button secondary compact"
                        type="button"
                        onClick={() => void handleCommunication()}
                      >
                        Consultar comunicação
                      </button>
                      <Link
                        className="button secondary compact"
                        to={`/admin/disparo-manual?processo=${filteredProcess.id}`}
                      >
                        <MessageCircle size={14} />
                        Disparo manual
                      </Link>
                      <button
                        className="button primary compact"
                        type="button"
                        disabled={resending}
                        onClick={() => setConfirming(true)}
                      >
                        {resending ? "Solicitando..." : "Solicitar reenvio"}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={
              process && filterStatus
                ? "Nenhum resultado neste status"
                : "Encontre uma contemplação"
            }
            description={
              process && filterStatus
                ? "Altere o filtro para visualizar o processo consultado."
                : "Informe o identificador para consultar os dados e os canais de contato."
            }
          />
        )}
        {communication ? (
          <div className="communication-result" aria-live="polite">
            <strong>
              Status geral retornado: {readable(communication.statusGeral)}
            </strong>
            <ChannelStatus channel={communication.email} name="E-mail" />
            <ChannelStatus channel={communication.whatsapp} name="WhatsApp" />
          </div>
        ) : null}
      </section>
      {process && <><ProcessStatusEditor key={`${process.id}-${process.status}`} process={process} onChange={setProcess}/><section className="panel"><Link className="button secondary" to={`/admin/baixas?processo=${process.id}`}>Conferir baixa deste processo</Link></section><OperationHistory key={process.id} processId={process.id}/></>}
      <ConfirmDialog
        open={confirming}
        title={`Enviar comunicação do processo #${process?.id}?`}
        description="A solicitação enviará novamente pelos canais disponíveis. Destinatários já contatados também podem receber outra mensagem."
        onCancel={() => setConfirming(false)}
        onConfirm={() => void handleResend()}
      />
    </AdminShell>
  );
}
