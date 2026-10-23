import { Eye, EyeOff, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import IntegrationShell from "../components/IntegrationShell";
import {
  InlineFeedback,
  ServiceIcon,
  StatusPill,
} from "../components/IntegrationUi";
import { PageHeading } from "../components/DataUi";
import { notify } from "../services/notifications";
import { backend } from "../services/backend";
import { getUserType } from "../services/auth";

export default function GmailIntegration() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [configuredEmail, setConfiguredEmail] = useState("");
  const administrator = getUserType() === "ADMINISTRADOR";
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !administrator) return;
    setError("");
    const appPassword = password.replace(/\s/g, "");
    if (!/^[a-zA-Z]{16}$/.test(appPassword)) {
      setError("Informe os 16 caracteres da senha de aplicativo do Google.");
      return;
    }
    setSaving(true);
    try {
      const result = await backend.configuration.configureEmail({
        email: email.trim(),
        senhaAplicativo: appPassword,
      });
      setConfiguredEmail(result.configurado ? result.email : "");
      setPassword("");
      notify("Credenciais de e-mail configuradas com sucesso.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível configurar o Gmail.";
      setError(message);
      notify(message, "error");
    } finally {
      setSaving(false);
    }
  }
  return (
    <IntegrationShell
      active="gmail"
      title="Gmail"
      subtitle="Configuração do canal de e-mail"
    >
      <PageHeading
        eyebrow="CANAIS DE COMUNICAÇÃO"
        title="E-mails que conectam"
        description="Configure a conta remetente utilizada nas comunicações dos contemplados."
      />
      <div className="configuration-grid gmail-grid">
        <form
          className="panel integration-form"
          onSubmit={save}
          aria-busy={saving}
        >
          <div className="form-heading">
            <ServiceIcon service="gmail" tone="red" />
            <div>
              <h3>Conta remetente</h3>
              <p>Use uma senha de aplicativo gerada na sua conta Google.</p>
            </div>
          </div>
          {!administrator ? (
            <InlineFeedback message="Apenas administradores podem alterar as credenciais deste canal." />
          ) : null}
          <fieldset
            disabled={!administrator || saving}
            className="form-fieldset"
          >
            <label className="field">
              <span>E-mail do remetente</span>
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="atendimento@empresa.com"
              />
            </label>
            <label className="field" htmlFor="gmail-password">
              <span id="gmail-password-label">Senha de aplicativo</span>
              <div className="password-field">
                <input
                  id="gmail-password"
                  aria-labelledby="gmail-password-label"
                  aria-describedby="gmail-password-hint"
                  type={visible ? "text" : "password"}
                  required
                  autoComplete="off"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="16 caracteres da senha de aplicativo"
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small id="gmail-password-hint">
                A senha permanece no servidor e não é salva no navegador.
              </small>
            </label>
            {error ? <InlineFeedback kind="error" message={error} /> : null}
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : <Save size={17} />}
              {saving ? "Configurando…" : "Salvar configuração"}
            </button>
          </fieldset>
        </form>
        <aside className="panel status-panel">
          <ShieldCheck size={28} />
          <h3>Configuração protegida</h3>
          <StatusPill tone={configuredEmail ? "green" : "neutral"}>
            {configuredEmail
              ? "Configurado nesta sessão"
              : "Ainda não verificado"}
          </StatusPill>
          {configuredEmail ? <p>{configuredEmail}</p> : null}
          <ol className="setup-guide">
            <li>Ative a verificação em duas etapas na conta Google.</li>
            <li>Gere uma senha de aplicativo nas configurações da conta.</li>
            <li>Salve as credenciais e acompanhe os envios na fila.</li>
          </ol>
          <div className="subtle-note">
            <LockKeyhole size={17} />
            <span>
              Configuração em memória. Após reiniciar o servidor, pode ser
              necessário informar novamente.
            </span>
          </div>
        </aside>
      </div>
    </IntegrationShell>
  );
}
