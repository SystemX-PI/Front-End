import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState, ErrorState, Pagination, Skeleton } from "../components/DataUi";
import { useResource } from "../hooks/useResource";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { apiRequest, type PageResponse } from "../services/backend";
import { formatDate, readable } from "../services/format";
import { platformRequest, type Client, type SubscriptionInfo } from "../services/platform";
import Audit from "./Audit";

type Summary = { total: number; active: number; subscribed: number; pending: number; instances: number; mailboxes: number; members: number };
type Settings = { api: string; database: boolean; evolution: string; stripeConfigured: boolean; simulationEnabled: boolean };
type Event = { type: string; processedAt: string };
type Details = {
  id: number; name: string; email: string | null; createdAt: string; trialEndsAt: string; paidUntil: string | null;
  active: boolean; suspended: boolean; subscription: SubscriptionInfo;
  members: { id: number; name: string; email: string; role: string; active: boolean }[];
  simulationOrders: { paymentMethod: string; status: string; amountCents: number; createdAt: string }[];
};
const getSettings = (signal: AbortSignal) => apiRequest<Settings>("/api/platform/clients/settings", { signal });
const getSummary = (signal: AbortSignal) => apiRequest<Summary>("/api/platform/clients/summary", { signal });
const getEvents = (signal: AbortSignal) => apiRequest<Event[]>("/api/platform/clients/billing-events", { signal });
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Result<T>({ resource, children }: { resource: ReturnType<typeof useResource<T>>; children: (data: T) => ReactNode }) {
  if (resource.loading) return <Skeleton />;
  if (resource.error) return <ErrorState message={resource.error} retry={resource.refresh} />;
  return resource.data == null ? null : children(resource.data);
}

export function PlatformOverview() {
  const summary = useResource(getSummary);
  return <AdminShell title="Visão geral" subtitle="Acompanhe as empresas e a utilização da plataforma.">
    <Result resource={summary}>{data => <>
      <div className="saas-metrics">
        {[
          ["Empresas clientes", data.total], ["Ativas", data.active], ["Inativas", data.total - data.active],
          ["Assinaturas ativas", data.subscribed], ["Cobranças a acompanhar", data.pending],
          ["WhatsApps cadastrados", data.instances], ["Gmails cadastrados", data.mailboxes], ["Membros de equipes", data.members],
        ].map(([label, value]) => <article key={label}><small>{label}</small><strong>{Number(value).toLocaleString("pt-BR")}</strong></article>)}
      </div>
      <section className="panel data-panel">
        <h2>Alertas da plataforma</h2>
        <p>{data.pending ? `${data.pending} empresas com cobrança a acompanhar.` : "Nenhum checkout ou cobrança pendente identificado."}</p>
        <p>{data.total - data.active} empresas sem acesso ativo.</p>
        <div className="split-actions"><Link to="/admin/assinaturas">Ver assinaturas</Link><Link to="/admin/configuracoes">Ver saúde das integrações</Link></div>
      </section>
    </>}</Result>
  </AdminShell>;
}

const directoryCopy = {
  companies: { title: "Empresas clientes", description: "Consulte, cadastre e acompanhe as contas da plataforma." },
  billing: { title: "Planos e assinaturas", description: "Consulte o estado das assinaturas e os eventos recebidos." },
  support: { title: "Suporte", description: "Consulte o contexto da empresa e dos acessos para atendimento." },
};

function accountStatus(client: Client) {
  if (client.suspended) return "Suspensa";
  if (client.professional && client.paidUntil && Date.parse(client.paidUntil) > Date.now()) return "Assinatura ativa";
  return Date.parse(client.trialEndsAt) > Date.now() ? "Em teste" : "Sem acesso ativo";
}

export function PlatformCompanies({ mode = "companies" }: { mode?: keyof typeof directoryCopy }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const query = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => apiRequest<PageResponse<Client>>(
    "/api/platform/clients/page?" + new URLSearchParams({ page: String(page - 1), q: query }), { signal },
  ), [page, query]);
  const companies = useResource(load);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setError(""); setMessage("");
    try {
      await platformRequest("/clients", null, "POST", Object.fromEntries(new FormData(form)));
      setCreateOpen(false); setSearch(""); setPage(1); companies.refresh();
      setMessage("Empresa cadastrada com o período inicial de teste.");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const { title, description } = directoryCopy[mode];
  return <AdminShell title={title} subtitle={description}>
    <section className="panel data-panel">
      <div className="data-panel-heading">
        <label className="field">Buscar empresa ou e-mail<input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/></label>
        {mode === "companies" && <button type="button" className="button primary" onClick={() => setCreateOpen(!createOpen)} aria-expanded={createOpen}>Nova empresa</button>}
      </div>
      {message && <p role="status">{message}</p>}
      {createOpen && <form className="saas-form" onSubmit={create}>
        <label>Nome da empresa<input name="name" required maxLength={120}/></label>
        <label>E-mail do titular<input name="email" type="email" required maxLength={255}/></label>
        <label>Senha inicial<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label>
        {error && <p role="alert">{error}</p>}
        <button className="button primary" disabled={busy}>{busy ? "Cadastrando…" : "Cadastrar empresa"}</button>
      </form>}
      <Result resource={companies}>{({ items, total }) => items.length ? <>
        <div className="client-grid">{items.map(client => <article className="client-card" key={client.id}>
          <h3>{client.nome}</h3><p>{client.email || "Titular sem e-mail cadastrado"}</p>
          <p><strong>{accountStatus(client)}</strong>{mode === "billing" && client.billingStatus ? ` · ${readable(client.billingStatus)}` : ""}</p>
          <small>{client.users} membros · {client.instances} WhatsApp · {client.gmails} Gmail</small>
          <Link to={`/admin/${mode === "support" ? "suporte" : "empresas"}/${client.id}`}>Ver detalhes de {client.nome}</Link>
        </article>)}</div>
        <Pagination page={page} size={20} total={total} onChange={setPage}/>
      </> : <EmptyState title="Nenhuma empresa encontrada" description="Confira a busca ou cadastre uma nova empresa."/>}</Result>
    </section>
    {mode === "billing" && <BillingEvents/>}
  </AdminShell>;
}

function BillingEvents() {
  const events = useResource(getEvents);
  return <section className="panel data-panel"><h2>Eventos recentes do Stripe</h2>
    <Result resource={events}>{items => items.length ? <ul>{items.map((event, i) => <li key={`${event.type}-${event.processedAt}-${i}`}><strong>{event.type}</strong> · {formatDate(event.processedAt)}</li>)}</ul> :
      <EmptyState title="Nenhum evento recebido" description="Os registros disponíveis são exibidos após o processamento dos webhooks."/>}</Result>
  </section>;
}

export function PlatformCompany({ support = false }: { support?: boolean }) {
  const { id } = useParams();
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback((signal: AbortSignal) => apiRequest<Details>(`/api/platform/clients/${encodeURIComponent(id || "")}`, { signal }), [id]);
  const company = useResource(load);
  async function toggle(data: Details) {
    setPending(true); setError("");
    try {
      await platformRequest(`/clients/${data.id}/active`, null, "PUT", { active: data.suspended });
      setConfirm(false); company.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setPending(false); }
  }

  return <AdminShell title={company.data?.name || "Detalhes da empresa"} subtitle={support ? "Consulta de suporte" : "Cadastro, acessos e assinatura"}>
    <Link to={support ? "/admin/suporte" : "/admin/empresas"}>Voltar à lista de empresas</Link>
    <Result resource={company}>{data => <>
      <section className="panel data-panel"><h2>Conta</h2><dl>
        <dt>Titular</dt><dd>{data.email || "Não informado"}</dd>
        <dt>Data de cadastro</dt><dd>{formatDate(data.createdAt)}</dd>
        <dt>Situação</dt><dd>{data.suspended ? "Suspensa" : data.active ? "Ativa" : "Inativa"}</dd>
        <dt>Plano</dt><dd>{data.subscription.tier === "PRO" ? "Profissional" : "Teste gratuito"}</dd>
        <dt>Vigência</dt><dd>{formatDate(data.paidUntil || data.trialEndsAt)}</dd>
        <dt>Cobrança</dt><dd>{data.subscription.billingStatus ? readable(data.subscription.billingStatus) : "Sem situação registrada"}</dd>
      </dl>
      {!support && <button className="button secondary" onClick={() => { setError(""); setConfirm(true); }}>{data.suspended ? "Reativar conta" : "Suspender conta"}</button>}</section>
      <section className="panel data-panel"><h2>Usuários associados</h2>
        {data.members.length ? <ul>{data.members.map(member => <li key={member.id}><strong>{member.name}</strong> · {member.email} · {readable(member.role)} · {member.active ? "Ativo" : "Desativado"}</li>)}</ul> : <p>Nenhum usuário associado.</p>}
      </section>
      {!support && <>
        <section className="panel data-panel"><h2>Pedidos de pagamento simulados</h2>
          {data.simulationOrders.length ? <ul>{data.simulationOrders.map((order, i) => <li key={`${order.createdAt}-${i}`}>{formatDate(order.createdAt)} · {order.paymentMethod} · {currency.format(order.amountCents / 100)} · {readable(order.status)}</li>)}</ul> : <p>Nenhum pedido simulado registrado.</p>}
          <Link to="/admin/assinaturas">Consultar eventos da plataforma</Link>
        </section>
        <Audit companyId={data.id} embedded />
      </>}
      <ConfirmDialog
        open={confirm}
        title={data.suspended ? "Reativar conta?" : "Suspender conta?"}
        description="Esta alteração afeta o acesso aos recursos da empresa e fica registrada na auditoria."
        confirmLabel={data.suspended ? "Reativar conta" : "Suspender conta"}
        busy={pending}
        error={error}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void toggle(data)}
      />
    </>}</Result>
  </AdminShell>;
}

export function PlatformSettings() {
  const status = useResource(getSettings);
  const evolutionStatus: Record<string, string> = { AVAILABLE: "Disponível", UNAVAILABLE: "Indisponível", UNCONFIGURED: "Sem configuração" };
  return <AdminShell title="Configurações" subtitle="Saúde dos serviços e configuração das integrações.">
    <section className="panel data-panel"><h2>Serviços</h2>
      <Result resource={status}>{data => <dl>
        <dt>API do SystemX</dt><dd>Disponível</dd>
        <dt>MySQL</dt><dd>{data.database ? "Disponível" : "Indisponível"}</dd>
        <dt>Evolution API</dt><dd>{evolutionStatus[data.evolution] || "Estado desconhecido"}</dd>
        <dt>Stripe</dt><dd>{data.stripeConfigured ? "Configurado" : "Sem configuração"}</dd>
        <dt>Pagamento simulado</dt><dd>{data.simulationEnabled ? "Habilitado" : "Desabilitado"}</dd>
      </dl>}</Result>
      <button className="button secondary" onClick={status.refresh} disabled={status.loading}>Atualizar serviços</button>
      <Link to="/admin/canais">Configurar canais da operação interna</Link>
    </section>
  </AdminShell>;
}
