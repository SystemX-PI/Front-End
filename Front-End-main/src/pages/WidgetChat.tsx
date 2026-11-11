import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import "./widget-chat.css";

type Summary = { empresa: string; total: number; aceitas: number; pendentes: number; falhas: number };
type Message = { role: "chat" | "user"; text: string };
const examples = ["Resumo de hoje", "WhatsApp nos últimos 7 dias", "Gmail nos últimos 30 dias"];

export default function WidgetChat() {
  const parentOrigin = new URLSearchParams(location.search).get("parent") ?? "";
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!/^https?:\/\/[^/]+$/.test(parentOrigin) || window.parent === window) return;
    const receive = (event: MessageEvent) => {
      if (event.source === window.parent && event.origin === parentOrigin && event.data?.type === "systemx:session"
          && typeof event.data.token === "string") setSession(event.data.token);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "systemx:ready" }, parentOrigin);
    return () => window.removeEventListener("message", receive);
  }, [parentOrigin]);

  useEffect(() => {
    const panel = transcript.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages]);

  async function ask(text: string) {
    const value = text.trim();
    if (!value || !session || busy) return;
    setQuestion("");
    setMessages((old) => [...old.slice(-39), { role: "user", text: value }]);
    const input = value.toLowerCase();
    const channel = input.includes("whatsapp") ? "whatsapp" : /gmail|e-mail|email/.test(input) ? "gmail" : "todos";
    const days = /\b30\b/.test(input) ? 30 : /\b7\b/.test(input) ? 7 : 1;
    const supported = /resumo|notifica|envio|whatsapp|gmail|email|e-mail/.test(input);
    if (!supported) {
      setMessages((old) => [...old, { role: "chat", text: "Posso consultar os envios de hoje ou dos últimos 7 ou 30 dias. Experimente “Resumo de hoje” ou escolha um canal." }]);
      return;
    }
    setBusy(true);
    let answer: string;
    try {
      const response = await fetch("/api/widget/chat", {
        method: "POST", cache: "no-store", credentials: "omit",
        headers: { "Content-Type": "application/json", "X-Widget-Session": session },
        body: JSON.stringify({ origin: parentOrigin, channel, days }),
      });
      if (response.status === 401) {
        setSession("");
        window.parent.postMessage({ type: "systemx:ready" }, parentOrigin);
        throw new Error("Sessão expirada. Aguarde a reconexão e envie sua consulta novamente.");
      }
      if (response.status === 403) throw new Error("O chat requer um plano Profissional ativo.");
      if (!response.ok) throw new Error("Não foi possível consultar os envios. Tente novamente.");
      const data: Summary = await response.json();
      const period = days === 1 ? "Hoje" : `Últimos ${days} dias`;
      const label = { todos: "Todos os canais", whatsapp: "WhatsApp", gmail: "Gmail" }[channel];
      answer = `${data.empresa} · ${period} · ${label}\n${data.total} notificações · ${data.aceitas} aceitas · ${data.pendentes} pendentes · ${data.falhas} com falha.`;
    } catch (err) {
      answer = err instanceof Error ? err.message : "Não foi possível consultar os envios.";
    } finally {
      setBusy(false);
    }
    setMessages((old) => [...old, { role: "chat", text: answer }]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return <main className="partner-chat">
    <header><MessageCircle size={21} /><div><h1>Notificações SystemX</h1><p>Chat de consulta</p></div></header>
    <div className="partner-transcript" role="log" aria-label="Conversa" ref={transcript}>
      <p>Olá! Consulte o volume e a situação dos envios. Escolha um atalho ou escreva sua consulta.</p>
      {messages.map(({ role, text }, index) => <p className={role} key={index}>{text}</p>)}
      {busy && <p>Consultando…</p>}
    </div>
    <div className="partner-prompts" aria-label="Consultas rápidas">
      {examples.map((example) => <button key={example} disabled={!session || busy}
        onClick={() => void ask(example)}>{example}</button>)}
    </div>
    <form onSubmit={submit}>
      <input aria-label="Consulta de notificações" maxLength={160} value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder={session ? "Escreva sua consulta" : "Aguardando conexão…"} disabled={!session} />
      <button aria-label="Enviar consulta" disabled={!session || busy || !question.trim()}><Send size={18} /></button>
    </form>
  </main>;
}
