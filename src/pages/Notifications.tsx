import IntegrationShell from "../components/IntegrationShell";
import { StatusPill } from "../components/IntegrationUi";

const rules = [
  { event: "Novo processo criado", email: true, whatsapp: true, active: true },
  { event: "Pendência identificada", email: true, whatsapp: true, active: true },
  {
    event: "Prazo próximo do vencimento",
    email: true,
    whatsapp: true,
    active: true,
  },
  { event: "Falha de integração", email: true, whatsapp: false, active: true },
  { event: "Resumo diário", email: true, whatsapp: false, active: false },
];

export default function Notifications() {
  return (
    <IntegrationShell
      active="notifications"
      title="Notificações"
      subtitle="Escolha quais eventos podem disparar e-mail ou WhatsApp"
    >
      <section className="page-intro">
        <h2>Configurar notificações</h2>
        <p>
          Use as integrações salvas para definir como os sistemas devem notificar
          usuários.
        </p>
      </section>

      <section className="panel channels-panel">
        <h3>Canais disponíveis</h3>
        <div>
          <StatusPill tone="amber">Gmail • Configuração do servidor</StatusPill>
          <StatusPill tone="amber">WhatsApp • Configuração do servidor</StatusPill>
          <p>Configure os canais no backend antes de ativar automações.</p>
        </div>
      </section>

      <section className="panel rules-panel">
        <h3>Eventos de notificação</h3>
        <p>Cada sistema integrado pode reutilizar essas regras.</p>
        <div className="rules-table" role="table" aria-label="Eventos de notificação">
          <div className="rules-head" role="row">
            <span>Evento</span>
            <span>E-mail</span>
            <span>WhatsApp</span>
            <span>Status</span>
          </div>
          {rules.map((rule) => (
            <div className="rule-row" role="row" key={rule.event}>
              <strong>{rule.event}</strong>
              <StatusPill tone="red">Gmail</StatusPill>
              <StatusPill tone={rule.whatsapp ? "green" : "neutral"}>
                {rule.whatsapp ? "WhatsApp" : "—"}
              </StatusPill>
              <StatusPill tone={rule.active ? "green" : "neutral"}>
                {rule.active ? "Ativo" : "Inativo"}
              </StatusPill>
            </div>
          ))}
        </div>
      </section>

      <section className="prototype-note">
        <h3>Objetivo do protótipo</h3>
        <p>
          Representar a configuração das integrações. O backend atual executa os
          envios quando recebe uma contemplação ou um pedido de reenvio.
        </p>
      </section>
    </IntegrationShell>
  );
}
