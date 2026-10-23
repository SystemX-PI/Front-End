import { ClipboardList } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { InlineFeedback } from "../components/IntegrationUi";

export default function Audit() {
  return (
    <AdminShell
      title="Auditoria"
      subtitle="Histórico de ações registradas pelo sistema"
    >
      <section className="admin-page-heading">
        <div>
          <h2>Registros de auditoria</h2>
          <p>Consulta somente leitura dos eventos registrados pelo backend.</p>
        </div>
      </section>
      <section className="panel data-panel" aria-label="Registros de auditoria">
        <InlineFeedback
          kind="info"
          message="A API possui estrutura interna de auditoria, mas não expõe um endpoint de consulta no contrato disponível."
        />
        <div className="admin-empty-state">
          <ClipboardList size={28} aria-hidden="true" />
          <h3>Nenhum registro pode ser consultado</h3>
          <p>
            A listagem só poderá ser exibida quando o backend disponibilizar
            uma operação de leitura de auditoria.
          </p>
        </div>
      </section>
    </AdminShell>
  );
}
