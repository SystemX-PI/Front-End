import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import {
  InlineFeedback,
  ServiceIcon,
  StatusPill,
} from "../components/IntegrationUi";

const qrCells = Array.from({ length: 225 }, (_, index) => {
  const row = Math.floor(index / 15);
  const column = index % 15;
  const finder =
    ((row < 5 || row > 9) && (column < 5 || column > 9)) ||
    (row >= 5 && row <= 9 && column >= 5 && column <= 9);
  return finder || (row * 3 + column * 5 + index) % 7 < 3;
});

export default function WhatsAppIntegration() {
  const navigate = useNavigate();
  const [instance, setInstance] = useState("consorcio");
  const [description, setDescription] = useState(
    "WhatsApp principal para notificações automáticas.",
  );
  const [feedback, setFeedback] = useState("");

  function explainServerConfiguration(event: FormEvent) {
    event.preventDefault();
    setFeedback(
      "O backend usa a instância definida por EVOLUTION_INSTANCE. A rota atual envia mensagens, mas não cria instâncias nem gera QR Code.",
    );
  }

  return (
    <IntegrationShell
      active="whatsapp"
      title="WhatsApp"
      subtitle="Crie uma instância e conecte o aparelho pelo QR Code"
    >
      <section className="page-intro">
        <h2>Conectar WhatsApp</h2>
        <p>
          Defina um nome para a instância, gere o QR Code e faça a leitura pelo
          WhatsApp do aparelho.
        </p>
      </section>

      <div className="configuration-grid whatsapp-grid">
        <form className="panel integration-form" onSubmit={explainServerConfiguration}>
          <div className="form-heading">
            <ServiceIcon service="whatsapp" tone="green" />
            <div>
              <h3>Nova instância</h3>
              <p>
                A instância identifica qual conexão será usada pelos outros sistemas.
              </p>
            </div>
          </div>

          <label className="field">
            <span>Nome da instância</span>
            <input
              type="text"
              value={instance}
              onChange={(event) => setInstance(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Descrição</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="connection-steps">
            <strong>Etapas da conexão</strong>
            {[
              "Criar a instância",
              "Gerar QR Code",
              "Ler com o WhatsApp",
              "Confirmar conexão",
            ].map((step, index) => (
              <div className={index === 0 ? "connection-step active" : "connection-step"} key={step}>
                <span />
                {index + 1}. {step}
              </div>
            ))}
          </div>

          {feedback && <InlineFeedback message={feedback} />}

          <div className="split-actions">
            <button className="button primary" type="submit">
              Gerar QR Code
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate("/integracoes")}
            >
              Cancelar
            </button>
          </div>
        </form>

        <aside className="panel qr-panel">
          <h3>QR Code de conexão</h3>
          <StatusPill tone="amber">Aguardando configuração</StatusPill>
          <div className="qr-placeholder" aria-label="Prévia ilustrativa do QR Code">
            {qrCells.map((active, index) => (
              <span className={active ? "filled" : ""} key={index} />
            ))}
          </div>
          <p className="qr-caption">
            Aponte a câmera do WhatsApp para este QR Code quando ele for gerado
            pela Evolution API.
          </p>
          <div className="success-tip">
            <strong>Depois da leitura</strong>
            <p>
              O status muda para Conectado e a instância fica disponível para os
              outros sistemas.
            </p>
          </div>
        </aside>
      </div>
    </IntegrationShell>
  );
}
