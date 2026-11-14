import { useCallback, useState, type FormEvent } from "react";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { platformRequest, type Context } from "../services/platform";
import { useResource } from "../hooks/useResource";
import { EmptyState, ErrorState, Skeleton } from "../components/DataUi";
import ConfirmDialog from "../components/ConfirmDialog";
import "./message-composer.css";

type Canal = "WHATSAPP" | "GMAIL";
type Item = { id: number; nome: string; origem: string; referencia: string; telefone?: string; email?: string; whatsapp?: string; gmail?: string };
function situacao(estado?: string) {
  if (estado === "ACEITO") return "Envio aceito";
  if (estado === "FALHA") return "Falhou";
  return "Aguardando envio";
}
type Envio = { canal: Canal; estado: string; criado_em: string };

export default function ClientContemplados({ context }: { context: Context }) {
  const load = useCallback(() => platformRequest<Item[]>("/contemplados", null), []);
  const queue = useResource(load);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number>();
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [confirmKey, setConfirmKey] = useState(false);
  const records = queue.data ?? [];
  const active = records.find(item => item.id === selected);
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = records.filter(item => [item.nome, item.origem, item.referencia, item.telefone, item.email]
    .some(value => value?.toLocaleLowerCase("pt-BR").includes(term)));

  async function generate() {
    setConfirmKey(false);
    setKeyBusy(true);
    setKeyError("");
    try {
      const result = await platformRequest<{ chave: string }>("/contemplados/chave", null, "POST");
      setKey(result.chave);
    } catch (error) {
      setKeyError((error as Error).message);
    } finally {
      setKeyBusy(false);
    }
  }

  return <section className="client-queue">
    <header className="workspace-heading"><div>
      <h1>Contemplados</h1>
      <p>Selecione um contemplado na fila para fazer um disparo manual por WhatsApp ou Gmail.</p>
    </div></header>
    <div className="client-queue-layout">
      <section className="saas-panel" aria-label="Fila de contemplados">
        <label className="saas-form">Buscar na fila
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Nome, contato ou referência" />
        </label>
        {queue.loading ? <Skeleton /> : queue.error && !queue.data ? <ErrorState message={queue.error} retry={queue.refresh} /> :
          filtered.length ? <ul className="client-queue-list">{filtered.map(item => <li key={item.id}>
            <button type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
              <span><strong>{item.nome}</strong><small>{item.origem} · {item.referencia}</small></span>
              <span className="client-queue-status"><span data-state={item.whatsapp}><MessageCircle size={15} aria-label="WhatsApp" />{situacao(item.whatsapp)}</span>
                <span data-state={item.gmail}><Mail size={15} aria-label="Gmail" />{situacao(item.gmail)}</span></span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </li>)}</ul> : <EmptyState title={term ? "Nenhum resultado" : "Nenhum contemplado recebido"}
            description={term ? "Tente outro nome, contato ou referência." : "Conecte o sistema de consórcio para receber os registros aqui."} />}
      </section>
      {active && <Dispatch key={active.id} item={active} context={context} reload={queue.refresh} />}
    </div>
    {context.role === "CLIENTE" && <details className="saas-panel client-queue-connection">
      <summary>Conectar sistema de consórcio</summary>
      <p>Envie um POST para <code>/api/integracoes/contemplados-empresa</code> com o cabeçalho <code>X-Integration-Key</code>.</p>
      <pre>{JSON.stringify({ origem: "erp", referencia: "cota-123", nome: "Nome do contemplado", telefone: "+5511999990000", email: "contato@example.test" }, null, 2)}</pre>
      <button className="saas-button" type="button" disabled={keyBusy} onClick={() => setConfirmKey(true)}>Gerar chave de recebimento</button>
      {keyError && <p role="alert">{keyError}</p>}
      {key && <label className="saas-form">Chave de integração<input readOnly value={key} onFocus={event => event.target.select()} /></label>}
    </details>}
    <ConfirmDialog open={confirmKey} title="Gerar chave de recebimento?" description="Uma chave anterior deixa de funcionar ao gerar outra."
      confirmLabel="Gerar chave" onCancel={() => setConfirmKey(false)} onConfirm={() => void generate()} />
  </section>;
}

export function Dispatch({ item, context, reload }: { item?: Item; context: Context; reload?: () => void }) {
  const [channel, setChannel] = useState<Canal>(!item || item.telefone ? "WHATSAPP" : "GMAIL");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [contact, setContact] = useState("");
  const accessLoad = useCallback(() => platformRequest<{ permitido: boolean }>("/disparo-manual", null), []);
  const access = useResource(accessLoad);
  const historyLoad = useCallback(() => item ? platformRequest<Envio[]>(`/contemplados/${item.id}/envios`, null) : Promise.resolve([]), [item]);
  const history = useResource(historyLoad);
  const senders = channel === "WHATSAPP" ? context.instances : context.mailboxes.filter(mailbox => mailbox.verified);
  const manualDestination = channel === "WHATSAPP" ? contact.trim().replace(/[ ().-]/g, "") : contact.trim();
  const destination = item ? (channel === "WHATSAPP" ? item.telefone : item.email) : manualDestination;
  const senderName = senders.find(value => String(value.id) === sender)?.name;
  const canSend = context.active && access.data?.permitido && Boolean(destination && sender && message.trim());

  function review(event: FormEvent) {
    event.preventDefault();
    if (canSend && !busy) setConfirm(true);
  }

  async function send() {
    if (!canSend || busy) return;
    setConfirm(false);
    setBusy(true);
    setFeedback("Enviando…");
    try {
      const result = await platformRequest<{ estado: string }>(item ? `/contemplados/${item.id}/envios` : "/disparo-manual", null, "POST",
        { canal: channel, remetente: Number(sender), mensagem: message.trim(), ...(item ? {} : { destino: destination }) });
      setFeedback(result.estado === "ACEITO" ? "Envio aceito pelo provedor." : "Falha no envio. Confira a conexão do remetente e tente novamente.");
      history.refresh();
      reload?.();
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="saas-panel client-queue-detail dispatch-composer message-composer" aria-label="Disparo manual">
    <header className="message-composer-heading"><span aria-hidden="true">{channel === "WHATSAPP" ? <MessageCircle size={22}/> : <Mail size={22}/>}</span><h2>Disparo manual</h2></header>
    {item && <p><strong>{item.nome}</strong> · {item.origem} · {item.referencia}</p>}
    {access.loading && <Skeleton rows={1}/>}
    {access.error && <ErrorState message={access.error} retry={access.refresh}/>}
    {access.data?.permitido === false && <p role="status">Peça ao titular para liberar o envio em Equipe.</p>}
    <form className="saas-form dispatch-fields" onSubmit={review}>
      <fieldset className="message-channel-picker" disabled={busy}>
        <legend>Canal</legend>
        <div>{(["WHATSAPP", "GMAIL"] as const).map(option => <label key={option} data-selected={channel === option}>
          <input className="sr-only" type="radio" name="dispatch-channel" checked={channel === option}
            onChange={() => { setChannel(option); setSender(""); }}/>
          {option === "WHATSAPP" ? <MessageCircle size={17} aria-hidden="true"/> : <Mail size={17} aria-hidden="true"/>}
          {option === "WHATSAPP" ? "WhatsApp" : "Gmail"}
        </label>)}</div>
      </fieldset>
      {item ? <p>Destinatário: {destination || "Contato indisponível"}</p> : <label>Destinatário<input required type={channel === "GMAIL" ? "email" : "tel"} value={contact} disabled={busy} maxLength={255} onChange={event => setContact(event.target.value)} placeholder={channel === "WHATSAPP" ? "+5511999999999" : "nome@empresa.com"}/></label>}
      <label>Remetente<select required disabled={busy} value={sender} onChange={event => setSender(event.target.value)}>
        <option value="">{senders.length ? "Selecione o remetente" : "Conecte um remetente em Integrações"}</option>
        {senders.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}
      </select></label>
      <div className="dispatch-message message-editor">
        <label>Mensagem<textarea required maxLength={2000} rows={4} disabled={busy} value={message}
          placeholder="Escreva a mensagem que o destinatário vai receber" onChange={event => setMessage(event.target.value)} /></label>
        <footer><small>{message.length.toLocaleString("pt-BR")} / 2.000</small>
          <button className="saas-button primary" disabled={!canSend || busy}>
            {busy ? "Enviando…" : "Revisar envio"}<ArrowRight size={16} aria-hidden="true"/>
          </button>
        </footer>
      </div>
    </form>
    {feedback && <p role="status">{feedback}</p>}
    {item && <><h3>Histórico de envios</h3>
    {history.loading ? <Skeleton rows={2} /> : history.error ? <ErrorState message={history.error} retry={history.refresh} /> :
      history.data?.length ? <ul className="client-queue-history">{history.data.map((entry, index) =>
        <li key={index}>{entry.canal === "WHATSAPP" ? "WhatsApp" : "Gmail"} · {entry.estado}</li>)}</ul> : <p>Nenhum envio registrado.</p>}</>}
    <ConfirmDialog open={confirm} title={item ? `Enviar para ${item.nome}?` : "Enviar mensagem?"} description={`${channel === "WHATSAPP" ? "WhatsApp" : "Gmail"} de ${senderName ?? ""} para ${destination ?? ""}.`}
      confirmLabel="Enviar mensagem" onCancel={() => setConfirm(false)} onConfirm={() => void send()} />
  </section>;
}
