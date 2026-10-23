import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminShell from "../components/AdminShell";
import {
  EmptyState,
  ErrorState,
  PageHeading,
  Skeleton,
} from "../components/DataUi";
import { StatusPill } from "../components/IntegrationUi";
import { useResource } from "../hooks/useResource";
import { backend } from "../services/backend";
import { formatDate, readable } from "../services/format";

export default function Dashboard() {
  const { data, loading, error, refresh } = useResource(
    backend.integrations.queue,
  );
  const queue = data || [];
  const metrics = [
    {
      label: "Processos na comunicação",
      value: queue.length,
      icon: BellRing,
      tone: "blue",
    },
    {
      label: "Aguardando comunicação",
      value: queue.filter((item) => item.comunicacao.statusGeral === "PENDENTE")
        .length,
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "Com algum canal enviado",
      value: queue.filter((item) => item.comunicacao.statusGeral !== "PENDENTE")
        .length,
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Precisam de atenção",
      value: queue.filter(
        (item) =>
          item.comunicacao.email?.erro || item.comunicacao.whatsapp?.erro,
      ).length,
      icon: TriangleAlert,
      tone: "red",
    },
  ];
  return (
    <AdminShell title="Dashboard" subtitle="Sua operação, com mais clareza">
      <PageHeading
        eyebrow="VISÃO DA OPERAÇÃO"
        title="Cada contemplação, um próximo passo"
        description="Acompanhe os processos presentes na fila de comunicação e mantenha o atendimento em movimento."
        action={
          <Link className="button primary" to="/integracoes/notificacoes">
            Abrir central <ArrowRight size={17} />
          </Link>
        }
      />
      {error ? <ErrorState message={error} retry={refresh} /> : null}
      <section className="admin-metrics">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article className={`metric-card metric-${tone}`} key={label}>
            <Icon size={22} />
            <span>
              <strong>{loading || error ? "—" : value}</strong>
              <small>{label}</small>
            </span>
          </article>
        ))}
      </section>
      <div className="admin-dashboard-grid">
        <section className="panel data-panel">
          <div className="data-panel-heading">
            <div>
              <h3>Contemplações recentes</h3>
              <p>Últimos registros da fila de comunicação</p>
            </div>
            <Link className="text-link" to="/integracoes/notificacoes">
              Ver todos <ArrowRight size={15} />
            </Link>
          </div>
          {loading ? (
            <Skeleton />
          ) : error ? (
            <EmptyState
              title="Dados indisponíveis"
              description="Atualize a consulta para carregar os registros."
            />
          ) : queue.length ? (
            <div className="recent-list">
              {queue.slice(0, 5).map((item) => (
                <Link
                  className="recent-item"
                  key={item.processoId}
                  to={`/admin/contemplados?processo=${item.processoId}`}
                >
                  <span className="record-avatar">#{item.processoId}</span>
                  <div>
                    <strong>
                      {item.idExterno || `Processo ${item.processoId}`}
                    </strong>
                    <small>
                      {item.origem || "Integração"} ·{" "}
                      {formatDate(item.recebidaEm)}
                    </small>
                  </div>
                  <StatusPill
                    tone={
                      item.comunicacao.statusGeral === "PENDENTE"
                        ? "amber"
                        : "green"
                    }
                  >
                    {readable(item.comunicacao.statusGeral)}
                  </StatusPill>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sua operação começa aqui"
              description="Receba uma contemplação para acompanhar os primeiros registros."
              action={
                <Link
                  to="/integracoes/notificacoes"
                  className="button secondary"
                >
                  Receber contemplação
                </Link>
              }
            />
          )}
        </section>
        <aside className="panel action-panel">
          <span className="eyebrow">PRÓXIMOS PASSOS</span>
          <h3>Uma operação bem conectada</h3>
          <p>Prepare os canais e mantenha sua carteira atualizada.</p>
          {[
            {
              to: "/integracoes/gmail",
              label: "Configurar e-mail",
              description: "Defina sua conta remetente",
            },
            {
              to: "/integracoes/whatsapp",
              label: "Conectar WhatsApp",
              description: "Vincule o aparelho da operação",
            },
            {
              to: "/admin/clientes",
              label: "Consultar clientes",
              description: "Encontre as contas cadastradas",
            },
          ].map((action) => (
            <Link key={action.to} className="action-link" to={action.to}>
              <div>
                <strong>{action.label}</strong>
                <small>{action.description}</small>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </aside>
      </div>
      <p className="scope-note">
        Os indicadores representam os processos da fila de comunicação, e não a
        totalidade de processos do sistema.
      </p>
    </AdminShell>
  );
}
