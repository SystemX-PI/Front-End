import { ArrowRight, CheckCircle2, LockKeyhole, PlugZap, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import { ServiceIcon, StatusPill } from "../components/IntegrationUi";

const services = [
  {
    title: "Gmail",
    description: "Envio de e-mails usando conta configurada com senha de app.",
    service: "gmail" as const,
    iconTone: "red" as const,
    status: "Configuração do servidor",
    statusTone: "red" as const,
    action: "Configurar Gmail",
    to: "/integracoes/gmail",
  },
  {
    title: "WhatsApp",
    description: "Conexão por instância com autenticação via QR Code.",
    service: "whatsapp" as const,
    iconTone: "green" as const,
    status: "Configuração do servidor",
    statusTone: "green" as const,
    action: "Conectar WhatsApp",
    to: "/integracoes/whatsapp",
  },
  {
    title: "Notificações",
    description: "Visualize quais eventos podem gerar mensagens ou e-mails.",
    service: "notifications" as const,
    iconTone: "purple" as const,
    status: "Consultar",
    statusTone: "purple" as const,
    action: "Abrir notificações",
    to: "/integracoes/notificacoes",
    secondary: true,
  },
];

export default function IntegrationsOverview() {
  const navigate = useNavigate();

  return (
    <IntegrationShell
      active="overview"
      title="Visão geral"
      subtitle="Conecte serviços externos sem depender do sistema principal"
    >
      <section className="page-intro intro-with-badge">
        <div>
          <span className="eyebrow"><PlugZap size={14} /> CENTRAL DE CONEXÕES</span>
          <h2>Integrações disponíveis</h2>
          <p>Configure cada serviço uma vez e reutilize a conexão com segurança.</p>
        </div>
        <div className="overview-health"><span /><div><strong>Serviços operacionais</strong><small>Backend e banco conectados</small></div></div>
      </section>

      <section className="metric-grid" aria-label="Resumo das integrações">
        <div className="metric-card"><Workflow size={19} /><span><strong>3</strong><small>Módulos disponíveis</small></span></div>
        <div className="metric-card"><LockKeyhole size={19} /><span><strong>JWT</strong><small>Autenticação segura</small></span></div>
        <div className="metric-card"><CheckCircle2 size={19} /><span><strong>6</strong><small>Migrações aplicadas</small></span></div>
      </section>

      <section className="service-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <div className="service-card-top">
              <ServiceIcon service={service.service} tone={service.iconTone} />
              <span className="service-index">0{services.indexOf(service) + 1}</span>
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <div className="service-card-footer">
              <StatusPill tone={service.statusTone}>{service.status}</StatusPill>
              <button
                type="button"
                className={service.secondary ? "button secondary" : "button primary"}
                onClick={() => navigate(service.to)}
              >
                {service.action}<ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="panel how-it-works">
        <div className="section-heading"><div><span className="eyebrow">FLUXO SIMPLIFICADO</span><h3>Como funciona</h3></div><p>Do cadastro ao envio em quatro etapas.</p></div>
        <div className="step-grid">
          {[
            "Configure Gmail ou WhatsApp",
            "Teste a conexão",
            "Salve a integração no servidor",
            "Outros sistemas reutilizam a configuração",
          ].map((step, index) => (
            <div className="step-card" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="security-card">
        <h3>Segurança da configuração</h3>
        <p>
          As credenciais ficam protegidas no backend e não são armazenadas no
          navegador. Esta interface representa o fluxo visual do módulo.
        </p>
        <strong>
          Gmail: senha de app • WhatsApp: Evolution API e instância configurada
          no servidor
        </strong>
      </section>
    </IntegrationShell>
  );
}
