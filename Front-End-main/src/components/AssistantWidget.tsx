import { useState, type FormEvent } from "react";
import { Bot, Send, X } from "lucide-react";
import { getUserType, isAuthenticated } from "../services/auth";
import { assistant, type AssistantAction } from "../services/backend";

type Message = { author: "user" | "assistant"; text: string };

export default function AssistantWidget() {
  const allowed = isAuthenticated() && ["ADMINISTRADOR", "FUNCIONARIO"].includes(getUserType() || "");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ author: "assistant", text: "Olá! Posso consultar um processo ou preparar uma notificação de WhatsApp para sua confirmação." }]);
  const [action, setAction] = useState<AssistantAction | null>(null);

  if (!allowed) return null;
  async function send(event: FormEvent) {
    event.preventDefault(); const question = text.trim(); if (!question || busy) return;
    setMessages((current) => [...current, { author: "user", text: question }]); setText(""); setAction(null); setBusy(true);
    try { const response = await assistant.message(question); setMessages((current) => [...current, { author: "assistant", text: response.mensagem }]); setAction(response.acao); }
    catch (error) { setMessages((current) => [...current, { author: "assistant", text: error instanceof Error ? error.message : "Não foi possível falar com o assistente." }]); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!action || busy) return; setBusy(true);
    try { const result = await assistant.confirm(action.token); setMessages((current) => [...current, { author: "assistant", text: `Notificação processada. Status: ${result.statusGeral}.` }]); setAction(null); }
    catch (error) { setMessages((current) => [...current, { author: "assistant", text: error instanceof Error ? error.message : "Não foi possível confirmar a ação." }]); }
    finally { setBusy(false); }
  }
  return <aside style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1000, width: open ? 360 : "auto", fontFamily: "inherit" }}>
    {open ? <section style={{ background: "#fff", border: "1px solid #d7dce5", borderRadius: 16, boxShadow: "0 12px 35px #0003", overflow: "hidden" }} aria-label="Assistente operacional">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#13213c", color: "#fff" }}><strong><Bot size={18} style={{ verticalAlign: "middle" }} /> Assistente SystemX</strong><button type="button" onClick={() => setOpen(false)} aria-label="Fechar assistente" style={{ color: "inherit", background: "transparent", border: 0 }}><X /></button></header>
      <div style={{ height: 300, overflowY: "auto", padding: 12, display: "grid", gap: 8 }}>{messages.map((message, index) => <p key={index} style={{ margin: 0, padding: 10, borderRadius: 10, whiteSpace: "pre-wrap", background: message.author === "user" ? "#e4efff" : "#f4f6f8" }}>{message.text}</p>)}</div>
      {action ? <div style={{ margin: 12, padding: 12, border: "1px solid #e0b84f", borderRadius: 10, background: "#fff9e6" }}><strong>Confirme antes de enviar</strong><p>Processo #{action.processoId}<br />{action.telefone}</p><p>{action.mensagem}</p><button type="button" disabled={busy} onClick={() => void confirm()} className="button primary">Confirmar envio</button></div> : null}
      <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e7e9ed" }}><input value={text} maxLength={2000} onChange={(event) => setText(event.target.value)} placeholder="Ex.: consulte o processo 10" aria-label="Mensagem ao assistente" style={{ flex: 1, minWidth: 0 }} /><button type="submit" disabled={busy} className="button primary" aria-label="Enviar mensagem"><Send size={16} /></button></form>
    </section> : null}
    <button type="button" onClick={() => setOpen((value) => !value)} className="button primary" style={{ float: "right", borderRadius: 999 }}>{open ? "Fechar" : <><Bot size={18} /> Assistente</>}</button>
  </aside>;
}
