import { useState, type FormEvent } from "react";
import { backend, type ProcessResponse, type ProcessStatus } from "../services/backend";
import { ApiError } from "../services/http";
import ConfirmDialog from "./ConfirmDialog";
import { readable } from "../services/format";

export default function ProcessStatusEditor({ process, onChange }: {
  process: ProcessResponse;
  onChange: (process: ProcessResponse) => void;
}) {
  const [status, setStatus] = useState<ProcessStatus | "">("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const options = process.transicoesPermitidas ?? [];
  const target = options.find(option => option === status);
  const precisaEvidencia = target === "CLIENTE_CONTATADO";
  const podeConfirmar = !!target && (!precisaEvidencia || !!note.trim());

  async function update() {
    if (busy || !target) return;
    setConfirm(false);
    setBusy(true);
    setError("");
    try {
      onChange(await backend.processes.updateStatus(process.id, { status: target, observacao: note.trim() }));
      setNote("");
      setStatus("");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409
        ? "Esse status não está disponível para a etapa atual. Consulte o processo novamente antes de tentar."
        : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (podeConfirmar && !busy) setConfirm(true);
  }

  if (process.status === "FINALIZADO" || process.status === "CANCELADO") {
    return <p>Processo encerrado. A alteração de status está indisponível.</p>;
  }
  if (!options.length) return <p>Nenhuma alteração de status está disponível nesta etapa.</p>;

  return (
    <form className="panel admin-form" onSubmit={submit}>
      <h3>Atualizar andamento</h3>
      <p>Para concluir o processo, use a conferência de baixa.</p>
      <label className="field">
        Novo status
        <select value={target ?? ""} onChange={event => setStatus(event.target.value as ProcessStatus | "")}>
          <option value="">Selecione o próximo status</option>
          {options.map(option => <option key={option} value={option}>{readable(option)}</option>)}
        </select>
      </label>
      <label className="field">
        {precisaEvidencia ? "Evidência de contato confirmado" : "Observação do andamento"}
        <textarea required={precisaEvidencia} value={note} maxLength={255} onChange={event => setNote(event.target.value)} />
      </label>
      {precisaEvidencia && <p>Registre como o contato foi confirmado. Aceite do provedor não comprova contato.</p>}
      {error && <p role="alert">{error}</p>}
      <button className="button secondary" disabled={busy || !podeConfirmar}>Atualizar andamento</button>
      <ConfirmDialog open={confirm && !!target} title={target ? `Alterar andamento para ${readable(target)}?` : ""}
        description="Confira o novo status e a observação." confirmLabel="Confirmar alteração"
        onCancel={() => setConfirm(false)} onConfirm={() => void update()} />
    </form>
  );
}
