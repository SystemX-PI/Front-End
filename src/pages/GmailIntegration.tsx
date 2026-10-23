import { ServerCog, ShieldAlert } from "lucide-react";
import IntegrationShell from "../components/IntegrationShell";
import { InlineFeedback, ServiceIcon, StatusPill } from "../components/IntegrationUi";

export default function GmailIntegration() {
  return (
    <IntegrationShell
      active="gmail"
      title="Gmail"
      subtitle="Estado e configuração da integração de e-mail"
    >
      <section className="page-intro">
        <h2>Envio de e-mail pelo servidor</h2>
        <p>
          A API disponível não oferece uma rota para editar ou consultar as
          credenciais do Gmail pela interface.
        </p>
      </section>

      <div className="configuration-grid gmail-grid">
        <section className="panel integration-form">
          <div className="form-heading">
            <ServiceIcon service="gmail" tone="red" />
            <div>
              <h3>Configuração no backend</h3>
              <p>
                O serviço de e-mail lê sua configuração a partir do ambiente do
                servidor. Nenhuma senha deve ser solicitada ou enviada por esta
                tela.
              </p>
            </div>
          </div>

          <div className="permission-notice">
            <ShieldAlert size={20} aria-hidden="true" />
            <div>
              <strong>Configuração via interface indisponível</strong>
              <p>
                O backend implementa envio com Gmail, mas não expõe endpoint de
                configuração nem consulta de conexão no contrato disponível.
              </p>
            </div>
          </div>

          <div className="test-area">
            <ServerCog size={19} aria-hidden="true" />
            <div>
              <strong>Variáveis no servidor</strong>
              <p>
                O serviço usa `MAIL_ENABLED`, `MAIL_USERNAME` e `MAIL_PASSWORD`
                no ambiente do backend. Configure segredos somente no ambiente
                protegido do servidor.
              </p>
            </div>
          </div>
        </section>

        <aside className="panel status-panel">
          <h3>Status</h3>
          <StatusPill tone="neutral">Não consultado pela API</StatusPill>
          <h4>O que está implementado</h4>
          <ul className="feature-list">
            <li>Envio de e-mail realizado pelo backend</li>
            <li>Credenciais mantidas na configuração do servidor</li>
            <li>Sem teste ou confirmação de conexão nesta interface</li>
          </ul>
          <InlineFeedback
            kind="info"
            message="O endpoint PUT /api/configuracoes/email usado anteriormente não existe nos controladores do backend disponível e foi removido do front-end."
          />
        </aside>
      </div>
    </IntegrationShell>
  );
}
