import { Eye, EyeOff, Save, ShieldAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import { InlineFeedback, ServiceIcon, StatusPill } from "../components/IntegrationUi";
import { getUserType } from "../services/auth";
import { backend } from "../services/backend";

type Feedback = { message: string; kind: "info" | "success" | "error" } | null;

export default function GmailIntegration() {
  const navigate = useNavigate();
  const isAdministrator = getUserType() === "ADMINISTRADOR";
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configuredEmail, setConfiguredEmail] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!isAdministrator) {
      setFeedback({
        kind: "error",
        message: "Apenas administradores podem configurar as credenciais de envio.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const response = await backend.configuration.configureEmail({
        email: email.trim(),
        senhaAplicativo: appPassword,
      });
      setConfiguredEmail(response.email);
      setAppPassword("");
      setFeedback({
        kind: "success",
        message: `Gmail ${response.email} configurado com sucesso no servidor.`,
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "Não foi possível configurar o Gmail.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <IntegrationShell active="gmail" title="Gmail" subtitle="Configuração segura para envio de e-mails">
      <section className="page-intro">
        <h2>Configurar conta Gmail</h2>
        <p>As credenciais são enviadas diretamente ao backend e mantidas apenas na memória do servidor.</p>
      </section>

      <div className="configuration-grid gmail-grid">
        <form className="panel integration-form" onSubmit={handleSave}>
          <div className="form-heading">
            <ServiceIcon service="gmail" tone="red" />
            <div>
              <h3>Conta de envio</h3>
              <p>Informe a conta que será usada nos fluxos de comunicação.</p>
            </div>
          </div>

          {!isAdministrator ? (
            <div className="permission-notice">
              <ShieldAlert size={20} />
              <div><strong>Acesso de administrador necessário</strong><p>Seu usuário pode consultar esta tela, mas não alterar as credenciais do Gmail.</p></div>
            </div>
          ) : null}

          <label className="field">
            <span>E-mail do Gmail</span>
            <input type="email" required disabled={!isAdministrator || saving} value={email}
              onChange={(event) => setEmail(event.target.value)} placeholder="notificacoes@empresa.com.br"
              autoComplete="email" />
          </label>

          <label className="field">
            <span>Senha de aplicativo</span>
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} required disabled={!isAdministrator || saving}
                value={appPassword} onChange={(event) => setAppPassword(event.target.value)}
                placeholder="•••• •••• •••• ••••" autoComplete="new-password" />
              <button type="button" disabled={!isAdministrator} onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <small>Use a senha de aplicativo gerada na Conta Google. Espaços são removidos pelo servidor.</small>
          </label>

          <div className="test-area">
            <div><strong>Configuração em tempo de execução</strong><p>Ao reiniciar o backend, as credenciais precisam ser informadas novamente.</p></div>
          </div>

          {feedback ? <InlineFeedback message={feedback.message} kind={feedback.kind} /> : null}

          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => navigate("/integracoes")}>Cancelar</button>
            <button className="button primary" type="submit" disabled={!isAdministrator || saving}>
              {saving ? <><span className="spinner" /> Salvando...</> : <><Save size={16} /> Salvar no backend</>}
            </button>
          </div>
        </form>

        <aside className="panel status-panel">
          <h3>Status</h3>
          <StatusPill tone={configuredEmail ? "green" : isAdministrator ? "amber" : "neutral"}>
            {configuredEmail ? "Configurado" : isAdministrator ? "Aguardando configuração" : "Somente leitura"}
          </StatusPill>
          <h4>Dados enviados ao backend</h4>
          <ul className="feature-list">
            <li>E-mail de envio</li>
            <li>Senha de aplicativo</li>
            <li>Autorização JWT de administrador</li>
            <li>Nenhuma senha devolvida na resposta</li>
          </ul>
          <div className="tip-card">
            <strong>{configuredEmail || "Endpoint conectado"}</strong>
            <p>Integração ativa por <code>PUT /api/configuracoes/email</code>. A senha nunca é armazenada no navegador.</p>
          </div>
        </aside>
      </div>
    </IntegrationShell>
  );
}
