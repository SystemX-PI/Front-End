import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { platformRequest, type Context } from "../services/platform";
import { useResource } from "../hooks/useResource";
import { ErrorState, Skeleton } from "../components/DataUi";
import ConfirmDialog from "../components/ConfirmDialog";
import "./team-groups.css";

type Group = { id: number; nome: string; usuarios: number[]; permiteDisparo: boolean };
type Draft = Omit<Group, "id"> & { id?: number };

export default function TeamGroups({ context, accountId }: { context: Context; accountId: string | null }) {
  const load = useCallback(() => platformRequest<Group[]>("/team-groups", accountId), [accountId]);
  const groups = useResource(load);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [remove, setRemove] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const editing = draft !== null;
  const manager = ["CLIENTE", "ADMINISTRADOR"].includes(context.role);

  useEffect(() => {
    if (!editing) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [editing]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft || busy || !draft.nome.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await platformRequest(draft.id ? `/team-groups/${draft.id}` : "/team-groups",
        accountId, draft.id ? "PUT" : "POST", { nome: draft.nome.trim(), usuarios: draft.usuarios, permiteDisparo: draft.permiteDisparo });
      setDraft(null);
      setMessage("Grupo salvo.");
      groups.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup() {
    if (!remove || busy) return;
    const id = remove.id;
    setRemove(null);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await platformRequest(`/team-groups/${id}`, accountId, "DELETE");
      setMessage("Grupo excluído.");
      groups.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="saas-panel" aria-labelledby="team-groups-title">
    <div className="saas-panel-heading">
      <h2 id="team-groups-title">Grupos da equipe</h2>
      {manager && <button className="saas-button" type="button" disabled={busy || groups.loading}
        onClick={() => { setError(""); setDraft({ nome: "", usuarios: [], permiteDisparo: false }); }}>
        <Plus size={17} /> Criar grupo
      </button>}
    </div>
    {message && <p role="status">{message}</p>}
    {!draft && error && <p className="saas-error" role="alert">{error}</p>}
    {groups.loading ? <Skeleton rows={2} /> : groups.error ? <ErrorState message={groups.error} retry={groups.refresh} /> :
      groups.data?.length ? <div className="resource-list">{groups.data.map(group => {
        const members = context.users.filter(user => group.usuarios.includes(user.id));
        return <article key={group.id}>
          <div><strong>{group.nome}</strong><small>{members.length ? members.map(user => user.name).join(", ") : "Sem membros"}</small></div>
          {manager && <div className="team-group-actions">
            <button className="saas-button" type="button" disabled={busy} aria-label={`Editar ${group.nome}`}
              onClick={() => { setError(""); setDraft(group); }}>Editar</button>
            <button className="saas-button danger" type="button" disabled={busy} aria-label={`Excluir ${group.nome}`}
              onClick={() => { setError(""); setRemove(group); }}>Excluir</button>
          </div>}
        </article>;
      })}</div> : <p className="saas-muted">Nenhum grupo criado.</p>}
    <dialog ref={dialog} className="team-modal saas-panel" aria-labelledby="team-group-form-title"
      onCancel={event => { event.preventDefault(); if (!busy) setDraft(null); }}>
      {draft && <form className="saas-form" onSubmit={save}>
        <h2 id="team-group-form-title">{draft.id ? "Editar grupo" : "Criar grupo"}</h2>
        <label>Nome do grupo<input autoFocus required maxLength={100} value={draft.nome} disabled={busy}
          onChange={event => setDraft({ ...draft, nome: event.target.value })} /></label>
        <label><input type="checkbox" checked={draft.permiteDisparo} disabled={busy} onChange={event => setDraft({ ...draft, permiteDisparo: event.target.checked })}/> Permitir enviar mensagens</label>
        <fieldset className="team-group-members" disabled={busy}>
          <legend>Membros</legend>
          {context.users.length ? context.users.map(user => <label key={user.id}>
            <input type="checkbox" checked={draft.usuarios.includes(user.id)} onChange={event => setDraft({
              ...draft, usuarios: event.target.checked ? [...draft.usuarios, user.id] : draft.usuarios.filter(id => id !== user.id),
            })} />
            <span>{user.name}<small>{user.email}</small></span>
          </label>) : <p>Adicione usuários à equipe para incluí-los no grupo.</p>}
        </fieldset>
        {error && <p className="saas-error" role="alert">{error}</p>}
        <div className="team-modal-actions">
          <button className="saas-button" type="button" disabled={busy} onClick={() => setDraft(null)}>Cancelar</button>
          <button className="saas-button primary" disabled={busy || !draft.nome.trim()}>{busy ? "Salvando…" : "Salvar grupo"}</button>
        </div>
      </form>}
    </dialog>
    <ConfirmDialog open={remove !== null} title={`Excluir o grupo ${remove?.nome ?? ""}?`}
      description="Os usuários continuarão na equipe." confirmLabel="Excluir grupo"
      onCancel={() => setRemove(null)} onConfirm={() => void deleteGroup()} />
  </section>;
}
