import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BellRing,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlugZap,
  Send,
  Users,
  UserRound,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";
import { getUserType, logout } from "../services/auth";

const links = [
  { to: "/admin/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { to: "/admin/contemplados", label: "Contemplados", icon: BellRing },
  { to: "/admin/cadastros", label: "Cadastros", icon: ClipboardList },
  { to: "/admin/clientes", label: "Clientes", icon: UserRound },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/comunicacao", label: "Comunicação", icon: BellRing },
  { to: "/admin/canais", label: "Canais internos", icon: PlugZap },
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
  const location = useLocation();
  const admin = getUserType() === "ADMINISTRADOR";
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
          {links.filter(link => admin || !["/admin/usuarios", "/admin/canais"].includes(link.to)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to === "/admin/clientes" && admin ? "/app/clientes" : to}
              end
              className={({ isActive }) =>
                (isActive || (admin && to === "/admin/clientes" && location.pathname === "/app")) ? "nav-item active" : "nav-item"
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to={admin ? "/app/perfil" : "/app"} className="nav-item">
            <BellRing size={18} aria-hidden="true" />
            <span>{admin ? "Meu perfil" : "Meu espaço"}</span>
          </NavLink>
        </nav>
        <div className="sidebar-trust admin-session">
          <div className="admin-session-copy">
            <strong>{admin ? "Administrador" : "Equipe"}</strong>
            <span title={email}>{email || "Usuário conectado"}</span>
          </div>
          <button type="button" className="admin-session-logout" onClick={() => void handleLogout()}>
            <LogOut size={16} aria-hidden="true" /> Sair
          </button>
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
          </div>
        </header>
        <main id="main-content" className="integration-main admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
