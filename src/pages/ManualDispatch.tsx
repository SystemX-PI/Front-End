import { useCallback, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import ConfirmDialog from "../components/ConfirmDialog";
import OperationHistory from "../components/OperationHistory";
import ProcessPicker, {
  initialProcessId,
  processName,
  processReference,
  useProcessDirectory,
  type ProcessOption,
} from "../components/ProcessPicker";
import { InlineFeedback } from "../components/IntegrationUi";
import { useResource } from "../hooks/useResource";
import { getUserType } from "../services/auth";
import { backend, type CommunicationResponse } from "../services/backend";
import { digits, formatDate, formatPhone, readable } from "../services/format";
import { platformRequest, type Context, type Instance } from "../services/platform";

const templates = {
  livre: "",
  contemplacao:
    "Sua cota foi contemplada. Entre em contato com nossa equipe para conferir os próximos passos.",
  documentos:
    "Precisamos conferir sua documentação para dar andamento à contemplação. Entre em contato com nossa equipe.",
  baixa:
    "Seu processo está na etapa final de conferência. Entre em contato com nossa equipe se precisar de ajuda.",
};

function whatsappRecipient(phone: string) {
  return phone.trim().startsWith("+") ? "+" + digits(phone) : digits(phone);
}

function validWhatsApp(phone: string) {
  const number = digits(phone);
  return number.length >= (phone.trim().startsWith("+") ? 8 : 10) && number.length <= 15;
}

function DispatchForm({
  item,
  onBusy,
  instances,
  requireSender,
}: {
  item: ProcessOption;
  onBusy: (busy: boolean) => void;
  instances: Instance[];
  requireSender: boolean;
}) {
  const [phone, setPhone] = useState(item.phone ? formatPhone(item.phone) : "");
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState<keyof typeof templates>("livre");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sender, setSender] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [communication, setCommunication] = useState<CommunicationResponse>(item.comunicacao);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const number = whatsappRecipient(phone);
  const selectedSender = sender || (instances.length === 1 ? String(instances[0].id) : "");
  const mustSelectSender = requireSender && instances.length > 0;
  const senderLabel =
    instances.find((inst) => String(inst.id) === selectedSender)?.name ||
    (requireSender ? "Canal interno" : "Canal operacional");

  function applyTemplate(key: keyof typeof templates) {
    setTemplate(key);
    if (key !== "livre") {
      setMessage(`${item.name ? `Olá, ${item.name}!` : "Olá!"} ${templates[key]}`);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!validWhatsApp(phone) || !message.trim()) {
      setFeedback({
        kind: "error",
        message: "Informe um número de WhatsApp com DDD e escreva a mensagem.",
      });
      return;
    }
    if (mustSelectSender && !selectedSender) return;
    setConfirm(true);
  }

  async function send() {
    if (busy) return;
    setConfirm(false);
    setBusy(true);
    onBusy(true);
    try {
      const result = await backend.processes.sendWhatsApp(
        item.processoId,
        number,
        message.trim(),
        selectedSender ? Number(selectedSender) : undefined,
      );
      setCommunication((prev) => ({ ...result, email: result.email ?? prev.email }));
      const status = result.whatsapp?.status;
      setFeedback(
        status === "SUCESSO" || status === "REALIZADA"
          ? { kind: "success", message: "Mensagem aceita pelo WhatsApp." }
          : status === "FALHA"
            ? {
                kind: "error",
                message: result.whatsapp?.erro || "Não foi possível enviar pelo WhatsApp.",
              }
            : {
                kind: "info",
                message: "Envio solicitado. A mensagem ainda não foi confirmada.",
              },
      );
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Não foi possível enviar pelo WhatsApp.",
      });
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <div className="process-detail">
      <section className="panel admin-form">
        <div>
          <h2>{processName(item)}</h2>
          <p>{processReference(item)}</p>
        </div>

        <dl className="process-facts">
          <div>
            <dt>Andamento</dt>
            <dd>{readable(item.statusProcesso)}</dd>
          </div>
          <div>
            <dt>Atualização</dt>
            <dd>{formatDate(item.recebidaEm)}</dd>
          </div>
          {item.email && (
            <div>
              <dt>E-mail</dt>
              <dd>{item.email}</dd>
            </div>
          )}
          {item.phone && (
            <div>
              <dt>WhatsApp cadastrado</dt>
              <dd>{formatPhone(item.phone)}</dd>
            </div>
          )}
          <div>
            <dt>Envio por E-mail</dt>
            <dd>{communication.email ? readable(communication.email.status) : "Sem envio"}</dd>
          </div>
          <div>
            <dt>Envio por WhatsApp</dt>
            <dd>
              {communication.whatsapp ? readable(communication.whatsapp.status) : "Sem envio"}
            </dd>
          </div>
        </dl>

        <form className="admin-form" onSubmit={submit}>
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
                  {instances.length ? "Selecione uma instância" : "Canal padrão da operação"}
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
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ex.: (11) 99999-9999"
              maxLength={25}
            />
          </label>

          <label className="field">
            Modelo de mensagem
            <select
              value={template}
              onChange={(event) =>
                applyTemplate(event.target.value as keyof typeof templates)
              }
            >
              <option value="livre">Mensagem livre</option>
              <option value="contemplacao">Aviso de contemplação</option>
              <option value="documentos">Solicitação de documentos</option>
              <option value="baixa">Conferência e baixa</option>
            </select>
          </label>

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
            <small>{message.length}/2000 caracteres</small>
          </div>

          {message.trim() && (
            <div className="panel" aria-label="Pré-visualização da mensagem">
              <strong>Pré-visualização do WhatsApp</strong>
              <p>
                Para: <span>{phone ? formatPhone(number) : "Destinatário não informado"}</span> ·{" "}
                <span>{senderLabel}</span>
              </p>
              <p style={{ whiteSpace: "pre-wrap" }}>{message.trim()}</p>
            </div>
          )}

          <div className="admin-row-actions">
            <button
              className="button primary"
              disabled={busy || (mustSelectSender && !selectedSender)}
            >
              {busy ? "Enviando…" : "Revisar envio"}
            </button>
            <Link
              className="button secondary"
              to={`/admin/contemplados?processo=${item.processoId}`}
            >
              Ver detalhes e comunicação
            </Link>
            {item.statusProcesso === "EM_PROCESSO_DE_BAIXA" && (
              <Link
                className="button secondary"
                to={`/admin/baixas?processo=${item.processoId}`}
              >
                Conferir baixa
              </Link>
            )}
          </div>
        </form>

        {feedback && <InlineFeedback {...feedback} />}

        <ConfirmDialog
          open={confirm}
          title="Enviar mensagem pelo WhatsApp?"
          description={`Confira o destinatário: ${formatPhone(number)}.`}
          confirmLabel="Enviar mensagem"
          onCancel={() => setConfirm(false)}
          onConfirm={() => void send()}
        />
      </section>

      <button
        className="button secondary"
        type="button"
        aria-expanded={showHistory}
        onClick={() => setShowHistory((value) => !value)}
      >
        {showHistory ? "Ocultar histórico de comunicação" : "Ver histórico de comunicação"}
      </button>
      {showHistory && <OperationHistory processId={item.processoId} />}
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
          : "Selecione um processo e envie uma mensagem pelo WhatsApp."
      }
    >
      {admin && (
        <div className="dialog-actions" aria-label="Modo de envio">
          <Link className="button secondary" to="/admin/disparo-manual">
            Envio de processo
          </Link>
          <Link className="button secondary" to="/admin/disparo-manual?modo=teste">
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
    () => (admin ? platformRequest<Context>("/operation-channels", null) : Promise.resolve(null)),
    [admin],
  );
  const channels = useResource(loadChannels);
  const item = directory.data?.items.find(
    (row) => row.processoId === id && !["FINALIZADO", "CANCELADO"].includes(row.statusProcesso),
  );
  return (
    <div className="process-layout">
      <ProcessPicker
        directory={directory}
        selectedId={item?.processoId ?? null}
        mode="open"
        disabled={busy}
        onSelect={(row) => setParams({ processo: String(row.processoId) }, { replace: true })}
      />
      {item ? (
        <div>
          {admin && channels.error && <InlineFeedback message={channels.error} kind="error" />}
          {admin &&
            !channels.loading &&
            !channels.error &&
            !channels.data?.instances.length && (
              <p>
                <Link to="/admin/canais">Conectar WhatsApp em Canais internos</Link>
              </p>
            )}
          <DispatchForm
            key={item.processoId}
            item={item}
            onBusy={setBusy}
            instances={channels.data?.instances ?? []}
            requireSender={admin}
          />
        </div>
      ) : (
        <section className="panel admin-form process-detail">
          <div>
            <h2>Selecione um contemplado</h2>
            <p>
              Escolha um cliente na lista ao lado para conferir os contatos da contemplação,
              aplicar um modelo de mensagem e realizar o disparo manual pelo WhatsApp.
            </p>
          </div>
          {admin &&
            !channels.loading &&
            !channels.error &&
            !channels.data?.instances.length && (
              <p>
                <Link to="/admin/canais">Conectar WhatsApp em Canais internos</Link>
              </p>
            )}
        </section>
      )}
    </div>
  );
}

function TestDispatch() {
  const load = useCallback(() => platformRequest<Context>("/operation-channels", null), []);
  const result = useResource(load);
  const [channel, setChannel] = useState<"whatsapp" | "gmail">("whatsapp");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(
    null,
  );
  const senders =
    (channel === "whatsapp"
      ? result.data?.instances
      : result.data?.mailboxes.filter((m) => m.verified)) ?? [];
  const destination = channel === "whatsapp" ? whatsappRecipient(recipient) : recipient.trim();

  async function send() {
    if (busy) return;
    setConfirm(false);
    setBusy(true);
    setFeedback(null);
    try {
      const response = await platformRequest<{ accepted: boolean; message: string }>(
        `/operation-channels/test/${channel}`,
        null,
        "POST",
        {
          senderId: Number(sender),
          recipient: destination,
          message: message.trim(),
          ...(channel === "gmail" ? { subject: subject.trim() } : {}),
        },
      );
      setFeedback({ kind: response.accepted ? "success" : "error", message: response.message });
    } catch (err) {
      setFeedback({ kind: "error", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  function review(event: FormEvent) {
    event.preventDefault();
    if (channel === "whatsapp" && !validWhatsApp(recipient)) {
      setFeedback({ kind: "error", message: "Informe um WhatsApp válido com DDD." });
      return;
    }
    setConfirm(true);
  }

  return (
    <section className="panel admin-form">
      <h2>Envio de teste</h2>
      <p>
        A mensagem será enviada de verdade ao destinatário informado e ficará registrada na
        auditoria.
      </p>
      <form className="admin-form" onSubmit={review}>
        <label className="field">
          Canal
          <select
            value={channel}
            disabled={busy}
            onChange={(event) => {
              setChannel(event.target.value === "gmail" ? "gmail" : "whatsapp");
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
        <button className="button primary" disabled={busy || !sender || !message.trim()}>
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
