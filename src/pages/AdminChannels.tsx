import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import { ErrorState, Skeleton } from "../components/DataUi";
import { InlineFeedback } from "../components/IntegrationUi";
import { useResource } from "../hooks/useResource";
import { platformRequest, type Context } from "../services/platform";
import { Mailboxes } from "./PlatformApp";
import PlatformWhatsApp from "./PlatformWhatsApp";

type Channel = "whatsapp" | "gmail";
type TestResult = { accepted: boolean; message: string };

export default function AdminChannels() {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [context, setContext] = useState<Context | null>(null);
  const [testing, setTesting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [senderId, setSenderId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [lastTests, setLastTests] = useState<Partial<Record<Channel, { result: TestResult; testedAt: string }>>>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const reload = useCallback(async () => {
    const data = await platformRequest<Context>("/operation-channels", null);
    if (!data || !Array.isArray(data.instances) || !Array.isArray(data.mailboxes)) {
      throw new Error("Não foi possível carregar os canais internos da administração.");
    }
    setContext(data);
  }, []);
  const resource = useResource(reload);
  const senders = useMemo(() => context ? (channel === "whatsapp" ? context.instances : context.mailboxes) : [], [channel, context]);

  useEffect(() => {
    if (!senders.some(sender => String(sender.id) === senderId)) {
      setSenderId(senders[0] ? String(senders[0].id) : "");
    }
  }, [channel, context, senderId, senders]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (testing && !dialog.open) dialog.showModal();
    else if (!testing && dialog.open) dialog.close();
  }, [testing]);

  function openTest() {
    setError("");
    setResult(null);
    setRecipient("");
    setSubject("");
    setMessage("");
    setTesting(true);
  }

  async function submitTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericSenderId = Number(senderId);
    if (!Number.isSafeInteger(numericSenderId) || numericSenderId <= 0 || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    const path = `/operation-channels/test/${channel}`;
    const payload = channel === "whatsapp"
      ? { senderId: numericSenderId, recipient: recipient.trim(), message: message.trim() }
      : { senderId: numericSenderId, recipient: recipient.trim(), subject: subject.trim(), message: message.trim() };
    try {
      const response = await platformRequest<TestResult>(path, null, "POST", payload);
      if (typeof response?.accepted !== "boolean" || typeof response.message !== "string") {
        throw new Error("O servidor retornou um resultado de teste inválido.");
      }
      setResult(response);
      setLastTests(current => ({ ...current, [channel]: { result: response, testedAt: new Date().toLocaleString("pt-BR") } }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível testar este canal.");
    } finally {
      setBusy(false);
    }
  }

  return <AdminShell title="Canais internos" subtitle="Verifique o estado dos canais e teste o envio antes de iniciar a operação.">
    <div className="dialog-actions" role="group" aria-label="Canal interno">
      <button className="button secondary" aria-pressed={channel === "whatsapp"} onClick={() => setChannel("whatsapp")}>WhatsApp</button>
      <button className="button secondary" aria-pressed={channel === "gmail"} onClick={() => setChannel("gmail")}>Gmail</button>
      <button className="button primary" type="button" onClick={openTest} disabled={!senders.length}>Testar envio de {channel === "whatsapp" ? "WhatsApp" : "Gmail"}</button>
      <Link className="button secondary" to="/admin/disparo-manual?modo=teste">Abrir envio operacional de teste</Link>
    </div>
    {resource.loading ? <Skeleton /> : resource.error ? <ErrorState message={resource.error} retry={resource.refresh} /> :
      context && (channel === "whatsapp" ? <PlatformWhatsApp context={context} accountId={null} reload={reload} />
        : <Mailboxes context={context} accountId={null} reload={reload} />)}
    {channel === "gmail" && context?.mailboxes.length ? <p role="status">{context.mailboxes.filter(mailbox => mailbox.verified).length} conta(s) Gmail marcada(s) como verificada(s) pelo Back-End. Envie um teste para validar a conexão atual.</p> : null}
    {lastTests[channel] && <InlineFeedback kind={lastTests[channel]!.result.accepted ? "success" : "error"} message={`Último teste em ${lastTests[channel]!.testedAt}: ${lastTests[channel]!.result.accepted ? "aceito pelo provedor" : "falhou"}. ${lastTests[channel]!.result.message}${lastTests[channel]!.result.accepted ? " A entrega ao destinatário não foi confirmada." : ""}`} />}

    <dialog className="confirm-dialog" ref={dialogRef} aria-labelledby={`${id}-title`} onClose={() => setTesting(false)} onCancel={() => setTesting(false)}>
      <button className="dialog-close" type="button" aria-label="Fechar teste" onClick={() => setTesting(false)}>×</button>
      <h2 id={`${id}-title`}>Testar {channel === "whatsapp" ? "WhatsApp" : "Gmail"}</h2>
      <p>Envie uma mensagem para um destino controlado por você. A aceitação pelo provedor não confirma que o destinatário recebeu a mensagem.</p>
      {error && <InlineFeedback kind="error" message={error}/>}
      {result && <InlineFeedback kind={result.accepted ? "success" : "error"} message={`${result.accepted ? "Aceito pelo provedor" : "Falha no envio"}: ${result.message} ${result.accepted ? "A entrega ao destinatário ainda não foi confirmada." : ""}`}/>}
      <form className="saas-form" onSubmit={event => void submitTest(event)}>
        <label htmlFor={`${id}-sender`}>Remetente
          <select id={`${id}-sender`} value={senderId} required onChange={event => setSenderId(event.target.value)}>
            {senders.map(sender => <option key={sender.id} value={sender.id}>{sender.name}{"email" in sender ? ` — ${sender.email}` : " — WhatsApp"}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-recipient`}>{channel === "whatsapp" ? "Telefone de destino" : "E-mail de destino"}
          <input id={`${id}-recipient`} type={channel === "gmail" ? "email" : "tel"} required maxLength={255} pattern={channel === "whatsapp" ? "[+]?[0-9]{8,15}" : undefined} value={recipient} onChange={event => setRecipient(event.target.value)} placeholder={channel === "whatsapp" ? "+5511999999999" : "seu-email@exemplo.com"}/>
        </label>
        {channel === "gmail" && <label htmlFor={`${id}-subject`}>Assunto<input id={`${id}-subject`} required maxLength={160} value={subject} onChange={event => setSubject(event.target.value)} placeholder="Teste de conexão Gmail"/></label>}
        <label htmlFor={`${id}-message`}>Mensagem<textarea id={`${id}-message`} required maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Mensagem de validação"/></label>
        <div className="dialog-actions"><button className="button secondary" type="button" onClick={() => setTesting(false)}>Fechar</button><button className="button primary" type="submit" disabled={busy || !senderId}>{busy ? "Enviando…" : "Enviar teste"}</button></div>
      </form>
    </dialog>
  </AdminShell>;
}
