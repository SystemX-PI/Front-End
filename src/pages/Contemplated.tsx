import { MessageCircle, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CompanyProcesses } from "./CompanyOperation";
import AdminShell from "../components/AdminShell";
import { useOperationBase } from "../hooks/useOperationBase";
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
  processStatuses,
} from "../services/backend";
import { formatDate, readable } from "../services/format";

type Feedback = { kind: "info" | "success" | "error"; message: string } | null;

export default function Contemplated() {
  const operationBase = useOperationBase();
  const [params, setParams] = useSearchParams();
  const urlProcessParam = params.get("processo");
  const [input, setInput] = useState({ param: urlProcessParam, value: urlProcessParam || "" });
  const processId = input.param === urlProcessParam ? input.value : (urlProcessParam || "");
  const setProcessId = (value: string) => setInput({ param: urlProcessParam, value });
  const [process, setProcess] = useState<ProcessResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [communication, setCommunication] =
    useState<CommunicationResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const executeLookup = useCallback(async (rawValue: string, signal?: AbortSignal) => {
    const id = Number(rawValue.trim());
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({
        kind: "error",
        message: "Informe um identificador de processo válido.",
      });
      setProcess(null);
      setCommunication(null);
      return;
    }
    setLoading(true);
    setFeedback(null);
    setCommunication(null);
    try {
      const result = await backend.processes.get(id, signal);
      if (signal?.aborted) return;
      if (
        !result ||
        !Number.isSafeInteger(result.id) ||
        typeof result.status !== "string"
      ) {
        throw new Error(
          "O servidor retornou dados incompletos para o processo consultado.",
        );
      }
      setProcess(result);
    } catch (error) {
      if (signal?.aborted) return;
      setProcess(null);
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar o processo.",
      });
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [setFeedback, setProcess, setCommunication, setLoading]);

  useEffect(() => {
    if (!urlProcessParam) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void executeLookup(urlProcessParam, controller.signal);
    });
    return () => controller.abort();
  }, [urlProcessParam, executeLookup]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = processId.trim();
    const id = Number(trimmed);
    if (Number.isSafeInteger(id) && id > 0 && String(id) !== urlProcessParam) {
      setParams({ processo: String(id) }, { replace: true });
      return;
    }
    await executeLookup(trimmed);
  }

  async function handleCommunication() {
    if (!process) return;
    try {
      const result = await backend.processes.communication(process.id);
      if (!result || typeof result.statusGeral !== "string") {
        throw new Error(
          "O servidor retornou dados incompletos para a comunicação.",
        );
      }
      setCommunication(result);
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

  const pendingResend = useRef<{ id: number; key: ReturnType<typeof crypto.randomUUID> } | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);

  async function handleResend() {
    if (!process || resending) return;
    setConfirming(false);
    setResending(true);
    setFeedback(null);
    try {
      if (pendingResend.current?.id !== process.id) {
        pendingResend.current = { id: process.id, key: crypto.randomUUID() };
      }
      const response = await backend.processes.resendCommunication(process.id, pendingResend.current.key);
      pendingResend.current = null;
      setHistoryRevision(value => value + 1);
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
      {operationBase === "/app" && <CompanyProcesses/>}
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
            {processStatuses.map((status) => (
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
            <table className="admin-table admin-table-cards" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" scope="col">Processo</th>
                  <th role="columnheader" scope="col">Contemplação</th>
                  <th role="columnheader" scope="col">Código do responsável</th>
                  <th role="columnheader" scope="col">Status</th>
                  <th role="columnheader" scope="col">Criado em</th>
                  <th role="columnheader" scope="col">Atualizado em</th>
                  <th role="columnheader" scope="col">Ações</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                <tr role="row">
                  <td role="cell" data-label="Processo">#{filteredProcess.id}</td>
                  <td role="cell" data-label="Contemplação">#{filteredProcess.contemplacaoId}</td>
                  <td role="cell" data-label="Responsável">{filteredProcess.responsavelId ?? "Não informado"}</td>
                  <td role="cell" data-label="Status">
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
                  <td role="cell" data-label="Criado em">{formatDate(filteredProcess.criadoEm)}</td>
                  <td role="cell" data-label="Atualizado em">{formatDate(filteredProcess.atualizadoEm)}</td>
                  <td role="cell" data-label="Ações">
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
                        to={`${operationBase}/disparo-manual?processo=${filteredProcess.id}`}
                      >
                        <MessageCircle size={14} />
                        Disparo manual
                      </Link>
                      {operationBase === "/admin" && <button
                        className="button primary compact"
                        type="button"
                        disabled={resending}
                        onClick={() => setConfirming(true)}
                      >
                        {resending ? "Solicitando..." : "Solicitar reenvio"}
                      </button>}
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
      {process && <><ProcessStatusEditor key={`${process.id}-${process.status}`} process={process} onChange={setProcess}/><section className="panel"><Link className="button secondary" to={`${operationBase}/baixas?processo=${process.id}`}>Conferir baixa deste processo</Link></section><OperationHistory key={`${process.id}-${historyRevision}`} processId={process.id}/></>}
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
