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
  description: string;
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
              <small>Sua operação, com a sua marca.</small>
            </div>
          </div>

          <h1 className="auth-visual-title">
            Seu espaço. Sua equipe. Suas conexões.
          </h1>

          <p className="auth-visual-copy">
            Organize seus números de WhatsApp, conecte suas contas Gmail e reúna sua equipe em um espaço com a identidade da sua empresa.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="feature-icon"><MessageCircle size={18} aria-hidden="true" /></span>
              <div>
                <strong>Canais organizados</strong>
                <small>Cada número e cada remetente no seu lugar.</small>
              </div>
            </li>
            <li>
              <span className="feature-icon"><ShieldCheck size={18} aria-hidden="true" /></span>
              <div>
                <strong>Segurança e acesso</strong>
                <small>
                  Controle de permissões e dados protegidos no sistema.
                </small>
              </div>
            </li>
            <li>
              <span className="feature-icon"><PlugZap size={18} aria-hidden="true" /></span>
              <div>
                <strong>Integrações</strong>
                <small>
                  Conecte Gmail, WhatsApp e fluxos operacionais em um só lugar.
                </small>
              </div>
            </li>
          </ul>

          <div className="auth-tagline">
            Três dias grátis para experimentar seu novo espaço.
          </div>
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
              <p>{description}</p>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
