import {
  BellRing,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Mail,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { logout } from "../services/auth";

type Section = "overview" | "gmail" | "whatsapp" | "notifications";

interface IntegrationShellProps {
  active: Section;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const navigation = [
  { id: "overview", label: "Visão geral", to: "/integracoes", icon: LayoutGrid },
  { id: "gmail", label: "Gmail", to: "/integracoes/gmail", icon: Mail },
  { id: "whatsapp", label: "WhatsApp", to: "/integracoes/whatsapp", icon: MessageCircle },
  { id: "notifications", label: "Notificações", to: "/integracoes/notificacoes", icon: BellRing },
] satisfies Array<{ id: Section; label: string; to: string; icon: typeof LayoutGrid }>;

function getUserIdentity() {
  const email = localStorage.getItem("userEmail") || "gestor@consortech.com";
  const rawName = email.split("@")[0].replace(/[._-]/g, " ");
  const initials = rawName.split(" ").filter(Boolean).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("") || "CT";
  const name = rawName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { email, initials, name };
}

export default function IntegrationShell({ active, title, subtitle, children }: IntegrationShellProps) {
  const navigate = useNavigate();
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
      <aside className="sidebar">
        <div className="brand-row">
          <BrandLogo compact />
        </div>

        <p className="nav-section-label">Menu principal</p>
        <nav className="sidebar-nav" aria-label="Navegação das integrações">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.id} to={item.to} end={item.id === "overview"}
                className={item.id === active ? "nav-item active" : "nav-item"}>
                <Icon size={18} strokeWidth={1.9} />
                <span>{item.label}</span>
                {item.id !== "overview" ? <i aria-hidden="true" /> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-trust">
          <ShieldCheck size={20} />
          <div><strong>Ambiente protegido</strong><span>Dados da operação</span></div>
        </div>
        <p className="sidebar-version">ConsorTech · v1.0</p>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-copy">
            <div className="breadcrumb"><span>ConsorTech</span><b>/</b>{title}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="user-chip">
            <span className="avatar">{user.initials}</span>
            <span className="user-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
            <ChevronDown size={15} />
            <button type="button" onClick={() => void handleLogout()} aria-label="Sair do sistema" title="Sair">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="integration-main">{children}</main>
      </div>
    </div>
  );
}
