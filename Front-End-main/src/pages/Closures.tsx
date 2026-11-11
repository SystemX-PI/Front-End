import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import ProcessPicker, { initialProcessId, processName, processReference, useProcessDirectory, type ProcessOption } from "../components/ProcessPicker";
import { InlineFeedback } from "../components/IntegrationUi";
import { backend, sessionUserId, type ClosureResponse } from "../services/backend";
import { formatDate, readable } from "../services/format";

export default function Closures() {
  const [params, setParams] = useSearchParams();
  const directory = useProcessDirectory();
  const id = initialProcessId(params.get("processo"));
  const item = directory.data?.items.find(row => row.processoId === id);
  const [allOpen, setAllOpen] = useState(false);
  const [note, setNote] = useState("");
  const [closure, setClosure] = useState<ClosureResponse | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function select(row: ProcessOption) {
    setNote(""); setClosure(null); setError(""); setConfirm(false);
    setParams({ processo: String(row.processoId) }, { replace: true });
  }

  async function close() {
    if (!item || busy || item.statusProcesso !== "EM_PROCESSO_DE_BAIXA") return;
    setConfirm(false); setBusy(true); setError("");
    try {
      const uid = sessionUserId();
      if (!uid) throw new Error("Entre novamente para identificar o responsável pela baixa.");
      setClosure(await backend.processes.createClosure(item.processoId, uid, note.trim()));
      directory.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível concluir a baixa."); }
    finally { setBusy(false); }
  }

  return <AdminShell title="Baixas pendentes" subtitle="Selecione um processo em baixa e confira os dados antes de concluir.">
    <div className="process-layout">
      <ProcessPicker directory={directory} selectedId={id} mode={allOpen ? "open" : "closure"} disabled={busy} onSelect={select}
        filter={<label className="field">Exibir<select value={allOpen ? "open" : "closure"} onChange={event => setAllOpen(event.target.value === "open")}>
          <option value="closure">Em baixa</option><option value="open">Todos os abertos</option>
        </select></label>}/>
      {item && <section className="panel admin-form process-detail">
        <div><h2>{processName(item)}</h2><p>{processReference(item)}</p></div>
        <p>{readable(closure?.processoId === id ? "FINALIZADO" : item.statusProcesso)}</p>
        <Link to={`/admin/contemplados?processo=${item.processoId}`}>Ver detalhes e comunicação</Link>
        {closure?.processoId === id && closure ? <InlineFeedback kind="success" message={`Baixa registrada em ${formatDate(closure.data)}.`}/> : item.statusProcesso === "EM_PROCESSO_DE_BAIXA" ? <>
          <label className="field">Observação da baixa<textarea value={note} maxLength={255} onChange={event => setNote(event.target.value)}/></label>
          <button type="button" className="button primary" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Concluindo…" : "Concluir baixa"}</button>
        </> : <p>Este processo não está na etapa de baixa.</p>}
        {error && <InlineFeedback kind="error" message={error}/>}
      </section>}
    </div>
    <ConfirmDialog open={confirm && !!item} title="Concluir baixa?" description={item ? `A baixa encerra a contemplação de ${processName(item)}.` : ""} confirmLabel="Confirmar baixa" onCancel={() => setConfirm(false)} onConfirm={() => void close()}/>
  </AdminShell>;
}
