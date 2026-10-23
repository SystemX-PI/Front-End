import { ArrowLeft, MessageCircle, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import { ServiceIcon, StatusPill } from "../components/IntegrationUi";

export default function WhatsAppIntegration() {
  const navigate = useNavigate();

  return (
    <IntegrationShell
      active="whatsapp"
      title="WhatsApp"
      subtitle="Estado e limitações da integração"
    >
      <section className="page-intro">
        <h2>Integração com WhatsApp</h2>
        <p>
          O front-end não possui operações para criar instâncias, consultar
          conexão ou gerar QR Code. Nenhum estado de conexão pode ser confirmado
          nesta tela.
        </p>
      </section>

      <div className="configuration-grid whatsapp-grid">
        <section className="panel integration-form">
          <div className="form-heading">
            <ServiceIcon service="whatsapp" tone="green" />
            <div>
              <h3>Envio de mensagens</h3>
              <p>
                O serviço do front-end possui uma chamada de envio para um
                processo existente. A conexão e a instância são configuradas
                pelo backend.
              </p>
            </div>
          </div>

          <div className="permission-notice">
            <ShieldAlert size={20} />
            <div>
              <strong>Configuração não disponível nesta interface</strong>
              <p>
                A criação da instância, a geração de QR Code e a confirmação de
                conexão dependem de operações do backend que não estão
                implementadas no front-end.
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate("/integracoes")}
            >
              <ArrowLeft size={16} />
              Voltar às integrações
            </button>
            <button className="button primary" type="button" disabled>
              <MessageCircle size={16} />
              Conexão não disponível
            </button>
          </div>
        </section>

        <aside className="panel status-panel">
          <h3>Status da conexão</h3>
          <StatusPill tone="neutral">Não consultado</StatusPill>
          <h4>O que já existe no front-end</h4>
          <ul className="feature-list">
            <li>Chamada de envio de WhatsApp associada a um processo</li>
            <li>Configuração da instância mantida no backend</li>
            <li>Sem QR Code ou indicador de conexão nesta interface</li>
          </ul>
        </aside>
      </div>
    </IntegrationShell>
  );
}
