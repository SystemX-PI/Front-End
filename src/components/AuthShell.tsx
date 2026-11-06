import { ArrowLeft, Layers3, Mail, MessageCircle, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AuthShell({
  children,
  eyebrow,
  title,
  description,
  registration = false,
  compactLogin = false,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  registration?: boolean;
  compactLogin?: boolean;
}) {
  return (
    <div className={`auth-page${registration ? " registration-page" : ""}${compactLogin ? " login-page" : ""}`}>
      <div className="auth-shell">
        <aside className="auth-visual-panel" aria-label="Sobre a ConsorTech">
          <div className="auth-brand-row">
            <BrandLogo compact />
            <div className="auth-brand-meta"><strong>ConsorTech</strong></div>
          </div>

          <div className="auth-story">
            <span className="auth-story-label">Sua operação, em um só lugar</span>
            <p className="auth-visual-title">
              Conecte seus canais.<br />
              <em>Organize sua rotina.</em>
            </p>
            <p className="auth-visual-copy">
              WhatsApp, Gmail e equipe no mesmo espaço, com a identidade da sua empresa.
            </p>
          </div>

          <div className="auth-network" aria-hidden="true">
            <span className="auth-network-hub"><Layers3 size={25} /></span>
            <div className="auth-network-channels">
              <span><MessageCircle size={19} /> WhatsApp</span>
              <span><Mail size={19} /> Gmail</span>
              <span><Users size={19} /> Equipe</span>
            </div>
          </div>

          <Link className="auth-home-link" to="/">
            <ArrowLeft size={16} aria-hidden="true" /> Voltar ao início
          </Link>
        </aside>

        <main className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-card">
            <div className="auth-brand-mini">
              <Link className="auth-mobile-brand" to="/" aria-label="ConsorTech — início">
                <BrandLogo compact />
                <strong>ConsorTech</strong>
              </Link>
              <ThemeSwitcher />
            </div>

            <div className="auth-heading">
              <span className="eyebrow">{eyebrow}</span>
              <h1 id="auth-title">{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
