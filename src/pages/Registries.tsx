import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Trash2, ToggleLeft } from "lucide-react";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorState } from "../components/DataUi";
import { InlineFeedback } from "../components/IntegrationUi";
import { apiRequest, backend, type PageResponse } from "../services/backend";
import { ApiError } from "../services/http";
import { getUserType } from "../services/auth";
import { useResource } from "../hooks/useResource";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { notify } from "../services/notifications";

type Resource = "usuarios" | "consorcios" | "grupos" | "cotas" | "tipos-consorcio";
type Row = { id: number; [key: string]: string | number | boolean | null };
type Field = { key: string; label: string; type?: string; optional?: boolean; relation?: Resource; options?: string[] };
const fields: Record<Resource, Field[]> = {
  usuarios: [{ key: "nome", label: "Nome" }, { key: "email", label: "E-mail", type: "email" }, { key: "tipo", label: "Perfil", options: ["CLIENTE", "FUNCIONARIO", "ADMINISTRADOR"] }, { key: "ativo", label: "Ativo", type: "checkbox" }],
  consorcios: [{ key: "nome", label: "Nome" }, { key: "tipoId", label: "Tipo de consorcio", relation: "tipos-consorcio" }],
  grupos: [{ key: "numero", label: "Número" }, { key: "consorcioId", label: "Consorcio", relation: "consorcios" }, { key: "quantidadeCotas", label: "Quantidade de cotas", type: "number", optional: true }, { key: "valorParcela", label: "Valor da parcela", type: "number", optional: true }],
  cotas: [{ key: "numero", label: "Número" }, { key: "grupoId", label: "Grupo", relation: "grupos" }, { key: "valorCredito", label: "Valor do crédito", type: "number" }],
  "tipos-consorcio": [{ key: "nome", label: "Nome" }],
};
const titles: Record<Resource, string> = { usuarios: "Usuários", consorcios: "Consórcios", grupos: "Grupos", cotas: "Cotas", "tipos-consorcio": "Tipos de consorcio" };

/** Resources that support activate/deactivate status. */
const statusResources = new Set<Resource>(["usuarios", "consorcios", "cotas"]);

/** Returns the status field name for a resource (cotas uses 'ativa', others 'ativo'). */
function statusKey(resource: Resource): string {
  return resource === "cotas" ? "ativa" : "ativo";
}

/** Returns the singular friendly label of a resource. */
function singularLabel(resource: Resource): string {
  const labels: Record<Resource, string> = {
    usuarios: "usuário",
    consorcios: "consórcio",
    grupos: "grupo",
    cotas: "cota",
    "tipos-consorcio": "tipo de consórcio",
  };
  return labels[resource] || "registro";
}

/** Formats friendly error messages, especially for HTTP 400, 409 (dependencies) and 500. */
function friendlyError(error: unknown, operation: "delete" | "toggle", resource: Resource): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      const detail = error.message || "";
      const isDefaultMessage = !detail || detail === "Operacao em conflito: confira valores duplicados ou registros vinculados.";
      if (!isDefaultMessage) return detail;

      if (resource === "consorcios") {
        return "Não foi possível excluir este consórcio porque existem grupos vinculados. Remova os vínculos antes de tentar novamente.";
      }
      if (resource === "cotas") {
        return "Não foi possível excluir esta cota porque existem registros ou participações vinculadas. Remova os vínculos antes de tentar novamente.";
      }
      if (resource === "usuarios") {
        return "Não foi possível excluir este usuário porque existem processos ou registros vinculados. Desative o usuário em vez de excluí-lo.";
      }
      const label = singularLabel(resource);
      return `Não foi possível concluir a operação de ${operation === "delete" ? "exclusão" : "alteração de status"} deste ${label} devido a conflitos ou vínculos existentes.`;
    }
    if (error.status === 400) {
      return error.message || "Requisição inválida. Confira os dados informados e tente novamente.";
    }
    if (error.status === 500) {
      return "O servidor encontrou um problema interno. Tente novamente em instantes.";
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado ao processar a operação.";
}

function RelationPicker({ resource, value, onChange }: { resource: Resource; value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const load = useCallback((signal: AbortSignal) => apiRequest<PageResponse<Row>>(`/api/${resource}/pagina?size=20&q=${encodeURIComponent(term)}`, { signal }), [resource, term]);
  const { data, loading, error } = useResource(load);
  return <div>
    <input aria-label={`Buscar ${titles[resource]}`} placeholder="Buscar para selecionar" value={search} onChange={e => setSearch(e.target.value)} />
    <select required aria-label={`Selecionar ${titles[resource]}`} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{loading ? "Carregando..." : "Selecione"}</option>
      {value && !data?.items.some(row => String(row.id) === value) && <option value={value}>Registro #{value}</option>}
      {data?.items.map(row => <option key={row.id} value={row.id}>{String(row.nome || row.numero)} (#{row.id})</option>)}
    </select>
    {error && <small role="alert">{error}</small>}
  </div>;
}

export default function Registries({ initial = "consorcios", clientsOnly = false, locked = false }: { initial?: Resource; clientsOnly?: boolean; locked?: boolean }) {
  const [resource, setResource] = useState<Resource>(initial);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<Record<string, string | boolean> | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [toggling, setToggling] = useState<Row | null>(null);
  const [passwordId, setPasswordId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const admin = getUserType() === "ADMINISTRADOR";
  const url = `/api/${resource}`;
  const listUrl = clientsOnly ? "/api/clientes" : url;
  const load = useCallback((signal: AbortSignal) => apiRequest<PageResponse<Row>>(`${listUrl}/pagina?${new URLSearchParams({ page: String(page - 1), size: "20", q: term })}`, { signal }), [listUrl, page, term, revision]);
  const { data, loading, error, refresh } = useResource(load);
  useEffect(() => { if (data && page > 1 && !data.items.length) setPage(Math.max(1, Math.ceil(data.total / 20))); }, [data, page]);

  function reset() {
    setDraft(null);
    setEditing(null);
    setDetail(null);
    setDeleting(null);
    setToggling(null);
    setPasswordId(null);
    setPassword("");
  }

  function create() {
    reset(); setFeedback("");
    setDraft(Object.fromEntries(fields[resource].map(field => [field.key, field.type === "checkbox" ? true : field.key === "tipo" ? "CLIENTE" : ""])));
  }

  async function inspect(id: number, edit: boolean) {
    setBusy(true); setFeedback("");
    try {
      const row = await apiRequest<Row>(`${url}/${id}`);
      reset();
      if (edit) { setEditing(id); setDraft(Object.fromEntries(fields[resource].map(field => [field.key, field.type === "checkbox" ? Boolean(row[field.key]) : String(row[field.key] ?? "")]))); }
      else setDetail(row);
    } catch (e) { setFeedback(e instanceof Error ? e.message : "Falha na consulta."); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); if (!draft || busy) return;
    setBusy(true); setFeedback("");
    try {
      const body: Record<string, unknown> = {};
      for (const field of fields[resource]) {
        if (resource === "usuarios" && field.key === "ativo" && editing === null) continue;
        const value = draft[field.key];
        body[field.key] = field.type === "number" || field.relation ? (value === "" ? null : Number(value)) : value;
      }
      if (resource === "usuarios" && editing === null) body.senha = draft.senha;
      if (clientsOnly) body.tipo = "CLIENTE";
      await apiRequest(`${url}${editing === null ? "" : `/${editing}`}`, { method: editing === null ? "POST" : "PUT", body: JSON.stringify(body) });
      reset(); setFeedback("Cadastro salvo."); setRevision(v => v + 1);
    } catch (e) { setFeedback(e instanceof Error ? e.message : "Falha ao salvar."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    setFeedback("");
    try {
      await apiRequest(`${url}/${deleting.id}`, { method: "DELETE" });
      const label = singularLabel(resource);
      const isFeminine = resource === "cotas";
      const identifier = String(deleting.nome || deleting.numero || deleting.email || `#${deleting.id}`);
      reset();
      setRevision(v => v + 1);
      notify(`${label.charAt(0).toUpperCase() + label.slice(1)} "${identifier}" ${isFeminine ? "excluída" : "excluído"} com sucesso.`, "success");
    } catch (e) {
      const msg = friendlyError(e, "delete", resource);
      setDeleting(null);
      setFeedback(msg);
      notify(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    if (!toggling || busy) return;
    const key = statusKey(resource);
    const currentStatus = Boolean(toggling[key]);
    const newStatus = !currentStatus;
    setBusy(true);
    setFeedback("");
    try {
      if (resource === "usuarios") {
        await backend.users.toggleStatus(toggling.id, newStatus, {
          nome: toggling.nome,
          email: toggling.email,
          tipo: toggling.tipo,
        });
      } else if (resource === "consorcios") {
        await backend.consortiums.toggleStatus(toggling.id, newStatus, {
          nome: toggling.nome,
          tipoId: toggling.tipoId,
        });
      } else if (resource === "cotas") {
        await backend.quotas.toggleStatus(toggling.id, newStatus, {
          numero: toggling.numero,
          grupoId: toggling.grupoId,
          valorCredito: toggling.valorCredito,
        });
      }
      const label = singularLabel(resource);
      const isFeminine = resource === "cotas";
      const actionLabel = newStatus
        ? (isFeminine ? "ativada" : "ativado")
        : (isFeminine ? "desativada" : "desativado");
      const identifier = String(toggling.nome || toggling.numero || toggling.email || `#${toggling.id}`);
      reset();
      setRevision(v => v + 1);
      notify(`${label.charAt(0).toUpperCase() + label.slice(1)} "${identifier}" ${actionLabel} com sucesso.`, "success");
    } catch (e) {
      const msg = friendlyError(e, "toggle", resource);
      setToggling(null);
      setFeedback(msg);
      notify(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); if (passwordId === null || busy) return; setBusy(true); setFeedback("");
    try { await backend.users.changePassword(passwordId, password); reset(); setFeedback("Senha alterada. As sessões anteriores foram invalidadas."); }
    catch (e) { setFeedback(e instanceof Error ? e.message : "Falha na troca de senha."); }
    finally { setBusy(false); }
  }

  const hasStatus = statusResources.has(resource);

  function toggleDescription(row: Row): string {
    const key = statusKey(resource);
    const active = Boolean(row[key]);
    const label = singularLabel(resource);
    const isFeminine = resource === "cotas";
    if (active) {
      return `Ao desativar este ${label}, ${isFeminine ? "ela" : "ele"} deixará de ficar disponível para novas operações e processos no sistema. Você poderá reativá-${isFeminine ? "la" : "lo"} a qualquer momento.`;
    }
    return `Ao ativar este ${label}, ${isFeminine ? "ela" : "ele"} voltará a ficar disponível para novas operações e processos no sistema.`;
  }

  const title = clientsOnly ? "Clientes" : titles[resource];
  const tableFields = fields[resource].filter(field => !(hasStatus && (field.key === "ativo" || field.key === "ativa")));
  return <AdminShell title={title} subtitle="Consulta e manutenção dos cadastros">
    {!locked && <nav className="list-toolbar" aria-label="Cadastros">{(Object.keys(titles) as Resource[]).filter(key => admin || key !== "usuarios").map(key => <button key={key} className={`button ${resource === key ? "primary" : "secondary"}`} disabled={busy} onClick={() => { setResource(key); setPage(1); setSearch(""); reset(); setFeedback(""); }}>{titles[key]}</button>)}</nav>}
    <section className="panel data-panel">
      <div className="data-panel-heading"><h2>{title}</h2><div className="form-actions">
        <button className="button secondary" disabled={loading || busy} onClick={refresh}>Atualizar</button>
        {admin && <button className="button primary" disabled={busy} onClick={create}>Novo cadastro</button>}
      </div></div>
      <label className="field"><span>Buscar por nome, e-mail ou numero</span><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label>
      {error && <ErrorState message={error} retry={refresh} />}
      {feedback && <InlineFeedback message={feedback} />}
      {loading ? <p role="status">Carregando...</p> : <>
        <p>{data?.total || 0} registros encontrados</p>
        <div className="table-scroll"><table className="admin-table"><thead><tr><th>ID</th>{tableFields.map(field => <th key={field.key}>{field.label}</th>)}{hasStatus && <th>Status</th>}<th>Ações</th></tr></thead>
          <tbody>{data?.items.map(row => <tr key={row.id}><td>{row.id}</td>{tableFields.map(field => <td key={field.key}>{typeof row[field.key] === "boolean" ? row[field.key] ? "Sim" : "Nao" : field.key.startsWith('valor') ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(row[field.key]||0)) : String(row[field.key.replace('Id','Nome')] || row[field.key.replace('Id','Número')] || row[field.key] || "—")}</td>)}{hasStatus && <td><span className={`status-pill ${Boolean(row[statusKey(resource)]) ? "status-green" : "status-red"}`}>{Boolean(row[statusKey(resource)]) ? "Ativo" : "Inativo"}</span></td>}<td><div className="form-actions">
            {admin && <><button className="button secondary compact" disabled={busy} onClick={() => void inspect(row.id, false)}>Consultar</button><button className="button secondary compact" disabled={busy} onClick={() => void inspect(row.id, true)}>Editar</button>{hasStatus && <button className="button secondary compact" disabled={busy} onClick={() => { reset(); setToggling(row); }}>{Boolean(row[statusKey(resource)]) ? "Desativar" : "Ativar"}</button>}<button className="button danger compact" disabled={busy} onClick={() => { reset(); setDeleting(row); }}>Excluir</button></>}
            {admin && resource === "usuarios" && <button className="button secondary compact" disabled={busy} onClick={() => { reset(); setPasswordId(row.id); }}>Trocar senha</button>}
          </div></td></tr>)}</tbody></table></div>
        {!data?.items.length && <p>Nenhum registro encontrado.</p>}
        <div className="form-actions"><button className="button secondary" disabled={page <= 1 || busy} onClick={() => setPage(v => v - 1)}>Anterior</button><span>Página {page} de {Math.max(1, Math.ceil((data?.total || 0) / 20))}</span><button className="button secondary" disabled={page * 20 >= (data?.total || 0) || busy} onClick={() => setPage(v => v + 1)}>Próxima</button></div>
      </>}
    </section>
    {detail && <section className="panel"><h3>Registro #{detail.id}</h3><dl>{Object.entries(detail).map(([key, value]) => <div key={key}><dt>{fields[resource].find(f => f.key === key)?.label || key}</dt><dd>{String(value ?? "-")}</dd></div>)}</dl><button className="button secondary" onClick={reset}>Fechar</button></section>}
    {draft && <form className="panel admin-form" onSubmit={save}><h3>{editing === null ? "Novo cadastro" : `Editar #${editing}`}</h3><div className="admin-form-grid">
      {fields[resource].filter(field => !(clientsOnly && field.key === "tipo") && !(resource === "usuarios" && field.key === "ativo" && editing === null)).map(field => <label className="field" key={field.key}><span>{field.label}{field.optional ? " (opcional)" : ""}</span>
        {field.relation ? <RelationPicker resource={field.relation} value={String(draft[field.key] || "")} onChange={value => setDraft({ ...draft, [field.key]: value })} /> : field.options ? <select value={String(draft[field.key])} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })}>{field.options.map(option => <option key={option}>{option}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(draft[field.key])} onChange={e => setDraft({ ...draft, [field.key]: e.target.checked })} /> : <input type={field.type || "text"} required={!field.optional} maxLength={255} min={field.type === "number" ? (field.key === "quantidadeCotas" ? "1" : "0.01") : undefined} step={field.key === "quantidadeCotas" ? "1" : field.type === "number" ? "0.01" : undefined} value={String(draft[field.key] ?? "")} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })} />}
      </label>)}
      {resource === "usuarios" && editing === null && <label className="field"><span>Senha inicial</span><input type="password" autoComplete="new-password" required minLength={6} maxLength={72} value={String(draft.senha || "")} onChange={e => setDraft({ ...draft, senha: e.target.value })} /></label>}
    </div><div className="form-actions"><button className="button primary" disabled={busy}>Salvar</button><button className="button secondary" type="button" disabled={busy} onClick={reset}>Cancelar</button></div></form>}
    <ConfirmDialog open={!!deleting} title={`Excluir ${singularLabel(resource)} #${deleting?.id}?`} description={`A exclusão remove permanentemente este ${singularLabel(resource)}. Registros que possuam vínculos ativos no sistema não poderão ser excluídos.`} confirmLabel="Confirmar exclusão" onCancel={() => { if (!busy) setDeleting(null); }} onConfirm={() => void remove()} busy={busy} icon={Trash2} danger />
    <ConfirmDialog open={!!toggling} title={`${Boolean(toggling?.[statusKey(resource)]) ? "Desativar" : "Ativar"} ${singularLabel(resource)} #${toggling?.id}?`} description={toggling ? toggleDescription(toggling) : ""} confirmLabel={toggling ? (Boolean(toggling[statusKey(resource)]) ? "Confirmar desativação" : "Confirmar ativação") : ""} onCancel={() => { if (!busy) setToggling(null); }} onConfirm={() => void toggleStatus()} busy={busy} icon={ToggleLeft} />
    {passwordId !== null && <form className="panel admin-form" onSubmit={changePassword}><h3>Trocar senha do usuario #{passwordId}</h3><label className="field"><span>Nova senha</span><input required type="password" autoComplete="new-password" minLength={6} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label><p>O usuario precisara entrar novamente.</p><div className="form-actions"><button className="button primary" disabled={busy}>Alterar senha</button><button type="button" className="button secondary" disabled={busy} onClick={reset}>Cancelar</button></div></form>}
  </AdminShell>;
}
