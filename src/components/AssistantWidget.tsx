import { useState, type FormEvent, useEffect, useRef } from "react";
import { Bot, Send, X, Sparkles, AlertCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ApiError } from "../services/http";
import { getUserType, isAuthenticated } from "../services/auth";
import { assistant, type AssistantAction } from "../services/backend";

type Message = { author: "user" | "assistant"; text: string };

export default function AssistantWidget() {
  useLocation();
  const allowed = isAuthenticated() && ["ADMINISTRADOR", "FUNCIONARIO"].includes(getUserType() || "");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      author: "assistant",
      text: "Olá! Sou o Assistente IA do ConsorTech. Posso consultar processos, cotas ou preparar uma notificação de WhatsApp para sua validação.",
    },
  ]);
  const [unavailable, setUnavailable] = useState(false);
  const [action, setAction] = useState<AssistantAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  if (!allowed) return null;

  async function send(event: FormEvent) {
    event.preventDefault();
    const question = text.trim();
    if (!question || busy) return;

    setMessages((current) => [...current, { author: "user", text: question }]);
    setText("");
    setAction(null);
    setBusy(true);

    try {
      const response = await assistant.message(question);
      setUnavailable(false);
      const replyText =
        typeof response?.mensagem === "string" && response.mensagem.trim()
          ? response.mensagem
          : "O assistente não retornou uma resposta válida para esta consulta.";
      setMessages((current) => [...current, { author: "assistant", text: replyText }]);
      setAction(response?.acao ?? null);
    } catch (error) {
      const providerUnavailable = error instanceof ApiError && [502, 503, 504].includes(error.status);
      setUnavailable(providerUnavailable);
      setMessages((current) => [
        ...current,
        {
          author: "assistant",
          text: providerUnavailable
            ? "O chat por IA está indisponível. Use os atalhos abaixo para continuar sua operação."
            : error instanceof Error ? error.message : "Não foi possível conectar ao assistente no momento.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!action || busy) return;
    setBusy(true);
    try {
      const result = await assistant.confirm(action.token);
      setMessages((current) => [
        ...current,
        { author: "assistant", text: result.whatsapp?.status === "SUCESSO"
          ? "O WhatsApp aceitou a mensagem. Consulte o histórico do processo."
          : result.whatsapp?.estadoDespacho === "NA_FILA" || result.whatsapp?.estadoDespacho === "EM_ENVIO"
            ? "Solicitação na fila. Consulte o histórico do processo para acompanhar."
            : result.whatsapp?.erro || "O envio não foi confirmado pelo WhatsApp. Consulte o histórico do processo." },
      ]);
      setAction(null);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { author: "assistant", text: error instanceof Error ? error.message : "Falha ao confirmar o disparo." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="assistant-enterprise-bubble">
      {open ? (
        <section className="assistant-chat-window" aria-label="Assistente Inteligente ConsorTech">
          <header className="assistant-header">
            <strong>
              <Sparkles size={17} style={{ color: "#60a5fa" }} /> Assistente ConsorTech
            </strong>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar assistente"
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </header>

          {unavailable && (
            <nav className="assistant-shortcuts" aria-label="Atalhos de operação">
              <Link to="/admin/contemplados" onClick={() => setOpen(false)}>Consultar processos</Link>
              <Link to="/admin/comunicacao" onClick={() => setOpen(false)}>Ver comunicações</Link>
              <Link to="/admin/disparo-manual" onClick={() => setOpen(false)}>Disparo manual</Link>
            </nav>
          )}
          <div className="assistant-messages" role="log" aria-label="Conversa">
            {messages.map((message, index) => (
              <div key={index} className={`assistant-bubble-msg ${message.author}`}>
                {message.text}
              </div>
            ))}
            {busy && (
              <div className="assistant-bubble-msg assistant" style={{ fontStyle: "italic", opacity: 0.8 }}>
                Consultando dados no sistema...
              </div>
            )}

            {action ? (
              <div style={{ margin: "6px 0", padding: "12px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                <strong style={{ display: "flex", alignItems: "center", gap: 6, color: "#f59e0b", fontSize: 13 }}>
                  <AlertCircle size={15} /> Ação de Disparo Pronta
                </strong>
                <p style={{ margin: "6px 0", fontSize: 12, color: "var(--text)" }}>
                  <strong>Processo #{action.processoId}</strong> · {action.telefone}
                  <br />
                  <em>{action.mensagem}</em>
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirm()}
                  className="button primary"
                  style={{ width: "100%", minHeight: 34, fontSize: 12, marginTop: 4 }}
                >
                  Confirmar e Disparar
                </button>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={send} className="assistant-input-area">
            <input
              value={text}
              maxLength={2000}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ex: Qual o status do processo 1?"
              aria-label="Mensagem ao assistente"
            />
            <button type="submit" disabled={busy || !text.trim()} aria-label="Enviar mensagem">
              <Send size={16} />
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="assistant-trigger-button"
        aria-label={open ? "Fechar assistente" : "Abrir assistente IA"}
        aria-expanded={open}
      >
        <Bot size={19} />
        <span>{open ? "Fechar" : "Assistente IA"}</span>
      </button>
    </aside>
  );
}
