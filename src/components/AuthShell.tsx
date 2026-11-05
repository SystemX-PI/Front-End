import { MessageCircle, ShieldCheck, PlugZap } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AuthShell({
  children,
  eyebrow,
  title,
  description,
  registration = false,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  registration?: boolean;
}) {
  return (
    <div className={registration ? "auth-page registration-page" : "auth-page"}>
      <div className="auth-shell">
        <aside
          className="auth-visual-panel"
          aria-label="Identidade da ConsorTech"
        >
          <div className="auth-brand-row">
            <BrandLogo compact />
            <div className="auth-brand-meta">
              <strong>ConsorTech</strong>
            </div>
          </div>

          <h1 className="auth-visual-title">
            Seu espaço. Sua equipe. Suas conexões.
          </h1>

          <ul className="auth-feature-list">
            <li>
              <span className="feature-icon"><MessageCircle size={18} aria-hidden="true" /></span>
              <div>
                <strong>Canais organizados</strong>
              </div>
            </li>
            <li>
              <span className="feature-icon"><ShieldCheck size={18} aria-hidden="true" /></span>
              <div>
                <strong>Segurança e acesso</strong>
              </div>
            </li>
            <li>
              <span className="feature-icon"><PlugZap size={18} aria-hidden="true" /></span>
              <div>
                <strong>Integrações</strong>
              </div>
            </li>
          </ul>
        </aside>

        <main className="auth-panel">
          <div className="auth-card">
            <div className="auth-brand-mini">
              <BrandLogo compact />
              <strong>ConsorTech</strong>
              <ThemeSwitcher />
            </div>

            <div className="auth-heading">
              <span className="eyebrow">{eyebrow}</span>
              <h2>{title}</h2>
              {description ? <p>{description}</p> : null}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
