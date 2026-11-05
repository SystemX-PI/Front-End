import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BellRing,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Send,
  Users,
  UserRound,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";
import { getUserType, logout } from "../services/auth";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/contemplados", label: "Contemplados", icon: BellRing },
  { to: "/admin/cadastros", label: "Cadastros", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: UserRound },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/comunicacao", label: "Comunicação", icon: BellRing },
  { to: "/admin/disparo-manual", label: "Disparo manual", icon: Send },
  { to: "/admin/baixas", label: "Baixas pendentes", icon: ClipboardList },
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
  const [menuOpen, setMenuOpen] = useState(false);
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
      <aside className={`sidebar admin-sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="brand-row">
          <BrandLogo compact />
          <strong className="admin-brand-name">ConsorTech</strong>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(value => !value)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <p className="nav-section-label admin-section-label">Administração</p>
        <nav id="main-navigation" className="sidebar-nav" onClick={() => setMenuOpen(false)} aria-label="Navegação administrativa">
          {links.filter(link => link.to !== "/admin/usuarios" || getUserType() === "ADMINISTRADOR").map(({ to, label, icon: Icon }) => (
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
          <NavLink to="/app" className="nav-item">
            <BellRing size={18} aria-hidden="true" />
            <span>Meu espaço</span>
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
