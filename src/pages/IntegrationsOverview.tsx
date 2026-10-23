import { ArrowRight, CheckCircle2, LockKeyhole, PlugZap, Workflow } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntegrationShell from "../components/IntegrationShell";
import { ServiceIcon, StatusPill } from "../components/IntegrationUi";

const services = [
	{
		title: "Gmail",
		description:
			"Envio de e-mail configurado no servidor. O backend não oferece edição de credenciais nesta interface.",
		service: "gmail" as const,
		iconTone: "red" as const,
		status: "Configuração no servidor",
		statusTone: "neutral" as const,
		action: "Configurar Gmail",
		to: "/integracoes/gmail",
	},
	{
		title: "WhatsApp",
		description:
			"Conexão para envio de mensagens e acompanhamento de eventos operacionais.",
		service: "whatsapp" as const,
		iconTone: "green" as const,
		status: "Configuração no servidor",
		statusTone: "neutral" as const,
		action: "Ver detalhes",
		to: "/integracoes/whatsapp",
	},
	{
		title: "Notificações",
		description:
			"Consulta da fila de contemplados e do status das comunicações pendentes.",
		service: "notifications" as const,
		iconTone: "purple" as const,
		status: "Consultar fila",
		statusTone: "purple" as const,
		action: "Abrir fila",
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
			subtitle="Acompanhe os canais de comunicação e os processos vinculados às integrações."
		>
			<section className="page-intro intro-with-badge">
				<div>
					<span className="eyebrow">
						<PlugZap size={14} /> INTEGRAÇÕES DA OPERAÇÃO
					</span>
					<h2>Conecte os canais usados pela carteira</h2>
					<p>
						Configure e acompanhe os meios de comunicação utilizados no
						atendimento, na revisão de contemplados e no acompanhamento de pendências.
					</p>
				</div>
				<div className="overview-health">
					<span />
					<div>
						<strong>Status do ambiente</strong>
						<small>Dependente da configuração do backend</small>
					</div>
				</div>
			</section>

			<section className="metric-grid" aria-label="Resumo das integrações">
				<div className="metric-card">
					<Workflow size={19} />
					<span>
						<strong>3</strong>
						<small>Áreas disponíveis</small>
					</span>
				</div>
				<div className="metric-card">
					<LockKeyhole size={19} />
					<span>
						<strong>JWT</strong>
						<small>Autenticação</small>
					</span>
				</div>
				<div className="metric-card">
					<CheckCircle2 size={19} />
					<span>
						<strong>Operação</strong>
						<small>Configuração no servidor</small>
					</span>
				</div>
			</section>

			<section className="service-grid">
				{services.map((service) => (
					<article className="service-card" key={service.title}>
						<div className="service-card-top">
							<ServiceIcon service={service.service} tone={service.iconTone} />
							<span className="service-index">
								0{services.indexOf(service) + 1}
							</span>
						</div>
						<h3>{service.title}</h3>
						<p>{service.description}</p>
						<div className="service-card-footer">
							<StatusPill tone={service.statusTone}>{service.status}</StatusPill>
							<button
								type="button"
								className={
									service.secondary
										? "button secondary"
										: "button primary"
								}
								onClick={() => navigate(service.to)}
							>
								{service.action}
								<ArrowRight size={16} />
							</button>
						</div>
					</article>
				))}
			</section>

			<section className="panel how-it-works">
				<div className="section-heading">
					<div>
						<span className="eyebrow">FLUXO DA OPERAÇÃO</span>
						<h3>Como funciona</h3>
					</div>
					<p>Da contemplação até a comunicação e o acompanhamento.</p>
				</div>
				<div className="step-grid">
					{[
						"Receber o contemplado",
						"Validar os dados",
						"Configurar o canal",
						"Enviar ou reenviar a comunicação",
					].map((step, index) => (
						<div className="step-card" key={step}>
							<span>{index + 1}</span>
							<strong>{step}</strong>
						</div>
					))}
				</div>
			</section>

			<section className="security-card">
				<h3>Segurança das integrações</h3>
				<p>
					Credenciais sensíveis são tratadas no backend e não ficam expostas no navegador.
				</p>
				<strong>
					Gmail: senha de aplicativo. WhatsApp: instância configurada no servidor.
				</strong>
			</section>
		</IntegrationShell>
	);
}
