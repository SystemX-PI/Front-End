import { QrCode, RefreshCw, Smartphone } from "lucide-react";
import { useState, type FormEvent } from "react";
import IntegrationShell from "../components/IntegrationShell";
import {
  InlineFeedback,
  ServiceIcon,
  StatusPill,
} from "../components/IntegrationUi";
import { PageHeading } from "../components/DataUi";
import { notify } from "../services/notifications";
import { backend, type EvolutionStatusResponse } from "../services/backend";
import { getUserType } from "../services/auth";

const states: Record<string, string> = {
  open: "Conectado",
  connecting: "Aguardando leitura",
  close: "Desconectado",
  closed: "Desconectado",
  not_created: "Instância não criada",
};
export default function WhatsAppIntegration() {
  const [instance, setInstance] = useState("consorcio");
  const [result, setResult] = useState<EvolutionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const administrator = getUserType() === "ADMINISTRADOR";
  async function connect(generate: boolean) {
    if (loading || !administrator) return;
    if (!/^[A-Za-z0-9_-]{1,60}$/.test(instance)) {
      setError(
        "Use de 1 a 60 letras, números, hífen ou sublinhado no nome da instância.",
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = generate
        ? await backend.whatsapp.generateQr(instance)
        : await backend.whatsapp.status(instance);
      setResult((current) =>
        !generate &&
        response.state === "connecting" &&
        current?.instanceName === instance
          ? { ...response, qrCode: current.qrCode }
          : response,
      );
      if (response.state === "open")
        notify("WhatsApp conectado com sucesso.", "success");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível consultar a conexão.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void connect(true);
  }
  const qr = result?.qrCode?.startsWith("data:image/") ? result.qrCode : null;
  return (
    <IntegrationShell
      active="whatsapp"
      title="WhatsApp"
      subtitle="Conecte seu canal de atendimento à Evolution API"
    >
      <PageHeading
        eyebrow="CANAIS DE COMUNICAÇÃO"
        title="Conversas mais próximas"
        description="Vincule uma instância e acompanhe a conexão do seu WhatsApp."
      />
      <div className="configuration-grid whatsapp-grid">
        <form
          className="panel integration-form"
          onSubmit={submit}
          aria-busy={loading}
        >
          <div className="form-heading">
            <ServiceIcon service="whatsapp" tone="green" />
            <div>
              <h3>Conectar aparelho</h3>
              <p>O QR Code é gerado pela Evolution API da sua operação.</p>
            </div>
          </div>
          {!administrator ? (
            <InlineFeedback message="A configuração e consulta da conexão estão disponíveis para administradores." />
          ) : null}
          <label className="field">
            <span>Nome da instância</span>
            <input
              required
              maxLength={60}
              pattern="[A-Za-z0-9_\-]{1,60}"
              value={instance}
              disabled={loading || !administrator}
              onChange={(event) => {
                setInstance(event.target.value);
                setResult(null);
              }}
            />
            <small>
              Use o mesmo nome da instância configurada para os envios no
              servidor.
            </small>
          </label>
          <ol className="setup-guide">
            <li>Gere o QR Code para a instância.</li>
            <li>No WhatsApp, abra Aparelhos conectados.</li>
            <li>Toque em Conectar aparelho e escaneie o código.</li>
            <li>Atualize o status para confirmar a conexão.</li>
          </ol>
          {error ? <InlineFeedback kind="error" message={error} /> : null}
          <div className="split-actions">
            <button
              className="button primary"
              disabled={loading || !administrator}
              type="submit"
            >
              {loading ? <span className="spinner" /> : <QrCode size={17} />}
              Gerar QR Code
            </button>
            <button
              className="button secondary"
              disabled={loading || !administrator}
              type="button"
              onClick={() => void connect(false)}
            >
              <RefreshCw size={16} />
              Consultar status
            </button>
          </div>
        </form>
        <aside className="panel qr-panel">
          <h3>Conexão do aparelho</h3>
          <StatusPill tone={result?.state === "open" ? "green" : "amber"}>
            {result
              ? states[result.state] || "Status desconhecido"
              : "Não consultado"}
          </StatusPill>
          <div className="qr-stage">
            {qr ? (
              <img
                src={qr}
                alt={`QR Code de conexão da instância ${result?.instanceName}`}
              />
            ) : (
              <>
                <Smartphone size={52} />
                <strong>
                  {result?.state === "open"
                    ? "Aparelho conectado"
                    : "Pronto para conectar"}
                </strong>
                <p>Gere um código para vincular seu WhatsApp.</p>
              </>
            )}
          </div>
          {result?.pairingCode ? (
            <p>
              Código de pareamento: <strong>{result.pairingCode}</strong>
            </p>
          ) : null}
          <p className="qr-caption">
            Se o código expirar, gere um novo e repita a leitura.
          </p>
        </aside>
      </div>
    </IntegrationShell>
  );
}
