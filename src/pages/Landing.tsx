import { ArrowRight, Check, ArrowUpRight, MessageCircle, Mail, Palette, Users, ShieldCheck, Sparkles, Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { BrandLogo } from "../components/BrandLogo";
import { isAuthenticated, sessionHome } from "../services/auth";
import "../platform.css";

export default function Landing() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-slide-side, .reveal-slide-up, .reveal-fade");
    if (!targets.length) return;
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="marketing">
      <a className="skip-link" href="#inicio">Pular para o conteúdo</a>
      <header className="marketing-nav">
        <Link to="/" reloadDocument className="product-logo marketing-brand" aria-label="ConsorTech — início">
          <BrandLogo compact />
          <strong>ConsorTech</strong>
        </Link>
        <button
          className="marketing-menu"
          aria-expanded={menu}
          aria-controls="marketing-navigation"
          aria-label={menu ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav id="marketing-navigation" className={menu ? "is-open" : ""} aria-label="Navegação do produto">
          <a href="#recursos" onClick={() => setMenu(false)}>O que você pode fazer</a>
          <a href="#como-funciona" onClick={() => setMenu(false)}>Como funciona</a>
          <Link to={isAuthenticated() ? sessionHome() : "/login"}>Entrar <ArrowUpRight size={15} /></Link>
          <Link className="saas-button dark" to="/register">Começar grátis <ArrowRight size={16} /></Link>
        </nav>
      </header>
      <main id="inicio" tabIndex={-1}>
        <section className="marketing-hero">
          <div className="hero-copy">
            <span className="marketing-eyebrow hero-eyebrow"><span /> SUA OPERAÇÃO. SUA MARCA.</span>
            <h1>
              <span>Mais conexões.</span>
              <span>Menos abas.</span>
              <em>A sua marca.</em>
            </h1>
            <p>
              Um só espaço para <strong>WhatsApp, Gmail e sua equipe.</strong> Simplifique a rotina e dê a cada conexão a identidade da sua empresa.
            </p>
            <div className="hero-actions">
              <Link className="saas-button dark large" to="/register">Experimente por 3 dias <ArrowRight size={19} /></Link>
              <a className="text-action" href="#recursos">Conheça a plataforma <ArrowUpRight size={17} /></a>
            </div>
            <div className="hero-assurances">
              <span><Check size={15} />Sem cartão de crédito</span>
              <span><Check size={15} />Sua marca desde o primeiro dia</span>
            </div>
          </div>
          <div className="product-preview" aria-label="Prévia ilustrativa da plataforma">
            <div className="preview-browser">
              <span /><span /><span /><small>PRÉVIA DA PLATAFORMA</small>
            </div>
            <div className="preview-content">
              <div className="preview-greeting">
                <span className="preview-monogram"><BrandLogo compact /></span>
                <div>
                  <small>SEU ESPAÇO DE TRABALHO</small>
                  <h3>Sua empresa</h3>
                </div>
                <span className="live-badge">Tudo em um lugar</span>
              </div>
              <h2>O próximo passo fica mais simples.</h2>
              <div className="preview-stats">
                <article>
                  <MessageCircle />
                  <strong>WhatsApp</strong>
                  <small>Vários números, uma operação</small>
                </article>
                <article>
                  <Mail />
                  <strong>Gmail</strong>
                  <small>Cada remetente no seu lugar</small>
                </article>
              </div>
              <div className="preview-channel">
                <span className="channel-icon green"><MessageCircle /></span>
                <div>
                  <strong>Atendimento</strong>
                  <small>Uma conexão para cada equipe</small>
                </div>
                <span className="connection-dot" />
              </div>
              <div className="preview-channel">
                <span className="channel-icon purple"><Palette /></span>
                <div>
                  <strong>Do seu jeito</strong>
                  <small>Logo, nome e cores da sua marca</small>
                </div>
                <Check size={18} />
              </div>
              <div className="preview-workflow">
                <span><span className="workflow-dot" />Conectar</span>
                <i />
                <span>Organizar</span>
                <i />
                <span>Atender</span>
              </div>
              <div className="preview-note">
                <ShieldCheck size={16} /> Cada cliente tem seu próprio espaço.
              </div>
            </div>
            <div className="floating-label">
              <Sparkles size={19} />
              <span>A tecnologia é nossa.<br /><strong>A experiência é sua.</strong></span>
            </div>
          </div>
        </section>

        <section id="recursos" className="marketing-features">
          <div className="marketing-section-head reveal-fade">
            <span className="marketing-eyebrow">MENOS COMPLEXIDADE, MAIS CONTROLE</span>
            <h2>Tudo que sua operação<br />precisa para se conectar.</h2>
            <p>Um espaço organizado para seus canais e para as pessoas que fazem sua empresa acontecer.</p>
          </div>
          <div className="marketing-feature-grid">
            {[
              { icon: MessageCircle, title: "Cada número no seu lugar", text: "Conecte diferentes números de WhatsApp, dê um nome a cada instância e acompanhe a conexão sem sair da plataforma.", tone: "green" },
              { icon: Mail, title: "Seus remetentes, organizados", text: "Adicione diferentes contas Gmail com senha de aplicativo e mantenha cada configuração vinculada à sua empresa.", tone: "blue" },
              { icon: Palette, title: "Uma experiência com sua marca", text: "Personalize o nome, o logo e as cores do seu espaço. Sua identidade acompanha a experiência da sua equipe.", tone: "purple" },
              { icon: Users, title: "Sua equipe, no mesmo espaço", text: "Crie os acessos da sua equipe e controle quem continua ativo. Cada usuário pertence a uma conta de cliente.", tone: "orange" },
            ].map(({ icon: Icon, title, text, tone }) => (
              <article key={title} className="reveal-slide-side">
                <span className={`feature-symbol ${tone}`}><Icon size={25} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="marketing-steps">
          <div className="reveal-fade">
            <span className="marketing-eyebrow">DO CADASTRO À CONEXÃO</span>
            <h2>Começar pode<br />ser simples.</h2>
            <Link className="text-action" to="/register">Criar minha conta <ArrowRight size={18} /></Link>
          </div>
          <ol>
            {[
              { title: "Crie seu espaço", text: "Cadastre sua empresa e comece os três dias de teste gratuito." },
              { title: "Deixe com a sua identidade", text: "Escolha as cores e envie o logo da sua marca." },
              { title: "Conecte seus canais", text: "Vincule seus números, configure os e-mails e adicione sua equipe." }
            ].map((item, i) => (
              <li key={item.title} className="reveal-slide-up">
                <span>0{i + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="marketing-faq" aria-labelledby="faq-title">
          <div className="marketing-section-head reveal-fade">
            <span className="marketing-eyebrow">ANTES DE COMEÇAR</span>
            <h2 id="faq-title">Seu espaço, sem complicação.</h2>
            <p>Entenda o que você precisa para dar o primeiro passo.</p>
          </div>
          <div>
            {[
              { q: 'O que está incluído no teste?', a: 'Você tem três dias para experimentar uma conexão WhatsApp e um remetente Gmail. Depois, consulte as opções de assinatura no seu espaço.' },
              { q: 'Preciso informar um cartão?', a: 'Não. O cadastro inicia o teste sem cartão de crédito.' },
              { q: 'Como conecto meu WhatsApp?', a: 'Crie uma instância no seu espaço, gere o QR Code e autorize o vínculo em Aparelhos conectados no telefone.' },
              { q: 'Como acesso os processos de consórcio?', a: 'Após entrar, use Meus processos para acompanhar seus registros. Administradores e funcionários acessam a operação de consórcios pela navegação do seu espaço.' }
            ].map(({ q, a }) => (
              <details key={q}>
                <summary>{q}<ChevronDown size={18} /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="marketing-cta" aria-labelledby="start-title">
          <div className="cta-story reveal-slide-side">
            <span className="marketing-eyebrow">UM NOVO JEITO DE ORGANIZAR SEUS CANAIS</span>
            <h2 id="start-title">Sua operação conectada.<br /><em>Com a sua identidade.</em></h2>
            <p>Reúna os canais da sua empresa em um espaço organizado. Configure suas conexões, dê acesso à equipe e personalize a plataforma para que cada detalhe tenha a cara do seu negócio.</p>
            <ul className="cta-benefits">
              {[
                { icon: MessageCircle, title: "Seus canais, no mesmo espaço", text: "Conecte seu WhatsApp e configure seu remetente Gmail para organizar os contatos da empresa." },
                { icon: Palette, title: "Uma plataforma com a sua marca", text: "Use seu logo, nome e cores para criar uma experiência que sua equipe reconhece." },
                { icon: Users, title: "Mais clareza para sua equipe", text: "Cadastre os usuários e gerencie quem tem acesso ao espaço da sua empresa." },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="cta-benefit-icon"><Icon size={20} aria-hidden="true" /></span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="cta-trial reveal-slide-up" aria-labelledby="trial-title">
            <span className="cta-trial-label"><Sparkles size={16} aria-hidden="true" /> CONHEÇA NA PRÁTICA</span>
            <h3 id="trial-title">3 dias para experimentar<br />uma rotina mais simples.</h3>
            <p>Crie sua conta e explore a plataforma no ritmo da sua empresa.</p>
            <ul>
              <li><Check size={16} aria-hidden="true" />1 conexão WhatsApp</li>
              <li><Check size={16} aria-hidden="true" />1 remetente Gmail</li>
              <li><Check size={16} aria-hidden="true" />Personalização da sua marca</li>
              <li><Check size={16} aria-hidden="true" />Cadastro sem cartão de crédito</li>
            </ul>
            <Link className="saas-button lime large" to="/register">Quero meus 3 dias grátis <ArrowUpRight size={20} aria-hidden="true" /></Link>
            <p className="cta-trial-note">Após os 3 dias gratuitos, escolha uma assinatura para continuar usando a plataforma.</p>
          </aside>
        </section>
      </main>
      <footer className="marketing-footer">
        <Link className="product-logo marketing-brand" to="/" aria-label="ConsorTech — início">
          <BrandLogo compact />
          <strong>ConsorTech</strong>
        </Link>
        <p>Conexões organizadas. Uma experiência com a sua marca.</p>
        <span>© {new Date().getFullYear()} ConsorTech</span>
      </footer>
    </div>
  );
}