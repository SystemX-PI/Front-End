import {
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { ChannelStatus } from "../components/CommunicationQueue";
import ConfirmDialog from "../components/ConfirmDialog";
import { EmptyState } from "../components/DataUi";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import OperationHistory from "../components/OperationHistory";
import ProcessPicker, {
  initialProcessId,
  processName,
  processReference,
  useProcessDirectory,
  type ProcessOption,
} from "../components/ProcessPicker";
import { useResource } from "../hooks/useResource";
import { getUserType } from "../services/auth";
import { backend, type CommunicationResponse } from "../services/backend";
import {
  digits,
  formatDate,
  formatPhone,
  readable,
} from "../services/format";
import { platformRequest, type Context, type Instance } from "../services/platform";

function whatsappRecipient(value: string) {
  const number = digits(value);
  return `${value.trim().startsWith("+") ? "+" : ""}${number}`;
}

function validWhatsApp(value: string) {
  const number = digits(value);
  return number.length >= 10 && number.length <= 15 && !/^0+$/.test(number);
}

type ChannelMode = "WHATSAPP" | "RESEND";
type TemplateKey = "livre" | "contemplacao" | "documentos" | "baixa";

const MESSAGE_TEMPLATES: {
  key: TemplateKey;
  label: string;
  build: (item: ProcessOption) => string;
}[] = [
  {
    key: "contemplacao",
    label: "Aviso de contemplação",
    build: (item) =>
      `Olá, ${processName(item)}! Sua contemplação (${processReference(item)}) foi registrada no ConsorTech. Acesse o portal do consorciado ou responda esta mensagem para conferir os próximos passos.`,
  },
  {
    key: "documentos",
    label: "Solicitação de documentos",
    build: (item) =>
      `Olá, ${processName(item)}! Referente à sua contemplação (${processReference(item)}), aguardamos o envio da documentação pendente para prosseguirmos com a análise cadastral.`,
  },
  {
    key: "baixa",
    label: "Conferência e baixa",
    build: (item) =>
      `Olá, ${processName(item)}! Sua contemplação (${processReference(item)}) encontra-se na etapa de conferência e conclusão de baixa operacional.`,
  },
  {
    key: "livre",
    label: "Mensagem livre",
    build: () => "",
  },
];

function DispatchForm({
  item,
  onBusy,
  instances,
  requireSender,
  onRefresh,
}: {
  item: ProcessOption;
  onBusy: (busy: boolean) => void;
  instances: Instance[];
  requireSender: boolean;
  onRefresh: () => void;
}) {
  const [channelMode, setChannelMode] = useState<ChannelMode>("WHATSAPP");
  const [sender, setSender] = useState(
    instances.length === 1 ? String(instances[0].id) : "",
  );
  const [phone, setPhone] = useState(item.phone ? formatPhone(item.phone) : "");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("livre");
  const [message, setMessage] = useState("");
  const [communication, setCommunication] = useState<CommunicationResponse>(
    item.comunicacao,
  );
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRevision, setHistoryRevision] = useState(0);
  const [feedback, setFeedback] = useState<{
    kind: "info" | "success" | "error";
    message: string;
  } | null>(null);

  const selectedSender =
    sender || (instances.length === 1 ? String(instances[0].id) : "");
  const number = whatsappRecipient(phone);
  const mustSelectSender = requireSender && instances.length > 0;
  const senderLabel =
    instances.find((inst) => String(inst.id) === selectedSender)?.name ||
    "Canal operacional padrão";

  function applyTemplate(nextKey: TemplateKey) {
    setTemplateKey(nextKey);
    const found = MESSAGE_TEMPLATES.find((entry) => entry.key === nextKey);
    if (nextKey === "livre" || !found) return;
    setMessage(found.build(item));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (channelMode === "WHATSAPP") {
      if (mustSelectSender && !selectedSender) {
        setFeedback({
          kind: "error",
          message: "Selecione o WhatsApp remetente da operação.",
        });
        return;
      }
      if (!validWhatsApp(phone)) {
        setFeedback({
          kind: "error",
          message: "Informe um WhatsApp válido com DDD.",
        });
        return;
      }
      if (!message.trim()) {
        setFeedback({
          kind: "error",
          message: "Escreva a mensagem antes de enviar.",
        });
        return;
      }
    }
    setConfirm(true);
  }

  async function send() {
    if (busy) return;
    setConfirm(false);
    setBusy(true);
    onBusy(true);
    try {
      if (channelMode === "WHATSAPP") {
        const result = await backend.processes.sendWhatsApp(
          item.processoId,
          number,
          message.trim(),
          selectedSender ? Number(selectedSender) : undefined,
        );
        setCommunication((prev) => ({
          ...result,
          email: result.email ?? prev.email,
        }));
        setHistoryRevision((value) => value + 1);
        onRefresh();
        const status = result.whatsapp?.status;
        setFeedback(
          status === "SUCESSO" || status === "REALIZADA"
            ? { kind: "success", message: "Mensagem aceita pelo WhatsApp." }
            : status === "FALHA"
              ? {
                  kind: "error",
                  message:
                    result.whatsapp?.erro ||
                    "Não foi possível enviar pelo WhatsApp.",
                }
              : {
                  kind: "info",
                  message:
                    "Envio solicitado. A mensagem ainda não foi confirmada.",
                },
        );
      } else {
        const result = await backend.processes.resendCommunication(
          item.processoId,
        );
        setCommunication(result);
        setHistoryRevision((value) => value + 1);
        onRefresh();
        const hasFailure = [result.email, result.whatsapp].some(
          (ch) => ch?.status === "FALHA",
        );
        setFeedback(
          hasFailure
            ? {
                kind: "error",
                message:
                  result.email?.erro ||
                  result.whatsapp?.erro ||
                  "Um dos canais não conseguiu enviar a mensagem.",
              }
            : {
                kind: "success",
                message:
                  "Reenvio oficial solicitado para os canais cadastrados.",
              },
        );
      }
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar pelo WhatsApp.",
      });
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <div className="dispatch-main-column">
      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>2. Destinatário e canais do processo</h3>
            <p>
              Confira a situação atual da contemplação e os canais registrados
              para o consorciado selecionado.
            </p>
          </div>
          <div className="split-actions">
            <Link
              className="button secondary compact"
              to={`/admin/contemplados?processo=${item.processoId}`}
            >
              Ver detalhes e comunicação
            </Link>
            {item.statusProcesso === "EM_PROCESSO_DE_BAIXA" && (
              <Link
                className="button secondary compact"
                to={`/admin/baixas?processo=${item.processoId}`}
              >
                Conferir baixa
              </Link>
            )}
          </div>
        </div>

        <div className="dispatch-context-summary">
          <div className="dispatch-context-header">
            <div>
              <span className="eyebrow">DESTINATÁRIO SELECIONADO</span>
              <h2>{processName(item)}</h2>
              <p>{processReference(item)}</p>
            </div>
            <div className="split-actions">
              <StatusPill
                tone={
                  item.statusProcesso === "FINALIZADO"
                    ? "green"
                    : item.statusProcesso === "EM_PROCESSO_DE_BAIXA"
                      ? "amber"
                      : "blue"
                }
              >
                {readable(item.statusProcesso)}
              </StatusPill>
              <StatusPill
                tone={communication.statusGeral === "PENDENTE" ? "amber" : "green"}
              >
                {readable(communication.statusGeral)}
              </StatusPill>
            </div>
          </div>

          <dl className="dispatch-meta-grid">
            <div>
              <dt>Andamento</dt>
              <dd>{readable(item.statusProcesso)}</dd>
            </div>
            <div>
              <dt>Referência externa</dt>
              <dd>{processReference(item)}</dd>
            </div>
            <div>
              <dt>Última atualização</dt>
              <dd>{formatDate(item.recebidaEm)}</dd>
            </div>
            <div>
              <dt>E-mail cadastrado</dt>
              <dd>{item.email || communication.email?.destinatario || "Não informado"}</dd>
            </div>
          </dl>

          <div className="channel-grid">
            <ChannelStatus
              channel={communication.whatsapp}
              name="WhatsApp"
            />
            <ChannelStatus
              channel={communication.email}
              name="E-mail"
            />
          </div>
        </div>
      </section>

      <form
        className="panel data-panel dispatch-composer-panel"
        onSubmit={submit}
      >
        <div className="data-panel-heading">
          <div>
            <h3>3. Configurar canal e mensagem</h3>
            <p>
              Personalize o comunicado por WhatsApp ou acione o reenvio oficial
              nos canais registrados da contemplação.
            </p>
          </div>
          <StatusPill tone="blue">
            {channelMode === "WHATSAPP"
              ? "WhatsApp personalizado"
              : "Reenvio multicanal"}
          </StatusPill>
        </div>

        <div
          className="dispatch-channel-cards"
          role="radiogroup"
          aria-label="Canal de comunicação"
        >
          <button
            type="button"
            role="radio"
            aria-checked={channelMode === "WHATSAPP"}
            className={
              channelMode === "WHATSAPP"
                ? "dispatch-channel-card active"
                : "dispatch-channel-card"
            }
            onClick={() => {
              setChannelMode("WHATSAPP");
              setFeedback(null);
            }}
          >
            <div className="dispatch-channel-card-head">
              <span className="service-icon icon-green">
                <MessageCircle size={19} />
              </span>
              <div>
                <strong>WhatsApp — Mensagem personalizada</strong>
                <small>
                  Permite informar o telefone do destinatário, aplicar modelos e
                  redigir o texto da mensagem.
                </small>
              </div>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={channelMode === "RESEND"}
            className={
              channelMode === "RESEND"
                ? "dispatch-channel-card active"
                : "dispatch-channel-card"
            }
            onClick={() => {
              setChannelMode("RESEND");
              setFeedback(null);
            }}
          >
            <div className="dispatch-channel-card-head">
              <span className="service-icon icon-red">
                <Mail size={19} />
              </span>
              <div>
                <strong>E-mail e Canais Padrão — Reenvio oficial</strong>
                <small>
                  Solicita o reenvio automático nos canais registrados para esta
                  contemplação.
                </small>
              </div>
            </div>
          </button>
        </div>

        {channelMode === "WHATSAPP" ? (
          <div className="dispatch-whatsapp-workspace">
            <div className="dispatch-form-column">
              {requireSender && (
                <label className="field">
                  WhatsApp remetente
                  <select
                    required={mustSelectSender}
                    value={selectedSender}
                    onChange={(event) => setSender(event.target.value)}
                    disabled={busy || !instances.length}
                  >
                    <option value="">
                      {instances.length
                        ? "Selecione uma instância"
                        : "Canal padrão da operação"}
                    </option>
                    {instances.map((instance) => (
                      <option key={instance.id} value={instance.id}>
                        {instance.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                WhatsApp do destinatário
                <div className="input-with-icon">
                  <Phone size={17} aria-hidden="true" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+55 (11) 99999-9999"
                    maxLength={25}
                  />
                </div>
              </label>

              <div className="dispatch-templates-block">
                <span className="dispatch-label">
                  <Sparkles size={14} /> Modelos rápidos de mensagem
                </span>
                <div className="dispatch-template-pills">
                  {MESSAGE_TEMPLATES.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      className={
                        templateKey === entry.key
                          ? "button primary compact"
                          : "button secondary compact"
                      }
                      onClick={() => applyTemplate(entry.key)}
                    >
                      <FileText size={13} />
                      {entry.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="field">
                  Mensagem
                  <textarea
                    required
                    rows={5}
                    maxLength={2000}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escreva a orientação para o cliente contemplado..."
                  />
                </label>
                <div className="dispatch-char-counter">
                  <small>Remetente: {senderLabel}</small>
                  <small>{message.length}/2000 caracteres</small>
                </div>
              </div>
            </div>

            <aside
              className="dispatch-preview-card"
              aria-label="Pré-visualização da mensagem"
            >
              <div className="dispatch-preview-header">
                <MessageCircle size={16} />
                <div>
                  <strong>Prévia no WhatsApp</strong>
                  <small>
                    Destinatário: {phone ? formatPhone(number) : "Não informado"}
                  </small>
                </div>
              </div>
              <div className="dispatch-preview-bubble">
                <p>
                  {message.trim() ||
                    "Sua mensagem aparecerá aqui conforme você digitar ou selecionar um modelo rápido ao lado."}
                </p>
                <span className="dispatch-preview-meta">
                  ConsorTech · {processReference(item)}
                </span>
              </div>
            </aside>
          </div>
        ) : (
          <div className="dispatch-resend-info">
            <div className="dispatch-resend-targets">
              <div>
                <strong>Destinatário de E-mail vinculado</strong>
                <p>
                  {communication.email?.destinatario ||
                    item.email ||
                    "Nenhum destinatário de e-mail cadastrado."}
                </p>
              </div>
              <div>
                <strong>Destinatário de WhatsApp vinculado</strong>
                <p>
                  {communication.whatsapp?.destinatario
                    ? formatPhone(communication.whatsapp.destinatario)
                    : item.phone
                      ? formatPhone(item.phone)
                      : "Nenhum telefone cadastrado."}
                </p>
              </div>
            </div>
          </div>
        )}

        {feedback && <InlineFeedback {...feedback} />}

        <div className="partner-form-actions">
          <p>
            Confira o destinatário e o conteúdo da mensagem antes de confirmar o
            disparo.
          </p>
          <button
            type="submit"
            className="button primary"
            disabled={
              busy ||
              (channelMode === "WHATSAPP" &&
                mustSelectSender &&
                !selectedSender)
            }
          >
            <Send size={16} />
            {busy ? "Enviando…" : "Revisar envio"}
          </button>
        </div>

        <ConfirmDialog
          open={confirm}
          title={
            channelMode === "WHATSAPP"
              ? "Enviar mensagem pelo WhatsApp?"
              : "Solicitar reenvio oficial?"
          }
          description={
            channelMode === "WHATSAPP"
              ? `Confira o destinatário: ${formatPhone(number)}.`
              : `Os canais vinculados de ${processName(item)} receberão uma nova tentativa de envio.`
          }
          confirmLabel="Enviar mensagem"
          onCancel={() => setConfirm(false)}
          onConfirm={() => void send()}
        />
      </form>

      <div>
        <button
          className="button secondary"
          type="button"
          aria-expanded={showHistory}
          onClick={() => setShowHistory((value) => !value)}
        >
          {showHistory
            ? "Ocultar histórico de comunicação"
            : "Ver histórico de comunicação"}
        </button>
      </div>
      {showHistory && (
        <OperationHistory
          key={`${item.processoId}-${historyRevision}`}
          processId={item.processoId}
        />
      )}
    </div>
  );
}

export default function ManualDispatch() {
  const [params] = useSearchParams();
  const admin = getUserType() === "ADMINISTRADOR";
  const testing = admin && params.get("modo") === "teste";
  return (
    <AdminShell
      title="Disparo manual"
      subtitle={
        testing
          ? "Envie uma mensagem de teste por um canal interno."
          : "Selecione um processo contemplado, configure o canal e acompanhe a prévia antes de enviar."
      }
    >
      {admin && (
        <div className="dialog-actions" aria-label="Modo de envio">
          <Link
            className={!testing ? "button primary compact" : "button secondary compact"}
            to="/admin/disparo-manual"
          >
            Envio de processo
          </Link>
          <Link
            className={testing ? "button primary compact" : "button secondary compact"}
            to="/admin/disparo-manual?modo=teste"
          >
            Envio de teste
          </Link>
        </div>
      )}
      {testing ? <TestDispatch /> : <ProcessDispatch admin={admin} />}
    </AdminShell>
  );
}

function ProcessDispatch({ admin }: { admin: boolean }) {
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const id = initialProcessId(params.get("processo"));
  const directory = useProcessDirectory();
  const loadChannels = useCallback(
    () =>
      admin
        ? platformRequest<Context>("/operation-channels", null)
        : Promise.resolve(null),
    [admin],
  );
  const channels = useResource(loadChannels);
  const allItems = directory.data?.items ?? [];
  const openItems = allItems.filter(
    (row) => !["FINALIZADO", "CANCELADO"].includes(row.statusProcesso),
  );
  const item = openItems.find((row) => row.processoId === id);

  const metrics = [
    {
      label: "Processos disponíveis",
      value: openItems.length,
      icon: Send,
    },
    {
      label: "Pendentes de envio",
      value: openItems.filter(
        (row) => row.comunicacao.statusGeral === "PENDENTE",
      ).length,
      icon: Sparkles,
    },
    {
      label: "Comunicados",
      value: openItems.filter(
        (row) => row.comunicacao.statusGeral !== "PENDENTE",
      ).length,
      icon: CheckCircle2,
    },
    {
      label: "Canais com falha",
      value: openItems.filter(
        (row) =>
          row.comunicacao.email?.status === "FALHA" ||
          row.comunicacao.whatsapp?.status === "FALHA",
      ).length,
      icon: TriangleAlert,
    },
  ];

  return (
    <>
      <section
        className="notification-metrics"
        aria-label="Indicadores de disparo manual"
      >
        {metrics.map((metric) => (
          <article key={metric.label}>
            <small>{metric.label}</small>
            <strong>
              {directory.loading || directory.error ? "—" : metric.value}
            </strong>
          </article>
        ))}
      </section>

      <div className="manual-dispatch-grid">
        <div className="dispatch-selector-panel">
          <ProcessPicker
            directory={directory}
            selectedId={item?.processoId ?? null}
            mode="open"
            disabled={busy}
            onSelect={(row) =>
              setParams({ processo: String(row.processoId) }, { replace: true })
            }
          />
          {admin && channels.error && (
            <InlineFeedback message={channels.error} kind="error" />
          )}
          {admin &&
            !channels.loading &&
            !channels.error &&
            !channels.data?.instances.length && (
              <p>
                <Link to="/admin/canais">
                  Conectar WhatsApp em Canais internos
                </Link>
              </p>
            )}
        </div>

        {item ? (
          <DispatchForm
            key={item.processoId}
            item={item}
            onBusy={setBusy}
            instances={channels.data?.instances ?? []}
            requireSender={admin}
            onRefresh={directory.refresh}
          />
        ) : (
          <div className="dispatch-main-column">
            <section className="panel data-panel">
              <EmptyState
                title="Selecione um contemplado"
                description="Escolha um cliente contemplado na lista ao lado para visualizar o status dos canais, aplicar um modelo de mensagem e realizar o disparo manual pelo WhatsApp."
              />
            </section>
          </div>
        )}
      </div>
    </>
  );
}

function TestDispatch() {
  const load = useCallback(
    () => platformRequest<Context>("/operation-channels", null),
    [],
  );
  const result = useResource(load);
  const [channel, setChannel] = useState<"whatsapp" | "gmail">("whatsapp");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const senders =
    (channel === "whatsapp"
      ? result.data?.instances
      : result.data?.mailboxes.filter((m) => m.verified)) ?? [];
  const destination =
    channel === "whatsapp" ? whatsappRecipient(recipient) : recipient.trim();

  async function send() {
    if (busy) return;
    setConfirm(false);
    setBusy(true);
    setFeedback(null);
    try {
      const response = await platformRequest<{
        accepted: boolean;
        message: string;
      }>(`/operation-channels/test/${channel}`, null, "POST", {
        senderId: Number(sender),
        recipient: destination,
        message: message.trim(),
        ...(channel === "gmail" ? { subject: subject.trim() } : {}),
      });
      setFeedback({
        kind: response.accepted ? "success" : "error",
        message: response.message,
      });
    } catch (err) {
      setFeedback({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function review(event: FormEvent) {
    event.preventDefault();
    if (channel === "whatsapp" && !validWhatsApp(recipient)) {
      setFeedback({
        kind: "error",
        message: "Informe um WhatsApp válido com DDD.",
      });
      return;
    }
    setConfirm(true);
  }

  return (
    <section className="panel admin-form">
      <h2>Envio de teste</h2>
      <p>
        A mensagem será enviada de verdade ao destinatário informado e ficará
        registrada na auditoria.
      </p>
      <form className="admin-form" onSubmit={review}>
        <label className="field">
          Canal
          <select
            value={channel}
            disabled={busy}
            onChange={(event) => {
              setChannel(
                event.target.value === "gmail" ? "gmail" : "whatsapp",
              );
              setSender("");
              setRecipient("");
              setFeedback(null);
            }}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="gmail">Gmail</option>
          </select>
        </label>
        <label className="field">
          Remetente
          <select
            required
            value={sender}
            disabled={busy}
            onChange={(event) => setSender(event.target.value)}
          >
            <option value="">Selecione um remetente</option>
            {senders.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {"email" in item ? ` · ${item.email}` : ""}
              </option>
            ))}
          </select>
        </label>
        {!result.loading && !senders.length && (
          <Link to="/admin/canais">Configurar canais internos</Link>
        )}
        {result.error && <InlineFeedback message={result.error} kind="error" />}
        <label className="field">
          Destinatário
          <input
            required
            type={channel === "gmail" ? "email" : "tel"}
            maxLength={255}
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </label>
        {channel === "gmail" && (
          <label className="field">
            Assunto
            <input
              required
              maxLength={160}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
        )}
        <label className="field">
          Mensagem
          <textarea
            required
            rows={5}
            maxLength={2000}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button
          className="button primary"
          disabled={busy || !sender || !message.trim()}
        >
          {busy ? "Enviando…" : "Revisar teste"}
        </button>
      </form>
      {feedback && <InlineFeedback {...feedback} />}
      <ConfirmDialog
        open={confirm}
        title="Enviar mensagem de teste?"
        description={`Confira o destinatário: ${recipient}.`}
        confirmLabel="Enviar teste"
        onCancel={() => setConfirm(false)}
        onConfirm={() => void send()}
      />
    </section>
  );
}
