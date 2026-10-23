import { ArrowRight, BellRing, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import { backend, type ContemplationRequest, type IntegrationResponse } from "../services/backend";

type Feedback = { message: string; kind: "info" | "success" | "error" } | null;

const initialPayload = (): ContemplationRequest => ({
  origem: "",
  idExterno: "",
  nome: "",
  email: "",
  telefone: "",
  cotaId: Number.NaN,
  assembleiaId: Number.NaN,
  dataContemplacao: "",
  tipo: "SORTEIO",
  valorCredito: Number.NaN,
});

export default function Notifications() {
  const [payload, setPayload] = useState<ContemplationRequest>(initialPayload);
  const [integrationKey, setIntegrationKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [result, setResult] = useState<IntegrationResponse | null>(null);

  function updatePayload<K extends keyof ContemplationRequest>(
    field: K,
    value: ContemplationRequest[K],
  ) {
    setPayload((current) => ({ ...current, [field]: value }));
  }

  async function handleReceive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback(null);
    setResult(null);
    try {
      const response = await backend.integrations.receiveContemplation(
        payload,
        integrationKey.trim(),
      );
      setResult(response);
      setFeedback({
        kind: response.jaExistia ? "info" : "success",
        message: response.jaExistia
          ? `O backend informou que o evento ${response.idExterno} já existia.`
          : `O backend aceitou o evento e retornou o processo #${response.processoId}. Isso não confirma a entrega de uma comunicação.`,
      });
      if (!response.jaExistia) setPayload(initialPayload());
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a contemplação ao backend.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <IntegrationShell
      active="notifications"
      title="Notificações"
      subtitle="Recebimento de eventos de contemplação e comunicação"
    >
      <section className="notification-hero">
        <div>
          <span className="eyebrow"><BellRing size={14} /> INTEGRAÇÃO DE EVENTOS</span>
          <h2>Receber contemplação</h2>
          <p>
            O backend aceita eventos externos. Não há endpoint de listagem da
            fila no serviço disponível.
          </p>
        </div>
        <StatusPill tone="neutral">Sem consulta de fila</StatusPill>
      </section>

      <InlineFeedback
        kind="info"
        message="Após receber um evento, use a tela Contemplados para consultar o processo pelo ID retornado e solicitar comunicação individual. O backend não expõe uma fila agregada."
      />

      <form className="panel partner-form" onSubmit={handleReceive}>
        <div className="partner-form-heading">
          <div>
            <span className="eyebrow">ENTRADA DO SISTEMA PARCEIRO</span>
            <h3>Dados do contemplado</h3>
            <p>
              A solicitação é enviada para <code>POST /api/integracoes/contemplacoes</code>.
            </p>
          </div>
          <StatusPill tone="blue">Chave exigida pelo backend</StatusPill>
        </div>

        <div className="partner-form-grid">
          <label className="field">
            <span>Origem</span>
            <input required value={payload.origem} onChange={(event) => updatePayload("origem", event.target.value)} />
          </label>
          <label className="field">
            <span>ID externo</span>
            <input required value={payload.idExterno} onChange={(event) => updatePayload("idExterno", event.target.value)} />
          </label>
          <label className="field span-2">
            <span>Nome do contemplado</span>
            <input required value={payload.nome} onChange={(event) => updatePayload("nome", event.target.value)} />
          </label>
          <label className="field">
            <span>E-mail do contemplado</span>
            <input type="email" required value={payload.email} onChange={(event) => updatePayload("email", event.target.value)} />
          </label>
          <label className="field">
            <span>Telefone</span>
            <input value={payload.telefone} onChange={(event) => updatePayload("telefone", event.target.value)} />
          </label>
          <label className="field">
            <span>ID da cota</span>
            <input type="number" min="1" step="1" required value={Number.isNaN(payload.cotaId) ? "" : payload.cotaId} onChange={(event) => updatePayload("cotaId", event.target.value ? Number(event.target.value) : Number.NaN)} />
          </label>
          <label className="field">
            <span>ID da assembleia</span>
            <input type="number" min="1" step="1" required value={Number.isNaN(payload.assembleiaId) ? "" : payload.assembleiaId} onChange={(event) => updatePayload("assembleiaId", event.target.value ? Number(event.target.value) : Number.NaN)} />
          </label>
          <label className="field">
            <span>Data da contemplação</span>
            <input type="date" required value={payload.dataContemplacao} onChange={(event) => updatePayload("dataContemplacao", event.target.value)} />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select value={payload.tipo} onChange={(event) => updatePayload("tipo", event.target.value as ContemplationRequest["tipo"])}>
              <option value="SORTEIO">Sorteio</option>
              <option value="LANCE">Lance</option>
            </select>
          </label>
          <label className="field">
            <span>Valor do crédito</span>
            <input type="number" min="0" step="0.01" required value={Number.isNaN(payload.valorCredito) ? "" : payload.valorCredito} onChange={(event) => updatePayload("valorCredito", event.target.value ? Number(event.target.value) : Number.NaN)} />
          </label>
          <label className="field">
            <span>Chave de integração</span>
            <input type="password" required autoComplete="off" value={integrationKey} onChange={(event) => setIntegrationKey(event.target.value)} />
          </label>
        </div>

        {feedback ? <InlineFeedback kind={feedback.kind} message={feedback.message} /> : null}

        {result ? (
          <div className="communication-result" aria-live="polite">
            <strong>Resposta da integração</strong>
            <span>Processo: #{result.processoId}</span>
            <span>Status do processo: {result.statusProcesso}</span>
            <span>Status da comunicação: {result.statusComunicacao ?? "Não informado"}</span>
            <span>Evento já existia: {result.jaExistia ? "Sim" : "Não"}</span>
          </div>
        ) : null}

        <div className="partner-form-actions">
          <p>A resposta confirma o recebimento do evento, não a entrega de e-mail ou WhatsApp.</p>
          <button className="button primary" type="submit" disabled={submitting}>
            <Plus size={16} aria-hidden="true" />
            {submitting ? "Enviando..." : "Enviar contemplação"}
          </button>
        </div>
      </form>

      <Link className="notification-process-link" to="/admin/contemplados">
        Consultar processo existente
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </IntegrationShell>
  );
}
