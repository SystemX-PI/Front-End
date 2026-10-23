import { useState } from "react";
import { LogOut, Mail, Phone, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { InlineFeedback } from "../components/IntegrationUi";
import { logout } from "../services/auth";

type PortalTab = "processo" | "documentos" | "historico";

const tabs: Array<{ id: PortalTab; label: string }> = [
  { id: "processo", label: "Meu processo" },
  { id: "documentos", label: "Documentos" },
  { id: "historico", label: "Histórico" },
];

export default function BeneficiaryPortal() {
  const [activeTab, setActiveTab] = useState<PortalTab>("processo");
  const navigate = useNavigate();
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
    <div className="portal-page">
      <header className="portal-header">
        <Link className="portal-brand" to="/portal" aria-label="ConsorTech">
          <BrandLogo compact />
          <span>Portal do Contemplado</span>
        </Link>
        <div className="portal-identity">
          <span>{email || "Cliente autenticado"}</span>
          <span>CPF não disponibilizado</span>
        </div>
        <button
          type="button"
          className="button secondary portal-logout"
          onClick={() => void handleLogout()}
        >
          <LogOut size={16} aria-hidden="true" />
          Sair
        </button>
      </header>

      <main className="portal-content">
        <section className="portal-hero">
          <span className="eyebrow">PORTAL DO CONTEMPLADO</span>
          <h1>Seu processo</h1>
          <p>
            As informações do processo serão apresentadas quando estiverem
            disponíveis para sua conta.
          </p>
          <div className="portal-progress">
            <span />
          </div>
          <small>Progresso indisponível: a API não fornece etapas do cliente.</small>
        </section>

        <div className="portal-tabs" role="tablist" aria-label="Informações do processo">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`portal-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`portal-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={activeTab === tab.id ? "portal-tab active" : "portal-tab"}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                const currentIndex = tabs.findIndex(({ id }) => id === activeTab);
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const direction = event.key === "ArrowRight" ? 1 : -1;
                  const nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
                  setActiveTab(nextTab.id);
                  document.getElementById(`portal-tab-${nextTab.id}`)?.focus();
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section
          className="portal-panel"
          id="portal-panel-processo"
          role="tabpanel"
          aria-labelledby="portal-tab-processo"
          tabIndex={0}
          hidden={activeTab !== "processo"}
        >
              <h2>Meu processo</h2>
              <InlineFeedback
                kind="info"
                message="A API permite consultar um processo por identificador, mas não disponibiliza associação do processo ao cliente autenticado, responsável ou timeline."
              />
              <div className="portal-empty-detail">
                <strong>Situação, responsável e etapas não disponíveis</strong>
                <p>
                  Nenhum dado de processo será exibido sem confirmação de que
                  pertence à sua conta.
                </p>
              </div>
        </section>
        <section
          className="portal-panel"
          id="portal-panel-documentos"
          role="tabpanel"
          aria-labelledby="portal-tab-documentos"
          tabIndex={0}
          hidden={activeTab !== "documentos"}
        >
              <h2>Documentos</h2>
              <InlineFeedback
                kind="info"
                message="O backend não disponibiliza uma consulta de documentos associados ao cliente neste fluxo."
              />
              <div className="portal-empty-detail">
                <strong>Documentos indisponíveis</strong>
                <p>Não há status de entrega para exibir nesta conta.</p>
              </div>
        </section>
        <section
          className="portal-panel"
          id="portal-panel-historico"
          role="tabpanel"
          aria-labelledby="portal-tab-historico"
          tabIndex={0}
          hidden={activeTab !== "historico"}
        >
              <h2>Histórico</h2>
              <InlineFeedback
                kind="info"
                message="O backend não oferece uma consulta de histórico vinculada ao cliente autenticado."
              />
              <div className="portal-empty-detail">
                <strong>Histórico indisponível</strong>
                <p>Nenhuma comunicação fictícia será apresentada.</p>
              </div>
        </section>

        <section className="portal-contact">
          <div>
            <h2>Precisa de ajuda?</h2>
            <p>Os canais de atendimento não foram fornecidos pelo sistema.</p>
          </div>
          <div>
            <button className="button secondary" type="button" disabled>
              <Phone size={16} aria-hidden="true" />
              Ligar indisponível
            </button>
            <button className="button secondary" type="button" disabled>
              <Mail size={16} aria-hidden="true" />
              E-mail indisponível
            </button>
          </div>
        </section>
        <p className="portal-profile-note">
          <UserRound size={14} aria-hidden="true" />
          Nome e CPF não são retornados pelos dados de autenticação disponíveis.
        </p>
      </main>
    </div>
  );
}
