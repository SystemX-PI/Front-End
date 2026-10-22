import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";

export default function AuthShell({ children, eyebrow, title, description }: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-visual-panel" aria-label="Identidade da ConsorTech">
          <div className="auth-brand-row">
            <BrandLogo compact />
            <div className="auth-brand-meta">
              <strong>ConsorTech</strong>
              <small>Gestão de consórcios, mais simples.</small>
            </div>
          </div>

          <h1 className="auth-visual-title">Controle de processos, comerciais e integrações.</h1>

          <p className="auth-visual-copy">
            Uma plataforma completa para gerenciar clientes contemplados, acompanhar processos,
            centralizar comunicações e integrar seus canais de atendimento.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="feature-icon">◌</span>
              <div>
                <strong>Clientes e processos</strong>
                <small>Acompanhe cada etapa com organização e controle.</small>
              </div>
            </li>
            <li>
              <span className="feature-icon">◌</span>
              <div>
                <strong>Segurança e acesso</strong>
                <small>Controle de permissões e dados protegidos no sistema.</small>
              </div>
            </li>
            <li>
              <span className="feature-icon">◌</span>
              <div>
                <strong>Integrações</strong>
                <small>Conecte Gmail, WhatsApp e fluxos operacionais em um só lugar.</small>
              </div>
            </li>
          </ul>

          <div className="auth-tagline">Tecnologia que impulsiona a gestão de consórcios</div>
        </aside>

        <main className="auth-panel">
          <div className="auth-card">
            <div className="auth-brand-mini">
              <BrandLogo compact />
              <strong>ConsorTech</strong>
            </div>

            <div className="auth-heading">
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
