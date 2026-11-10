import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  BellRing,
  ChevronDown,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";
import { logout } from "../services/auth";

type Section = "overview" | "gmail" | "whatsapp" | "notifications";

interface IntegrationShellProps {
  active: Section;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const navigation = [
  {
    id: "overview",
    label: "Visão geral",
    to: "/integracoes",
    icon: LayoutGrid,
  },
  { id: "gmail", label: "Gmail", to: "/integracoes/gmail", icon: Mail },
  {
    id: "whatsapp",
    label: "WhatsApp",
    to: "/integracoes/whatsapp",
    icon: MessageCircle,
  },
  {
    id: "notifications",
    label: "Notificações",
    to: "/integracoes/notificacoes",
    icon: BellRing,
  },
] satisfies Array<{
  id: Section;
  label: string;
  to: string;
  icon: typeof LayoutGrid;
}>;

function getUserIdentity() {
  const email = localStorage.getItem("userEmail") || "Usuário conectado";
  const rawName = email.split("@")[0].replace(/[._-]/g, " ");
  const initials =
    rawName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "CT";
  const name = rawName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { email, initials, name };
}

export default function IntegrationShell({
  active,
  title,
  subtitle,
  children,
}: IntegrationShellProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = getUserIdentity();

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
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "menu-open" : ""}`}>
        <div className="brand-row">
          <Link className="sidebar-brand-link" to="/admin/dashboard" aria-label="ConsorTech — visão geral" onClick={() => setMenuOpen(false)}>
            <BrandLogo compact />
            <strong>ConsorTech</strong>
          </Link>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(value => !value)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <p className="nav-section-label">Menu principal</p>
        <nav id="main-navigation" className="sidebar-nav" onClick={() => setMenuOpen(false)} aria-label="Navegação das integrações">
          <NavLink to="/admin/dashboard" className="nav-item">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.id === "overview"}
                className={item.id === active ? "nav-item active" : "nav-item"}
              >
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.id !== "overview" ? <i aria-hidden="true" /> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-trust">
          <ShieldCheck size={20} />
          <div>
            <strong>Ambiente protegido</strong>
            <span>Dados da operação</span>
          </div>
        </div>
        <p className="sidebar-version">ConsorTech · v1.0</p>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-copy">
            <div className="breadcrumb">
              <span>ConsorTech</span>
              <b>/</b>
              {title}
            </div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="user-chip">
            <ThemeSwitcher />
            <span className="avatar">{user.initials}</span>
            <span className="user-copy">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <ChevronDown size={15} />
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Sair do sistema"
              title="Sair"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main id="main-content" className="integration-main">
          {children}
        </main>
      </div>
    </div>
  );
}
