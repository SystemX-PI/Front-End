import AdminShell from "../components/AdminShell";
import { EmptyState, PageHeading } from "../components/DataUi";

export default function Audit() {
  return (
    <AdminShell
      title="Auditoria"
      subtitle="Histórico de ações registradas pelo sistema"
    >
      <PageHeading
        eyebrow="GOVERNANÇA"
        title="Uma operação transparente"
        description="Acompanhe a rastreabilidade das ações quando os registros estiverem disponíveis."
      />
      <section className="panel data-panel" aria-label="Registros de auditoria">
        <EmptyState
          title="Histórico ainda indisponível"
          description="A consulta de auditoria aguarda disponibilização pelo serviço. Nenhum registro pode ser exibido neste momento."
        />
      </section>
    </AdminShell>
  );
}
