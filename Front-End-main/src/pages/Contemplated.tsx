import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorState, Skeleton } from "../components/DataUi";
import { InlineFeedback } from "../components/IntegrationUi";
import OperationHistory from "../components/OperationHistory";
import ProcessPicker, { initialProcessId, processName, processReference, useProcessDirectory, type ProcessOption } from "../components/ProcessPicker";
import ProcessStatusEditor from "../components/ProcessStatusEditor";
import { useResource } from "../hooks/useResource";
import { apiRequest, backend, type CommunicationResponse, type ProcessResponse } from "../services/backend";
import { formatDate, formatPhone, readable } from "../services/format";

function ProcessDetails({ item, refresh, onBusy }: { item: ProcessOption; refresh: () => void; onBusy: (busy: boolean) => void }) {
  const load = useCallback((signal: AbortSignal) => apiRequest<ProcessResponse>(`/api/processos-contemplacao/${item.processoId}`, { signal }), [item.processoId]);
  const resource = useResource(load);
  const [updated, setUpdated] = useState<ProcessResponse | null>(null);
  const [communication, setCommunication] = useState<CommunicationResponse>(item.comunicacao);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [feedback, setFeedback] = useState<{kind: "info" | "error"; message: string} | null>(null);
  const process = updated ?? resource.data;
  const status = process?.status ?? item.statusProcesso;
  const open = status !== "FINALIZADO" && status !== "CANCELADO";

  async function resend() {
    if (busy) return;
    setConfirm(false); setBusy(true); onBusy(true); setFeedback(null);
    try {
      const result = await backend.processes.resendCommunication(item.processoId);
      setCommunication(result);
      setFeedback([result.email, result.whatsapp].some(channel => channel?.status === "FALHA")
        ? { kind: "error", message: "Um dos canais não conseguiu enviar a mensagem." }
        : { kind: "info", message: "Reenvio solicitado. Confira o status de cada canal." });
    } catch { setFeedback({ kind: "error", message: "Não foi possível solicitar o reenvio." }); }
    finally { setBusy(false); onBusy(false); }
  }

  return <div className="process-detail">
    <section className="panel admin-form">
      <div><h2>{processName(item)}</h2><p>{processReference(item)}</p></div>
      <dl className="process-facts"><div><dt>Andamento</dt><dd>{readable(status)}</dd></div><div><dt>Atualização</dt><dd>{formatDate(process?.atualizadoEm ?? item.recebidaEm)}</dd></div>
      {item.email && <div><dt>E-mail</dt><dd>{item.email}</dd></div>}{item.phone && <div><dt>WhatsApp</dt><dd>{formatPhone(item.phone)}</dd></div>}</dl>
      <dl className="process-facts">{([ ["E-mail", communication.email], ["WhatsApp", communication.whatsapp] ] as const).map(([name, channel]) => <div key={name}><dt>Envio por {name}</dt><dd>{channel ? readable(channel.status) : "Sem envio"}</dd></div>)}</dl>
      {open && <div className="admin-row-actions"><Link className="button primary" to={`/admin/disparo-manual?processo=${item.processoId}`}>Disparo manual</Link><button type="button" className="button secondary" disabled={busy} onClick={() => setConfirm(true)}>{busy ? "Solicitando…" : "Solicitar reenvio"}</button>{status === "EM_PROCESSO_DE_BAIXA" && <Link className="button secondary" to={`/admin/baixas?processo=${item.processoId}`}>Conferir baixa</Link>}</div>}
      {feedback && <InlineFeedback {...feedback}/>}
    </section>
    {resource.loading ? <Skeleton rows={2}/> : resource.error ? <ErrorState message={resource.error} retry={resource.refresh}/> : process && <ProcessStatusEditor key={`${process.id}-${process.status}`} process={process} onChange={next => { setUpdated(next); refresh(); }}/>}
    <button className="button secondary" type="button" aria-expanded={showHistory} onClick={() => setShowHistory(value => !value)}>{showHistory ? "Ocultar histórico de comunicação" : "Ver histórico de comunicação"}</button>
    {showHistory && <OperationHistory processId={item.processoId}/>}
    <ConfirmDialog open={confirm} title="Reenviar a comunicação?" description="Os destinatários dos canais disponíveis podem receber outra mensagem." onCancel={() => setConfirm(false)} onConfirm={() => void resend()}/>
  </div>;
}

export default function Contemplated() {
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const directory = useProcessDirectory();
  const id = initialProcessId(params.get("processo"));
  const item = directory.data?.items.find(row => row.processoId === id);
  return <AdminShell title="Contemplados" subtitle="Encontre a contemplação pelo cliente, contato ou referência externa.">
    <div className="process-layout"><ProcessPicker directory={directory} selectedId={id} disabled={busy} onSelect={row => setParams({ processo: String(row.processoId) }, { replace: true })}/>
      {item && <ProcessDetails key={item.processoId} item={item} refresh={directory.refresh} onBusy={setBusy}/>}
    </div>
  </AdminShell>;
}
