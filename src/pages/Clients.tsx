import { Search, RefreshCw } from "lucide-react";
import { useState } from "react";
import AdminShell from "../components/AdminShell";
import {
  EmptyState,
  ErrorState,
  PageHeading,
  Pagination,
  Skeleton,
} from "../components/DataUi";
import { usePagination } from "../hooks/usePagination";
import { StatusPill } from "../components/IntegrationUi";
import { useResource } from "../hooks/useResource";
import { backend } from "../services/backend";

export default function Clients() {
  const { data, loading, error, refresh } = useResource(backend.users.list);
  const [search, setSearch] = useState("");
  const clients = (data || []).filter(
    (user) =>
      user.tipo === "CLIENTE" &&
      `${user.nome} ${user.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const { page, setPage, pageItems, size } = usePagination(clients);
  return (
    <AdminShell title="Clientes" subtitle="Pessoas no centro da operação">
      <PageHeading
        eyebrow="SUA CARTEIRA"
        title="Relacionamentos que importam"
        description="Consulte as contas de clientes registradas no sistema."
        action={
          <button
            type="button"
            className="button secondary"
            disabled={loading}
            onClick={refresh}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        }
      />
      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Clientes cadastrados</h3>
            <p>
              {loading
                ? "Carregando sua carteira…"
                : `${clients.length} clientes encontrados`}
            </p>
          </div>
          <label className="search-control">
            <Search size={17} />
            <input
              aria-label="Buscar clientes"
              placeholder="Buscar nome ou e-mail"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        {error ? (
          <ErrorState message={error} retry={refresh} />
        ) : loading ? (
          <Skeleton />
        ) : !clients.length ? (
          <EmptyState
            title={search ? "Nenhum resultado" : "Sua carteira está começando"}
            description={
              search
                ? "Tente outro nome ou endereço de e-mail."
                : "Os clientes recebidos pela integração aparecerão aqui."
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>E-mail</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="person-cell">
                          <span className="record-avatar">
                            {client.nome.slice(0, 2).toUpperCase()}
                          </span>
                          <strong>{client.nome}</strong>
                        </div>
                      </td>
                      <td>{client.email}</td>
                      <td>
                        <StatusPill tone={client.ativo ? "green" : "neutral"}>
                          {client.ativo ? "Ativo" : "Inativo"}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              size={size}
              total={clients.length}
              onChange={setPage}
            />
          </>
        )}
      </section>
      <p className="scope-note">
        Esta consulta usa as contas com perfil Cliente. CPF, CNPJ e endereço não
        são fornecidos por este contrato.
      </p>
    </AdminShell>
  );
}
