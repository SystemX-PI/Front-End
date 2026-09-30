import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import IntegrationShell from "../components/IntegrationShell";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import { backend, type ContemplationRequest, type QueueItem } from "../services/backend";

type Feedback = { message: string; kind: "info" | "success" | "error" } | null;

const initialPayload = (): ContemplationRequest => ({
  origem: "sistema-parceiro",
  idExterno: `CONT-${Date.now().toString().slice(-8)}`,
  nome: "",
  email: "",
  telefone: "",
  cotaId: 1,
  assembleiaId: 1,
  dataContemplacao: new Date().toISOString().slice(0, 10),
  tipo: "SORTEIO",
  valorCredito: 50000,
});

const isPending = (item: QueueItem) =>
  item.comunicacao.statusGeral === "PENDENTE" ||
  item.comunicacao.email?.status === "FALHA" ||
  item.comunicacao.whatsapp?.status === "FALHA";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function Notifications() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const [integrationKey, setIntegrationKey] = useState(import.meta.env.DEV ? "integration-local-123" : "");
  const [payload, setPayload] = useState<ContemplationRequest>(initialPayload);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadQueue = useCallback(async () => {
    try {
      setQueue(await backend.integrations.queue());
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Falha ao carregar a fila." });
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleRefresh() {
    setLoading(true);
    await loadQueue();
  }

  useEffect(() => {
    let active = true;

    backend.integrations.queue()
      .then((items) => {
        if (active) setQueue(items);
      })
      .catch((error) => {
        if (active) {
          setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Falha ao carregar a fila." });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updatePayload<K extends keyof ContemplationRequest>(field: K, value: ContemplationRequest[K]) {
    setPayload((current) => ({ ...current, [field]: value }));
  }

  async function handleReceive(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await backend.integrations.receiveContemplation(payload, integrationKey.trim());
      setFeedback({
        kind: "success",
        message: response.jaExistia
          ? `O contemplado ${response.idExterno} já estava na fila.`
          : `Contemplado recebido e adicionado à fila no processo #${response.processoId}.`,
      });
      setPayload(initialPayload());
      setShowForm(false);
      await loadQueue();
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Falha ao receber contemplado." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNotify(processoId: number) {
    setNotifyingId(processoId);
    setFeedback(null);
    try {
      const response = await backend.processes.resendCommunication(processoId);
      setFeedback({
        kind: response.statusGeral === "PENDENTE" ? "info" : "success",
        message: response.statusGeral === "PENDENTE"
          ? "O envio continua pendente. Confira se Gmail ou WhatsApp estão configurados."
          : `Notificação processada: ${response.statusGeral.replaceAll("_", " ").toLowerCase()}.`,
      });
      await loadQueue();
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Falha ao notificar." });
    } finally {
      setNotifyingId(null);
    }
  }

  const pendingCount = queue.filter(isPending).length;
  const sentCount = queue.filter((item) => item.comunicacao.statusGeral !== "PENDENTE").length;
  const failedCount = queue.filter((item) => item.comunicacao.email?.status === "FALHA" || item.comunicacao.whatsapp?.status === "FALHA").length;

  return (
    <IntegrationShell active="notifications" title="Notificações" subtitle="Receba contemplados e gerencie a fila de comunicação">
      <section className="notification-hero">
        <div>
          <span className="eyebrow"><BellRing size={14} /> CENTRAL DE COMUNICAÇÃO</span>
          <h2>Fila de contemplados</h2>
          <p>Eventos enviados pelos sistemas parceiros ficam registrados e prontos para notificação.</p>
        </div>
        <button className="button primary" type="button" onClick={() => setShowForm((visible) => !visible)}>
          {showForm ? <X size={17} /> : <Plus size={17} />}{showForm ? "Fechar formulário" : "Receber contemplado"}
        </button>
      </section>

      <section className="notification-metrics" aria-label="Resumo da fila">
        <article><span className="metric-symbol blue"><BellRing size={19} /></span><div><strong>{queue.length}</strong><small>Total recebido</small></div></article>
        <article><span className="metric-symbol amber"><Clock3 size={19} /></span><div><strong>{pendingCount}</strong><small>Aguardando envio</small></div></article>
        <article><span className="metric-symbol green"><CheckCircle2 size={19} /></span><div><strong>{sentCount}</strong><small>Comunicados</small></div></article>
        <article><span className="metric-symbol red"><TriangleAlert size={19} /></span><div><strong>{failedCount}</strong><small>Com falha</small></div></article>
      </section>

      {showForm ? (
        <form className="panel partner-form" onSubmit={handleReceive}>
          <div className="partner-form-heading">
            <div><span className="eyebrow">ENTRADA DO SISTEMA PARCEIRO</span><h3>Novo contemplado</h3><p>Os dados serão enviados para <code>POST /api/integracoes/contemplacoes</code>.</p></div>
            <StatusPill tone="blue">Integração externa</StatusPill>
          </div>
          <div className="partner-form-grid">
            <label className="field"><span>Origem</span><input required value={payload.origem} onChange={(event) => updatePayload("origem", event.target.value)} /></label>
            <label className="field"><span>ID externo</span><input required value={payload.idExterno} onChange={(event) => updatePayload("idExterno", event.target.value)} /></label>
            <label className="field span-2"><span>Nome do contemplado</span><input required value={payload.nome} onChange={(event) => updatePayload("nome", event.target.value)} placeholder="Maria da Silva" /></label>
            <label className="field"><span>E-mail</span><input type="email" required value={payload.email} onChange={(event) => updatePayload("email", event.target.value)} placeholder="cliente@gmail.com" /></label>
            <label className="field"><span>WhatsApp</span><input value={payload.telefone} onChange={(event) => updatePayload("telefone", event.target.value.replace(/\D/g, ""))} placeholder="5511999999999" /></label>
            <label className="field"><span>Cota</span><input type="number" min="1" required value={payload.cotaId} onChange={(event) => updatePayload("cotaId", Number(event.target.value))} /></label>
            <label className="field"><span>Assembleia</span><input type="number" min="1" required value={payload.assembleiaId} onChange={(event) => updatePayload("assembleiaId", Number(event.target.value))} /></label>
            <label className="field"><span>Data da contemplação</span><input type="date" required value={payload.dataContemplacao} onChange={(event) => updatePayload("dataContemplacao", event.target.value)} /></label>
            <label className="field"><span>Tipo</span><div className="select-field"><select value={payload.tipo} onChange={(event) => updatePayload("tipo", event.target.value as ContemplationRequest["tipo"])}><option value="SORTEIO">Sorteio</option><option value="LANCE">Lance</option></select><ChevronDown size={16} /></div></label>
            <label className="field"><span>Valor do crédito</span><input type="number" min="0" step="0.01" required value={payload.valorCredito} onChange={(event) => updatePayload("valorCredito", Number(event.target.value))} /></label>
            <label className="field"><span>Chave de integração</span><input type="password" required value={integrationKey} onChange={(event) => setIntegrationKey(event.target.value)} placeholder="X-Integration-Key" autoComplete="off" /></label>
          </div>
          <div className="partner-form-actions"><p>Ao receber, o item entra como pendente e nenhum envio acontece até clicar em <strong>Notificar</strong>.</p><button className="button primary" disabled={submitting} type="submit">{submitting ? <><span className="spinner" /> Recebendo...</> : <><Plus size={16} /> Adicionar à fila</>}</button></div>
        </form>
      ) : null}

      {feedback ? <InlineFeedback message={feedback.message} kind={feedback.kind} /> : null}

      <section className="panel queue-panel">
        <div className="queue-heading"><div><h3>Fila de comunicação</h3><p>Notifique por todos os canais disponíveis ou tente novamente em caso de falha.</p></div><button className="button secondary compact" type="button" onClick={() => void handleRefresh()} disabled={loading}><RefreshCw size={15} className={loading ? "spin-icon" : ""} /> Atualizar</button></div>

        {loading ? <div className="queue-empty"><span className="spinner dark" /><strong>Carregando fila...</strong></div>
          : queue.length === 0 ? <div className="queue-empty"><span><BellRing size={25} /></span><strong>Nenhum contemplado na fila</strong><p>Use “Receber contemplado” para testar a integração do sistema parceiro.</p></div>
          : <div className="queue-list">
            {queue.map((item) => {
              const pending = isPending(item);
              return (
                <article className="queue-item" key={item.processoId}>
                  <div className="queue-main">
                    <span className={`queue-state ${pending ? "pending" : "sent"}`}>{pending ? <Clock3 size={18} /> : <CheckCircle2 size={18} />}</span>
                    <div className="queue-copy"><div><strong>{item.idExterno || `Processo #${item.processoId}`}</strong><StatusPill tone={pending ? "amber" : "green"}>{pending ? "Pendente" : "Comunicado"}</StatusPill></div><p>{item.origem || "Origem não informada"} · Processo #{item.processoId} · {formatDate(item.recebidaEm)}</p></div>
                  </div>
                  <div className="queue-channels">
                    <span className={item.comunicacao.email?.status === "SUCESSO" ? "success" : ""}><Mail size={15} /><b>{item.comunicacao.email?.destinatario || "Sem e-mail"}</b><small>{item.comunicacao.email?.status || "INDISPONÍVEL"}</small></span>
                    <span className={item.comunicacao.whatsapp?.status === "SUCESSO" ? "success" : ""}><MessageCircle size={15} /><b>{item.comunicacao.whatsapp?.destinatario || "Sem telefone"}</b><small>{item.comunicacao.whatsapp?.status || "INDISPONÍVEL"}</small></span>
                  </div>
                  <button className="button primary notify-button" type="button" disabled={notifyingId === item.processoId} onClick={() => void handleNotify(item.processoId)}>
                    {notifyingId === item.processoId ? <><span className="spinner" /> Enviando...</> : <><Send size={15} /> {pending ? "Notificar" : "Reenviar"}</>}
                  </button>
                </article>
              );
            })}
          </div>}
      </section>
    </IntegrationShell>
  );
}
