import { useCallback, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, Pagination, Skeleton } from "../components/DataUi";
import OperationHistory from "../components/OperationHistory";
import ProcessPicker from "../components/ProcessPicker";
import { initialProcessId, loadProcesses } from "../components/process-directory";
import { useResource } from "../hooks/useResource";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiRequest, backend, processStatuses, type PageResponse, type ProcessResponse, type UserResponse } from "../services/backend";
import { formatDate, formatPhone, readable } from "../services/format";
import { type Context } from "../services/platform";

const loadMetrics = async (signal: AbortSignal) => {
  const [processes, closures, communication] = await Promise.all([
    apiRequest<PageResponse<ProcessResponse>>("/api/processos-contemplacao/pagina?size=1", { signal }),
    backend.operation.closures(0, "", "EM_PROCESSO_DE_BAIXA", signal),
    backend.integrations.queueSummary(signal),
  ]);
  return { processes: processes.total, closures: closures.total, pending: communication.pendentes, failed: communication.comFalha };
};

export function CompanyIndicators() {
  const result = useResource(loadMetrics);
  return <section className="saas-panel" aria-labelledby="company-operation-title">
    <h2 id="company-operation-title">Operação da empresa</h2>
    {result.loading ? <Skeleton /> : result.error ? <ErrorState message={result.error} retry={result.refresh} /> : result.data && <div className="saas-metrics">
      {[
        { title: "Contemplados", href: "/app/contemplados", value: result.data.processes },
        { title: "Baixas pendentes", href: "/app/baixas", value: result.data.closures },
        { title: "Comunicações pendentes", href: "/app/comunicacao", value: result.data.pending },
        { title: "Alertas de envio", href: "/app/comunicacao", value: result.data.failed },
      ].map(item => <article key={item.title}><Link to={item.href}>{item.title}</Link><strong>{item.value}</strong></article>)}
    </div>}
  </section>;
}

export function CompanyRecords() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => apiRequest<PageResponse<UserResponse>>(
    "/api/platform/operation/records?" + new URLSearchParams({ page: String(page - 1), q: query }), { signal },
  ), [page, query]);
  const resource = useResource(load);
  return <AdminShell title="Cadastros" subtitle="Registros de clientes vinculados à sua empresa">
    <section className="panel data-panel">
      <label className="field">Buscar nome ou e-mail<input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></label>
      {resource.loading ? <Skeleton /> : resource.error ? <ErrorState message={resource.error} retry={resource.refresh} /> : resource.data?.items.length ? <>
        <ul>{resource.data.items.map(person => <li key={person.id}><strong>{person.nome}</strong> · {person.email} · {person.ativo ? "Ativo" : "Inativo"}</li>)}</ul>
        <Pagination page={page} size={20} total={resource.data.total} onChange={setPage}/>
      </> : <EmptyState title="Nenhum cadastro disponível" description="Registros vinculados à sua empresa aparecem aqui."/>}
    </section>
  </AdminShell>;
}

export function CompanySpace({ context }: { context: Context }) {
  return <AdminShell title="Meu espaço" subtitle="Dados, acessos e preferências da sua empresa">
    <section className="panel data-panel"><h2>Dados da empresa</h2>
      <dl><dt>Empresa</dt><dd>{context.account?.nome}</dd><dt>Titular</dt><dd>{context.name} · {context.email}</dd>
        <dt>Cadastro</dt><dd>{formatDate(context.account?.createdAt)}</dd><dt>Plano</dt><dd>{context.subscription?.tier === "PRO" ? "Profissional" : "Teste gratuito"}</dd></dl>
      <div className="split-actions"><Link to="/app/perfil">Meu perfil</Link><Link to="/app/marca">Sua marca</Link><Link to="/app/assinatura">Assinatura</Link></div>
    </section>
  </AdminShell>;
}

const loadCompanyProcesses = (signal: AbortSignal) => loadProcesses(signal, true);

export function CompanyDispatch({ context }: { context: Context }) {
  const [params] = useSearchParams();
  const [selected, select] = useState(() => initialProcessId(params.get("processo")));
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failure, setFailure] = useState("");
  const [revision, setRevision] = useState(0);
  const request = useRef<{ signature: string; key: ReturnType<typeof crypto.randomUUID> } | null>(null);
  const inFlight = useRef(false);
  const directory = useResource(loadCompanyProcesses);
  const loadContact = useCallback((signal: AbortSignal) => selected
    ? apiRequest<{ telefone: string }>(`/api/integracoes/processos/${selected}/comunicacao/whatsapp`, { signal })
       .then(value => ({ ...value, processId: selected }))
    : Promise.resolve(null), [selected]);
  const contact = useResource(loadContact);
  const phone = contact.data?.processId === selected ? contact.data?.telefone || "" : "";

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !phone || !sender || !message.trim() || working) return;
    setFeedback(""); setFailure(""); setConfirm(true);
  }

  async function send() {
    if (!selected || !phone || !sender || !message.trim() || inFlight.current) return;
    const text = message.trim();
    const signature = JSON.stringify([selected, sender, phone, text]);
    if (!request.current || request.current.signature !== signature) request.current = { signature, key: crypto.randomUUID() };
    inFlight.current = true; setWorking(true); setFailure("");
    try {
      await backend.processes.sendWhatsApp(selected, phone, text, Number(sender), request.current.key);
      request.current = null;
      setFeedback("Mensagem colocada na fila. Confira a situação no histórico.");
      setRevision(value => value + 1); setConfirm(false); setMessage("");
    } catch (error) { setFailure(error instanceof Error ? error.message : "Não foi possível confirmar a solicitação."); }
    finally { inFlight.current = false; setWorking(false); }
  }

  return <AdminShell title="Disparo manual" subtitle="Envie pelo WhatsApp da empresa para o contato registrado no processo">
    <ProcessPicker directory={directory} selectedId={selected} mode="open" disabled={working}
      onSelect={item => { select(item.processoId); setFeedback(""); }}/>
    {selected && <section className="panel data-panel">
      <h2>Mensagem do processo #{selected}</h2>
      {contact.loading && <p role="status">Carregando contato autorizado…</p>}
      {contact.error && <ErrorState message={contact.error} retry={contact.refresh}/>}
      {!contact.loading && !contact.error && !phone && <p>O processo ainda não tem um WhatsApp registrado.</p>}
      {!context.active && <p>O envio exige uma conta ativa.</p>}
      {!context.instances.length && <p>Cadastre um WhatsApp em <Link to="/app/canais">Canais internos</Link>.</p>}
      <form className="saas-form" onSubmit={prepare}>
        <label>Remetente<select required value={sender} onChange={e => setSender(e.target.value)}>
          <option value="">Selecione um WhatsApp</option>
          {context.instances.map(instance => <option key={instance.id} value={instance.id}>{instance.name}</option>)}
        </select></label>
        <label>Destinatário<input readOnly value={formatPhone(phone)}/></label>
        <label>Mensagem<textarea required maxLength={4000} value={message} onChange={e => setMessage(e.target.value)}/></label>
        <button className="button primary" disabled={!context.active || !phone || contact.loading || !sender || !message.trim() || working}>Revisar envio</button>
      </form>
      {feedback && <p role="status">{feedback}</p>}
    </section>}
    {selected && !contact.error && <OperationHistory key={`${selected}:${revision}`} processId={selected}/>}
    <ConfirmDialog open={confirm} title="Colocar mensagem na fila?" description="O status do envio será exibido no histórico do processo."
      confirmLabel="Solicitar envio" busy={working} error={failure} onConfirm={() => void send()} onCancel={() => setConfirm(false)}/>
  </AdminShell>;
}

export function CompanyProcesses() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const q = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => apiRequest<PageResponse<ProcessResponse>>(
    "/api/processos-contemplacao/pagina?" + new URLSearchParams({ page: String(page - 1), q, ...(stage ? { status: stage } : {}) }), { signal },
  ), [page, q, stage]);
  const processes = useResource(load);
  return <section className="panel data-panel">
    <h2>Processos da empresa</h2>
    <div className="admin-audit-filters">
      <label className="field">Buscar por número, origem ou código externo<input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }}/></label>
      <label className="field">Filtrar etapa<select value={stage} onChange={event => { setStage(event.target.value); setPage(1); }}>
        <option value="">Todas as etapas</option>
        {processStatuses.map(value => <option key={value} value={value}>{readable(value)}</option>)}
      </select></label>
    </div>
    {processes.loading ? <Skeleton /> : processes.error ? <ErrorState message={processes.error} retry={processes.refresh}/> : processes.data?.items.length ? <>
      <ul>{processes.data.items.map(process => <li key={process.id}>
        <Link to={`/app/contemplados?processo=${process.id}`}>Processo #{process.id}</Link> · {readable(process.status)} · {formatDate(process.criadoEm)}
      </li>)}</ul>
      <Pagination page={page} size={20} total={processes.data.total} onChange={setPage}/>
    </> : <EmptyState title="Nenhum processo encontrado" description="Ajuste a busca ou aguarde uma contemplação vinculada à empresa."/>}
  </section>;
}
