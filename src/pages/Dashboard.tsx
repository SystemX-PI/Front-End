import { Activity, CheckCircle2, Clock3, Users } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { InlineFeedback } from "../components/IntegrationUi";

const unavailableMetrics = [
  { label: "Total de contemplados", icon: Users },
  { label: "Aguardando contato", icon: Clock3 },
  { label: "Em andamento", icon: Activity },
  { label: "Baixados", icon: CheckCircle2 },
];

export default function Dashboard() {
  return (
    <AdminShell
      title="Dashboard"
      subtitle="Visão geral da operação de contemplados"
    >
      <section className="admin-page-heading">
        <div>
          <h2>Resumo da operação</h2>
          <p>Indicadores devem refletir os processos registrados no backend.</p>
        </div>
      </section>

      <InlineFeedback
        kind="info"
        message="A API disponível não oferece listagem agregada de processos. Os indicadores e a taxa de conclusão ficam indisponíveis até existir um endpoint de consulta."
      />

      <section className="admin-metrics" aria-label="Métricas de contemplação">
        {unavailableMetrics.map(({ label, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <Icon size={19} aria-hidden="true" />
            <span><strong aria-label="Dado indisponível">—</strong><small>{label}</small></span>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-grid">
        <article className="panel data-panel">
          <h3>Taxa de conclusão</h3>
          <p className="admin-muted">
            Indisponível: não há consulta de todos os processos para calcular uma
            proporção confiável.
          </p>
          <div className="admin-progress-track" aria-label="Taxa de conclusão indisponível">
            <span />
          </div>
        </article>
        <article className="panel data-panel">
          <h3>Contemplações recentes</h3>
          <p className="admin-muted">
            A API permite buscar um processo por ID, mas não fornece listagem
            recente, cliente ou consórcio.
          </p>
          <p className="admin-table-state">Nenhum registro recente pode ser consultado.</p>
        </article>
      </section>
    </AdminShell>
  );
}
