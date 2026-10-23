import { UserRoundPlus } from "lucide-react";
import AdminShell from "../components/AdminShell";
import { InlineFeedback } from "../components/IntegrationUi";

export default function Clients() {
  return (
    <AdminShell
      title="Clientes"
      subtitle="Consulta de clientes cadastrados no sistema"
    >
      <section className="admin-page-heading">
        <div>
          <h2>Clientes</h2>
          <p>
            Os endpoints disponíveis no backend não incluem listagem ou cadastro
            de clientes.
          </p>
        </div>
        <button className="button primary" type="button" disabled>
          <UserRoundPlus size={16} aria-hidden="true" />
          Novo cliente indisponível
        </button>
      </section>
      <section className="panel data-panel" aria-label="Lista de clientes">
        <InlineFeedback
          kind="info"
          message="A API atual não fornece dados de clientes, CPF, telefone, cidade nem operação de cadastro. Nenhum dado de demonstração será exibido."
        />
        <div className="admin-empty-state">
          <UserRoundPlus size={28} aria-hidden="true" />
          <h3>Cadastro de clientes não disponível</h3>
          <p>
            É necessário um endpoint de clientes documentado no backend para
            listar ou cadastrar essas informações.
          </p>
        </div>
      </section>
    </AdminShell>
  );
}
