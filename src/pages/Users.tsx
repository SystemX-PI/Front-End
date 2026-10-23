import { Plus, RefreshCw, Search, Users as UsersIcon } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import AdminShell from "../components/AdminShell";
import { InlineFeedback, StatusPill } from "../components/IntegrationUi";
import { getUserType } from "../services/auth";
import { backend, type UserResponse } from "../services/backend";
import { EmptyState, Pagination, Skeleton } from "../components/DataUi";
import { usePagination } from "../hooks/usePagination";
import { notify } from "../services/notifications";
import { readable } from "../services/format";

type Feedback = { kind: "info" | "success" | "error"; message: string } | null;

export default function Users() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const filteredUsers = users.filter((user) =>
    `${user.nome} ${user.email} ${user.tipo}`
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const { pageItems, page, setPage, size } = usePagination(filteredUsers);
  const canCreateUsers = getUserType() === "ADMINISTRADOR";

  useEffect(() => {
    let active = true;
    backend.users
      .list()
      .then((items) => {
        if (active) setUsers(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setFeedback({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar os usuários.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await backend.users.list());
      setFeedback(null);
      return true;
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os usuários.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  function refreshUsers() {
    setFeedback(null);
    setLoading(true);
    void loadUsers();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setFeedback({ kind: "error", message: "Informe o nome do funcionário." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await backend.users.create({
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        tipo: "FUNCIONARIO",
      });
      setName("");
      setEmail("");
      setPassword("");
      setShowForm(false);
      const reloaded = await loadUsers();
      if (reloaded)
        setFeedback({
          kind: "success",
          message: "Funcionário cadastrado com sucesso.",
        });
      notify("Funcionário cadastrado com sucesso.", "success");
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o usuário.",
      });
    } finally {
      setSaving(false);
    }
  }

  const administrators = users.filter(
    (user) => user.tipo === "ADMINISTRADOR",
  ).length;
  const activeUsers = users.filter((user) => user.ativo).length;

  return (
    <AdminShell title="Usuários" subtitle="Contas e perfis de acesso">
      <section className="admin-page-heading">
        <div>
          <h2>Usuários</h2>
          <p>Gerencie as contas e acompanhe os perfis da sua equipe.</p>
        </div>
        {canCreateUsers ? (
          <button
            className="button primary"
            type="button"
            onClick={() => setShowForm((current) => !current)}
          >
            <Plus size={16} aria-hidden="true" />
            {showForm ? "Fechar formulário" : "Novo usuário"}
          </button>
        ) : null}
      </section>

      <section className="admin-metrics" aria-label="Resumo de usuários">
        <article className="metric-card">
          <UsersIcon size={19} aria-hidden="true" />
          <span>
            <strong>{loading ? "—" : users.length}</strong>
            <small>Total de usuários</small>
          </span>
        </article>
        <article className="metric-card">
          <UsersIcon size={19} aria-hidden="true" />
          <span>
            <strong>{loading ? "—" : activeUsers}</strong>
            <small>Usuários ativos</small>
          </span>
        </article>
        <article className="metric-card">
          <UsersIcon size={19} aria-hidden="true" />
          <span>
            <strong>{loading ? "—" : administrators}</strong>
            <small>Administradores</small>
          </span>
        </article>
      </section>

      {showForm && canCreateUsers ? (
        <form className="panel admin-form" onSubmit={handleCreate}>
          <h3>Novo funcionário</h3>
          <p>
            Crie uma conta para um novo integrante da equipe. O perfil de
            funcionário permite acompanhar a operação.
          </p>
          <div className="admin-form-grid">
            <label className="field">
              <span>Nome</span>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>E-mail</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Senha inicial</span>
              <input
                required
                minLength={6}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Criando..." : "Criar funcionário"}
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? (
        <InlineFeedback kind={feedback.kind} message={feedback.message} />
      ) : null}

      <section className="panel data-panel">
        <div className="data-panel-heading">
          <div>
            <h3>Contas cadastradas</h3>
            <p>Encontre integrantes por nome, e-mail ou perfil.</p>
          </div>
          <button
            className="button secondary compact"
            type="button"
            onClick={refreshUsers}
            disabled={loading}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Atualizar
          </button>
        </div>
        <label className="search-control">
          <Search size={17} />
          <input
            aria-label="Buscar usuários"
            value={search}
            placeholder="Buscar na equipe"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        {loading ? <Skeleton /> : null}
        {!loading && users.length === 0 && !feedback ? (
          <EmptyState
            title="Sua equipe começa aqui"
            description="Cadastre um funcionário para organizar os acessos."
          />
        ) : null}
        {!loading && users.length > 0 ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusPill
                        tone={user.tipo === "ADMINISTRADOR" ? "purple" : "blue"}
                      >
                        {readable(user.tipo)}
                      </StatusPill>
                    </td>
                    <td>
                      <StatusPill tone={user.ativo ? "green" : "neutral"}>
                        {user.ativo ? "Ativo" : "Inativo"}
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!loading && users.length > 0 && filteredUsers.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Tente outro nome, e-mail ou perfil."
          />
        ) : null}
        {!loading && users.length > 0 ? (
          <Pagination
            page={page}
            size={size}
            total={filteredUsers.length}
            onChange={setPage}
          />
        ) : null}
      </section>
    </AdminShell>
  );
}
