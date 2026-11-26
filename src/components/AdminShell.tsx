import { useState } from "react";
import {
  ArrowDownToLine,
  BellRing,
  Menu,
  X,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlugZap,
  Send,
  Users,
  UserRound,
  Building2,
  CreditCard,
  LifeBuoy,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";
import { useOperationBase } from "../hooks/useOperationBase";
import { getUserType, logout } from "../services/auth";

const navigation = [
  { label: "Operação", links: [
    { to: "/admin/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { to: "/admin/contemplados", label: "Contemplados", icon: ClipboardList },
    { to: "/admin/baixas", label: "Baixas pendentes", icon: ArrowDownToLine },
    { to: "/admin/comunicacao", label: "Comunicação", icon: BellRing },
    { to: "/admin/disparo-manual", label: "Disparo manual", icon: Send },
  ] },
  { label: "Gestão", links: [
    { to: "/admin/clientes", label: "Clientes", icon: UserRound },
    { to: "/admin/cadastros", label: "Cadastros", icon: ClipboardList },
    { to: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
    { to: "/admin/usuarios", label: "Usuários", icon: Users, adminOnly: true },
    { to: "/admin/canais", label: "Canais internos", icon: PlugZap, adminOnly: true },
    { to: "/app", label: "Meu espaço", icon: LayoutDashboard, adminOnly: true },
  ] },
];
const platformNavigation = [{ label: "Plataforma", links: [
  { to: "/admin/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/admin/empresas", label: "Empresas clientes", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuários e acessos", icon: Users },
  { to: "/admin/assinaturas", label: "Planos e assinaturas", icon: CreditCard },
  { to: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
  { to: "/admin/configuracoes", label: "Configurações", icon: PlugZap },
  { to: "/admin/suporte", label: "Suporte", icon: LifeBuoy },
] }];

export default function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const operationBase = useOperationBase();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = getUserType() === "ADMINISTRADOR";
  const email = localStorage.getItem("userEmail") || "";

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      navigate("/login", {
        replace: true,
        state: {
          logoutWarning:
            error instanceof Error
              ? error.message
              : "A sessão local foi encerrada, mas o backend não confirmou o logout.",
        },
      });
    }
  }

  if (operationBase === "/app") return <>
    <header className="workspace-heading"><div><h1>{title}</h1><p>{subtitle}</p></div></header>
    {children}
  </>;

  return (
    <div className="app-shell admin-app-shell">
      <a className="skip-link" href="#main-content">Ir para o conteúdo</a>
      <aside className={`sidebar admin-sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="brand-row">
          <Link className="sidebar-brand-link" to="/admin/dashboard" aria-label="ConsorTech — visão geral" onClick={() => setMenuOpen(false)}>
            <BrandLogo compact />
            <strong className="admin-brand-name">ConsorTech</strong>
          </Link>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(value => !value)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <nav id="main-navigation" className="sidebar-nav" aria-label={isAdmin ? "Navegação administrativa" : "Navegação da operação"}
          onKeyDown={event => {
            if (event.key !== "Escape" || !menuOpen) return;
            setMenuOpen(false);
            event.currentTarget.closest("aside")?.querySelector<HTMLButtonElement>(".mobile-menu-toggle")?.focus();
          }}>
          {(isAdmin ? platformNavigation : navigation).map(({ label, links }) => (
            <div className="admin-nav-group" key={label}>
              <p className="admin-section-label">{label}</p>
              {links.filter(link => !("adminOnly" in link) || !link.adminOnly).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to !== "/admin/empresas"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-copy">
            <div className="breadcrumb">
              <span>ConsorTech</span>
              <b>/</b>
              <span>{isAdmin ? "Gestão da plataforma" : "Operação interna"}</span>
            </div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="user-chip">
            <ThemeSwitcher />
            {isAdmin && <Link to="/app/perfil" aria-label="Meu perfil" title="Meu perfil"><UserRound size={17} aria-hidden="true" /></Link>}
            <span className="user-copy">
              <strong>{email || "Usuário conectado"}</strong>
              <small>{isAdmin ? "Administrador" : "Operação"}</small>
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Sair do sistema"
              title="Sair"
            >
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        </header>
        <main id="main-content" className="integration-main admin-main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
