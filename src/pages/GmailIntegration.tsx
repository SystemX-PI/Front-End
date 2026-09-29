import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import {
  InlineFeedback,
  ServiceIcon,
  StatusPill,
} from "../components/IntegrationUi";

export default function GmailIntegration() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [connectionName, setConnectionName] = useState(
    "Gmail — Notificações do sistema",
  );
  const [feedback, setFeedback] = useState("");

  function explainServerConfiguration(event: FormEvent) {
    event.preventDefault();
    setFeedback(
      "O backend atual configura o Gmail por MAIL_USERNAME e MAIL_PASSWORD. Ele ainda não oferece uma rota segura para salvar estes campos.",
    );
  }

  return (
    <IntegrationShell
      active="gmail"
      title="Gmail"
      subtitle="Configuração simples para envio de e-mails"
    >
      <section className="page-intro">
        <h2>Configurar conta Gmail</h2>
        <p>
          Informe o e-mail que fará os envios e a senha de app gerada na conta
          Google.
        </p>
      </section>

      <div className="configuration-grid gmail-grid">
        <form className="panel integration-form" onSubmit={explainServerConfiguration}>
          <div className="form-heading">
            <ServiceIcon service="gmail" tone="red" />
            <div>
              <h3>Conta de envio</h3>
              <p>
                Credenciais usadas pelos sistemas integrados para enviar mensagens.
              </p>
            </div>
          </div>

          <label className="field">
            <span>E-mail do Gmail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="notificacoes@empresa.com.br"
            />
          </label>

          <label className="field">
            <span>Senha de app</span>
            <input
              type="password"
              required
              value={appPassword}
              onChange={(event) => setAppPassword(event.target.value)}
              placeholder="•••• •••• •••• ••••"
            />
            <small>Use a senha de app criada para esta integração.</small>
          </label>

          <label className="field">
            <span>Nome da conexão</span>
            <input
              type="text"
              required
              value={connectionName}
              onChange={(event) => setConnectionName(event.target.value)}
            />
          </label>

          <div className="test-area">
            <div>
              <strong>Teste de conexão</strong>
              <p>Valide as credenciais antes de salvar.</p>
            </div>
            <button className="button secondary compact" type="submit">
              Testar conexão
            </button>
          </div>

          {feedback && <InlineFeedback message={feedback} />}

          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate("/integracoes")}
            >
              Cancelar
            </button>
            <button className="button primary" type="submit">
              Salvar configuração
            </button>
          </div>
        </form>

        <aside className="panel status-panel">
          <h3>Status</h3>
          <StatusPill tone="amber">Configuração do servidor</StatusPill>
          <h4>O que será salvo</h4>
          <ul className="feature-list">
            <li>E-mail de envio</li>
            <li>Senha de app protegida</li>
            <li>Nome da conexão</li>
            <li>Status da integração</li>
          </ul>
          <div className="tip-card">
            <strong>Uso em outros sistemas</strong>
            <p>
              Depois de configurada no backend, esta conexão é usada pelos fluxos
              que precisam enviar e-mail.
            </p>
          </div>
        </aside>
      </div>
    </IntegrationShell>
  );
}
