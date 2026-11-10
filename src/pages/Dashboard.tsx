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
import { getUserType } from "../services/auth";
import { backend } from "../services/backend";
import { formatDate, readable } from "../services/format";

export default function Dashboard() {
  const isAdmin = getUserType() === "ADMINISTRADOR";
  const { data, loading, error, refresh } = useResource(
    backend.integrations.queue,
  );
  const rawQueue = Array.isArray(data) ? data : [];
  const queue = rawQueue.filter(
    (item) => Number.isSafeInteger(item?.processoId) && item.processoId > 0,
  );
  const metrics = [
    {
      label: "Processos recentes na fila",
      value: queue.length,
      icon: BellRing,
      tone: "blue",
    },
    {
      label: "Aguardando comunicação",
      value: queue.filter(
        (item) => (item?.comunicacao?.statusGeral || "PENDENTE") === "PENDENTE",
      ).length,
      icon: Clock3,
      tone: "amber",
    },
    {
      label: "Com algum canal enviado",
      value: queue.filter(
        (item) =>
          Boolean(item?.comunicacao?.statusGeral) &&
          item.comunicacao.statusGeral !== "PENDENTE",
      ).length,
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Precisam de atenção",
      value: queue.filter(
        (item) =>
          Boolean(item?.comunicacao?.email?.erro) ||
          Boolean(item?.comunicacao?.whatsapp?.erro) ||
          item?.comunicacao?.email?.status === "FALHA" ||
          item?.comunicacao?.whatsapp?.status === "FALHA",
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
          <div className="split-actions">
            <Link className="button secondary" to="/admin/disparo-manual">
              Disparo manual
            </Link>
            <Link className="button primary" to="/admin/comunicacao">
              Abrir central <ArrowRight size={17} />
            </Link>
          </div>
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
            <Link className="text-link" to="/admin/comunicacao">
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
              {queue.slice(0, 5).map((item, index) => {
                const hasValidId =
                  Number.isSafeInteger(item?.processoId) && item.processoId > 0;
                const statusGeral = item?.comunicacao?.statusGeral || "PENDENTE";
                const itemKey = hasValidId
                  ? `recent-process-${item.processoId}`
                  : `recent-fallback-${index}`;
                const content = (
                  <>
                    <span className="record-avatar">
                      {hasValidId ? `#${item.processoId}` : "#—"}
                    </span>
                    <div>
                      <strong>
                        {item?.idExterno ||
                          (hasValidId
                            ? `Processo ${item.processoId}`
                            : "Processo sem identificação")}
                      </strong>
                      <small>
                        {item?.origem || "Integração"} ·{" "}
                        {formatDate(item?.recebidaEm)}
                      </small>
                    </div>
                    <StatusPill
                      tone={statusGeral === "PENDENTE" ? "amber" : "green"}
                    >
                      {readable(statusGeral)}
                    </StatusPill>
                  </>
                );
                return hasValidId ? (
                  <Link
                    className="recent-item"
                    key={itemKey}
                    to={`/admin/contemplados?processo=${item.processoId}`}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="recent-item" key={itemKey}>
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sua operação começa aqui"
              description="Receba uma contemplação para acompanhar os primeiros registros."
              action={
                <Link
                  to="/admin/comunicacao"
                  className="button secondary"
                >
                  Abrir fila de comunicação
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
              to: "/admin/disparo-manual",
              label: "Disparo manual de mensagens",
              description: "Envie mensagens personalizadas por processo",
            },
            ...(isAdmin
              ? [
                  {
                    to: "/admin/canais",
                    label: "Canais internos da operação",
                    description: "Configure WhatsApp e Gmail da administração",
                  },
                ]
              : []),
            {
              to: "/admin/contemplados",
              label: "Consultar processos contemplados",
              description: "Verifique status, comunicação e andamento",
            },
            {
              to: "/admin/baixas",
              label: "Conferir baixas pendentes",
              description: "Valide processos em etapa final de baixa",
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
