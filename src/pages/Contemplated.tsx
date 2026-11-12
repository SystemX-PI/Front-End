import { MessageCircle, Search } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, Pagination, Skeleton } from "../components/DataUi";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import OperationHistory from "../components/OperationHistory";
import ProcessStatusEditor from "../components/ProcessStatusEditor";
import { getUserType } from "../services/auth";
import {
  backend,
  type CommunicationResponse,
  type ProcessResponse,
  type ProcessStatus,
  type UserResponse,
} from "../services/backend";
import { formatDate, readable } from "../services/format";
import { notify } from "../services/notifications";
import { useResource } from "../hooks/useResource";

type Feedback = { kind: "info" | "success" | "error"; message: string } | null;

const statuses: ProcessStatus[] = [
  "CONTEMPLADO", "AGUARDANDO_COMUNICACAO", "EM_COMUNICACAO", "CLIENTE_CONTATADO",
  "AGUARDANDO_DOCUMENTOS", "DOCUMENTOS_RECEBIDOS", "EM_ANALISE",
  "EM_PROCESSO_DE_BAIXA", "FINALIZADO", "CANCELADO",
];

function AssignmentControl({
  process,
  employees,
  employeesLoading,
  onAssigned,
}: {
  process: ProcessResponse;
  employees: UserResponse[];
  employeesLoading: boolean;
  onAssigned: (process: ProcessResponse) => void;
}) {
  const [selected, setSelected] = useState(process.responsavelId ? String(process.responsavelId) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(process.responsavelId ? String(process.responsavelId) : "");
  }, [process.responsavelId]);

  async function save() {
    const responsavelId = Number(selected);
    if (!Number.isSafeInteger(responsavelId) || responsavelId <= 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await backend.processes.assignResponsible(process.id, responsavelId);
      onAssigned(updated);
      notify(`Processo #${process.id} atribuído ao responsável selecionado.`, "success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atribuir o processo.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-row-actions">
    <label className="sr-only" htmlFor={`responsavel-${process.id}`}>Responsável do processo #{process.id}</label>
    <select id={`responsavel-${process.id}`} value={selected} disabled={busy || employeesLoading} onChange={event => setSelected(event.target.value)}>
      <option value="">Selecionar funcionário</option>
      {process.responsavelId && !employees.some(employee => employee.id === process.responsavelId) && <option value={process.responsavelId}>Responsável atual #{process.responsavelId}</option>}
      {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.nome}</option>)}
    </select>
    <button className="button secondary compact" type="button" disabled={busy || !selected || selected === String(process.responsavelId ?? "")} onClick={() => void save()}>
      {busy ? "Salvando…" : "Atribuir"}
    </button>
    {error && <span role="alert">{error}</span>}
  </div>;
}

export default function Contemplated() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = params.get("q") || "";
  const status = params.get("status") as ProcessStatus | null;
  const processParam = params.get("processo") || "";
  const isAdmin = getUserType() === "ADMINISTRADOR";
  const [search, setSearch] = useState(query);
  const [statusFilter, setStatusFilter] = useState(status || "");
  const [idInput, setIdInput] = useState(processParam);
  const [process, setProcess] = useState<ProcessResponse | null>(null);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [communication, setCommunication] = useState<CommunicationResponse | null>(null);
  const [resending, setResending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(isAdmin);
  const [employeeError, setEmployeeError] = useState("");

  const loadProcesses = useCallback((signal: AbortSignal) =>
    backend.operation.processes(page - 1, query, status || undefined, signal),
  [page, query, status]);
  const list = useResource(loadProcesses);

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    void backend.users.activeEmployees(controller.signal)
      .then(response => {
        if (!controller.signal.aborted) setEmployees(Array.isArray(response.items) ? response.items.filter(user => user.ativo) : []);
      })
      .catch(cause => {
        if (!controller.signal.aborted) setEmployeeError(cause instanceof Error ? cause.message : "Não foi possível carregar os funcionários ativos.");
      })
      .finally(() => { if (!controller.signal.aborted) setEmployeesLoading(false); });
    return () => controller.abort();
  }, [isAdmin]);

  const executeLookup = useCallback(async (rawValue: string, signal?: AbortSignal) => {
    const id = Number(rawValue.trim());
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({ kind: "error", message: "Informe um identificador de processo válido." });
      setProcess(null);
      setCommunication(null);
      return;
    }
    setLoadingProcess(true);
    setFeedback(null);
    setCommunication(null);
    try {
      const result = await backend.processes.get(id, signal);
      if (signal?.aborted) return;
      if (!result || !Number.isSafeInteger(result.id) || typeof result.status !== "string") {
        throw new Error("O servidor retornou dados incompletos para o processo consultado.");
      }
      setProcess(result);
    } catch (cause) {
      if (signal?.aborted) return;
      setProcess(null);
      setFeedback({ kind: "error", message: cause instanceof Error ? cause.message : "Não foi possível consultar o processo." });
    } finally {
      if (!signal?.aborted) setLoadingProcess(false);
    }
  }, []);

  useEffect(() => {
    if (!processParam) {
      setProcess(null);
      setCommunication(null);
      return;
    }
    setIdInput(processParam);
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) void executeLookup(processParam, controller.signal);
    });
    return () => controller.abort();
  }, [processParam, executeLookup]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (statusFilter) next.set("status", statusFilter);
    setParams(next);
  }

  async function lookupById(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(idInput.trim());
    if (!Number.isSafeInteger(id) || id <= 0) {
      setFeedback({ kind: "error", message: "Informe um identificador de processo válido." });
      return;
    }
    if (String(id) !== processParam) {
      const next = new URLSearchParams(params);
      next.set("processo", String(id));
      setParams(next, { replace: true });
      return;
    }
    await executeLookup(String(id));
  }

  async function handleCommunication() {
    if (!process) return;
    try {
      const result = await backend.processes.communication(process.id);
      if (!result || typeof result.statusGeral !== "string") throw new Error("O servidor retornou dados incompletos para a comunicação.");
      setCommunication(result);
      setFeedback(null);
    } catch (cause) {
      setFeedback({ kind: "error", message: cause instanceof Error ? cause.message : "Não foi possível consultar a comunicação." });
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
      const errors = [response.email?.erro, response.whatsapp?.erro].filter(Boolean).join(" ");
      notify(errors || "Solicitação de envio processada. Confira o resultado de cada canal.", errors ? "error" : "info");
      setFeedback({ kind: "info", message: `Solicitação processada. Status do Back-End: ${readable(response.statusGeral)}. Isso não confirma a entrega.` });
    } catch (cause) {
      setFeedback({ kind: "error", message: cause instanceof Error ? cause.message : "Não foi possível solicitar o reenvio." });
    } finally {
      setResending(false);
    }
  }

  function updateAssignedProcess(updated: ProcessResponse) {
    if (process?.id === updated.id) setProcess(current => current ? { ...current, ...updated } : current);
    list.refresh();
  }

  return <AdminShell title="Contemplados" subtitle="Consulte e distribua processos contemplados pela equipe.">
    <section className="admin-page-heading"><div><h2>Processos contemplados</h2><p>Busque por contemplado, grupo, cota ou identificador. Os resultados são carregados do Back-End.</p></div></section>
    <form className="panel admin-search-form" onSubmit={applyFilters}>
      <label className="field"><span>Buscar nome, grupo, cota ou ID</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Ex.: Ana, grupo 12, cota 4" /></label>
      <label className="field"><span>Filtrar status</span><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Todos os status</option>{statuses.map(value => <option key={value} value={value}>{readable(value)}</option>)}</select></label>
      <button className="button primary" type="submit"><Search size={16} aria-hidden="true"/>Aplicar filtros</button>
    </form>
    <section className="panel data-panel">
      <div className="data-panel-heading"><div><h3>Lista de processos</h3><p>O responsável e o estado de cada processo são os valores atuais retornados pela API.</p></div></div>
      {list.loading ? <Skeleton rows={3}/> : list.error ? <ErrorState message={list.error} retry={list.refresh}/> : list.data?.items.length ? <>
        <div className="table-scroll"><table className="admin-table admin-table-cards" role="table">
          <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Processo</th><th role="columnheader" scope="col">Contemplado</th><th role="columnheader" scope="col">Grupo / cota</th><th role="columnheader" scope="col">Status</th><th role="columnheader" scope="col">Responsável</th><th role="columnheader" scope="col">Atualizado em</th><th role="columnheader" scope="col">Ações</th></tr></thead>
          <tbody role="rowgroup">{list.data.items.map(item => <tr role="row" key={item.id}>
            <td role="cell" data-label="Processo">#{item.id}</td>
            <td role="cell" data-label="Contemplado"><strong>{item.clienteNome || "Nome não informado"}</strong><br/><small>{item.clienteEmail || "E-mail não informado"}</small></td>
            <td role="cell" data-label="Grupo / cota">{item.grupoNumero || "—"} / {item.cotaNumero || "—"}</td>
            <td role="cell" data-label="Status"><StatusPill tone={item.status === "FINALIZADO" ? "green" : item.status === "CANCELADO" ? "red" : "amber"}>{readable(item.status)}</StatusPill></td>
            <td role="cell" data-label="Responsável">{isAdmin ? <AssignmentControl process={item} employees={employees} employeesLoading={employeesLoading} onAssigned={updateAssignedProcess}/> : employees.find(user => user.id === item.responsavelId)?.nome || (item.responsavelId ? `#${item.responsavelId}` : "Sem responsável")}</td>
            <td role="cell" data-label="Atualizado em">{formatDate(item.atualizadoEm)}</td>
            <td role="cell" data-label="Ações"><button className="button secondary compact" type="button" onClick={() => { setIdInput(String(item.id)); const next = new URLSearchParams(params); next.set("processo", String(item.id)); setParams(next, { replace: true }); }}>Consultar</button></td>
          </tr>)}</tbody>
        </table></div>
        <Pagination page={page} total={list.data.total} size={list.data.size || 20} onChange={nextPage => { const next = new URLSearchParams(params); if (nextPage > 1) next.set("page", String(nextPage)); else next.delete("page"); setParams(next); }}/>
      </> : <EmptyState title="Nenhum processo encontrado" description="Altere a busca ou os filtros. A lista é atualizada com os dados da API."/>}
    </section>
    {employeeError && <InlineFeedback kind="error" message={`Não foi possível carregar os responsáveis disponíveis: ${employeeError}`}/>}
    <form className="panel admin-search-form" onSubmit={lookupById}>
      <label className="field"><span>Consultar processo pelo ID</span><input aria-label="ID do processo" type="number" min="1" step="1" required value={idInput} onChange={event => setIdInput(event.target.value)} placeholder="Informe o ID do processo"/></label>
      <button className="button secondary" type="submit" disabled={loadingProcess}>{loadingProcess ? "Consultando…" : "Consultar"}</button>
    </form>
    {feedback && <InlineFeedback kind={feedback.kind} message={feedback.message}/>}
    {loadingProcess ? <Skeleton rows={2}/> : process && <>
      <section className="panel data-panel"><div className="data-panel-heading"><div><h3>Processo #{process.id}</h3><p>{process.clienteNome || "Contemplado sem nome"} · Grupo {process.grupoNumero || "—"} · Cota {process.cotaNumero || "—"}</p></div><StatusPill tone={process.status === "FINALIZADO" ? "green" : process.status === "CANCELADO" ? "red" : "amber"}>{readable(process.status)}</StatusPill></div>
        <p>Contemplação #{process.contemplacaoId} · Crédito {process.valorCredito != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(process.valorCredito) : "não informado"}</p>
        <div className="admin-row-actions"><button className="button secondary compact" type="button" onClick={() => void handleCommunication()}>Consultar comunicação</button><Link className="button secondary compact" to={`/admin/disparo-manual?processo=${process.id}`}><MessageCircle size={14}/>Disparo manual</Link><button className="button primary compact" type="button" disabled={resending} onClick={() => setConfirming(true)}>{resending ? "Solicitando…" : "Solicitar reenvio"}</button><Link className="button secondary compact" to={`/admin/baixas?processo=${process.id}`}>Conferir baixa</Link></div>
      </section>
      {communication && <section className="panel" aria-live="polite"><h3>Status geral: {readable(communication.statusGeral)}</h3><p>E-mail: {communication.email ? readable(communication.email.status) : "Não configurado"}{communication.email?.erro ? ` · ${communication.email.erro}` : ""}</p><p>WhatsApp: {communication.whatsapp ? readable(communication.whatsapp.status) : "Não configurado"}{communication.whatsapp?.erro ? ` · ${communication.whatsapp.erro}` : ""}</p></section>}
      <ProcessStatusEditor key={`${process.id}-${process.status}`} process={process} onChange={updated => { setProcess(updated); list.refresh(); }}/>
      <OperationHistory key={process.id} processId={process.id}/>
    </>}
    <ConfirmDialog open={confirming} title={`Enviar comunicação do processo #${process?.id}?`} description="A solicitação enviará novamente pelos canais disponíveis. Destinatários já contatados também podem receber outra mensagem." onCancel={() => setConfirming(false)} onConfirm={() => void handleResend()}/>
  </AdminShell>;
}
