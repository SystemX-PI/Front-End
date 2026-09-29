import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles, Workflow } from "lucide-react";

export default function AuthShell({ children, eyebrow, title, description }: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="auth-page">
      <aside className="auth-showcase">
        <div className="auth-showcase-glow" />
        <div className="auth-showcase-brand"><span><Sparkles size={21} /></span><div><strong>SystemX</strong><small>SO Software</small></div></div>
        <div className="auth-showcase-copy">
          <span className="auth-kicker">PLATAFORMA DE INTEGRAÇÕES</span>
          <h1>Conecte seus canais.<br />Simplifique sua operação.</h1>
          <p>Gmail, WhatsApp e notificações reunidos em uma experiência segura e simples.</p>
          <div className="auth-benefits">
            <span><Workflow size={19} /><b>Fluxos centralizados</b></span>
            <span><LockKeyhole size={19} /><b>Credenciais protegidas</b></span>
            <span><ShieldCheck size={19} /><b>API autenticada</b></span>
          </div>
        </div>
        <div className="auth-showcase-footer"><CheckCircle2 size={17} /> Ambiente conectado ao SystemX</div>
      </aside>

      <main className="auth-panel">
        <div className="auth-mobile-brand"><span><Sparkles size={18} /></span><strong>SystemX</strong></div>
        <div className="auth-card">
          <div className="auth-heading">
            <span>{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          {children}
        </div>
        <p className="auth-legal">© 2026 SystemX · SO Software</p>
      </main>
    </div>
  );
}
