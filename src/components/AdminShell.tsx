import {
  BellRing,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
  UserRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";
import { logout } from "../services/auth";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/contemplados", label: "Contemplados", icon: BellRing },
  { to: "/admin/clientes", label: "Clientes", icon: UserRound },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
];

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

  return (
    <div className="app-shell admin-app-shell">
      <aside className="sidebar admin-sidebar">
        <div className="brand-row">
          <BrandLogo compact />
          <strong className="admin-brand-name">ConsorTech</strong>
        </div>
        <p className="nav-section-label admin-section-label">Administração</p>
        <nav className="sidebar-nav" aria-label="Navegação administrativa">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin/dashboard"}
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/integracoes" className="nav-item">
            <BellRing size={18} aria-hidden="true" />
            <span>Integrações</span>
          </NavLink>
        </nav>
        <div className="sidebar-trust">
          <div>
            <strong>Sessão autenticada</strong>
            <span>{email || "Usuário conectado"}</span>
          </div>
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-copy">
            <div className="breadcrumb">
              <span>ConsorTech</span>
              <b>/</b>
              <span>Administração</span>
              <b>/</b>
              {title}
            </div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="user-chip">
            <ThemeSwitcher />
            <span className="user-copy">
              <strong>{email || "Usuário conectado"}</strong>
              <small>Área administrativa</small>
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
        <main id="main-content" className="integration-main admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
