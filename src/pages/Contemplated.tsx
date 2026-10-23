import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import AdminShell from "../components/AdminShell";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
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
  const [processId, setProcessId] = useState("");
  const [process, setProcess] = useState<ProcessResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [communication, setCommunication] = useState<CommunicationResponse | null>(null);
  const [resending, setResending] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(processId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({ kind: "error", message: "Informe um identificador de processo válido." });
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
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível consultar o processo." });
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
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível consultar a comunicação." });
    }
  }

  async function handleResend() {
    if (!process || resending) return;
    const confirmed = window.confirm(
      `Solicitar reenvio da comunicação do processo #${process.id}?`,
    );
    if (!confirmed) return;
    setResending(true);
    setFeedback(null);
    try {
      const response = await backend.processes.resendCommunication(process.id);
      setCommunication(response);
      setFeedback({
        kind: "info",
        message: `Solicitação de reenvio processada. Status retornado pelo backend: ${readable(response.statusGeral)}. Isso não confirma a entrega.`,
      });
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Não foi possível solicitar o reenvio." });
    } finally {
      setResending(false);
    }
  }

  const filteredProcess =
    process && (!filterStatus || process.status === filterStatus) ? process : null;

  return (
    <AdminShell
      title="Contemplados"
      subtitle="Consulta individual dos processos disponíveis na API"
    >
      <section className="admin-page-heading">
        <div>
          <h2>Consultar processo</h2>
          <p>
            O backend não oferece listagem ou pesquisa por cliente; a consulta
            disponível exige o ID do processo.
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
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">Todos os status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{readable(status)}</option>
            ))}
          </select>
        </label>
        <button className="button primary" type="submit" disabled={loading}>
          <Search size={16} aria-hidden="true" />
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </form>

      {feedback ? <InlineFeedback kind={feedback.kind} message={feedback.message} /> : null}

      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Resultado da consulta</h3>
            <p>Somente campos efetivamente retornados pelo backend.</p>
          </div>
        </div>
        {filteredProcess ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr><th>Processo</th><th>Contemplação</th><th>Responsável ID</th><th>Status</th><th>Criado em</th><th>Atualizado em</th><th>Ações</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>#{filteredProcess.id}</td>
                  <td>#{filteredProcess.contemplacaoId}</td>
                  <td>{filteredProcess.responsavelId ?? "Não informado"}</td>
                  <td><StatusPill tone={filteredProcess.status === "FINALIZADO" ? "green" : "amber"}>{readable(filteredProcess.status)}</StatusPill></td>
                  <td>{formatDate(filteredProcess.criadoEm)}</td>
                  <td>{formatDate(filteredProcess.atualizadoEm)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="button secondary compact" type="button" onClick={() => void handleCommunication()}>
                        Consultar comunicação
                      </button>
                      <button className="button primary compact" type="button" disabled={resending} onClick={() => void handleResend()}>
                        {resending ? "Solicitando..." : "Solicitar reenvio"}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-table-state">
            {process && filterStatus
              ? "O processo consultado não corresponde ao filtro de status."
              : "Pesquise um processo pelo identificador para exibir seus dados."}
          </p>
        )}
        {communication ? (
          <div className="communication-result" aria-live="polite">
            <strong>Status geral retornado: {readable(communication.statusGeral)}</strong>
            <span>E-mail: {communication.email?.status ?? "Sem dado de canal"}</span>
            <span>WhatsApp: {communication.whatsapp?.status ?? "Sem dado de canal"}</span>
          </div>
        ) : null}
      </section>
      <InlineFeedback
        kind="info"
        message="Cliente, consórcio, crédito, tentativas de contato e ação de baixa não podem ser apresentados nesta listagem: a API não oferece consulta agregada nem associação autorizada de usuário para essas operações."
      />
    </AdminShell>
  );
}
