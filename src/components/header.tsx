import React from "react";
import { Bell, ChevronDown, LogOut, Search, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { logout } from "../services/auth";

export const Header: React.FC = () => {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const userEmail = localStorage.getItem("userEmail") || "gerente@consortech.com";
  const rawName = userEmail.split("@")[0].replace(/[._-]/g, " ");
  const initials = rawName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CT";

  return (
    <header className="top-header">
      <div className="top-header__left">
        <Link to="/integracoes" className="top-header__brand" aria-label="ConsorTech home">
          <BrandLogo compact />
        </Link>
        <div className="top-header__search">
          <Search size={16} />
          <input type="text" placeholder="Buscar no sistema" aria-label="Buscar no sistema" />
        </div>
      </div>

      <div className="top-header__right">
        <button type="button" className="top-header__icon-button" aria-label="Notificações">
          <Bell size={16} />
          <span className="notification-dot" />
        </button>

        <div className="top-header__user">
          <span className="top-header__avatar">{initials}</span>
          <div className="top-header__user-copy">
            <strong>{rawName || "Gestor"}</strong>
            <small>{userEmail}</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <button type="button" className="top-header__logout" aria-label="Sair da plataforma" onClick={() => void handleLogout()}>
          <ShieldCheck size={15} />
          <span>Sair</span>
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};

export default Header;
