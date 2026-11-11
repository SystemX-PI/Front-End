import { useCallback, useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ChevronRight, CreditCard, LayoutDashboard, LogOut, Mail, Menu, MessageCircle, Palette, Plus, PlugZap, RefreshCw, Sparkles, UserRound, Users, X } from "lucide-react";
import { logout } from "../services/auth";
import { planFor, workspaceLink, platformRequest, type Context, type Client } from "../services/platform";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { notify } from "../services/notifications";
import PlatformWhatsApp from "./PlatformWhatsApp";
import PlanUpgrade from "./PlanUpgrade";
import ProfileSettings from "./ProfileSettings";
import PartnerWidget from "./PartnerWidget";
import Team from "./Team";
import "../platform.css";
import "../workspace-polish.css";

type BrandColors = { primary: string; accent: string };
type BrandDraft = BrandColors & { name: string; logo: string };
const originalColors: BrandColors = { primary: "#315fe8", accent: "#35cda0" };
const consorTechColors: BrandColors = { primary: "#142d54", accent: "#8fc8ff" };

function color(value: string | undefined, fallback: string) {
 return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function foreground(hex: string) {
 const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255);
 const linear = rgb.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
 const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
 return luminance > 0.179 ? "#000000" : "#ffffff";
}

function brandStyle({ primary, accent }: BrandColors): CSSProperties {
 return {
  "--tenant-primary": primary,
  "--tenant-accent": accent,
  "--tenant-on-primary": foreground(primary),
 } as CSSProperties;
}
function date(value: string | null) { return value ? new Date(value).toLocaleDateString("pt-BR") : "—"; }
export function Empty({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
 return <div className="saas-empty"><span>{icon}</span><h3>{title}</h3><p>{description}</p>{children}</div>;
}
export function Feedback({ message }: { message: string }) { return message ? <p className="saas-error" role="alert">{message}</p> : null; }
export default function PlatformApp() {
 const [params]=useSearchParams(); const accountId=params.get("account"); const location=useLocation(); const navigate=useNavigate();
 const section=location.pathname.split("/")[2] || "overview";
 const [context,setContext]=useState<Context|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true); const [settledScope,setSettledScope]=useState<string|null>(accountId); const [menu,setMenu]=useState(false);
 const load=useCallback(async()=>{ try { const c=await platformRequest<Context>("/context",accountId); setContext(c); setError(""); } catch(e) { setError(e instanceof Error?e.message:"Não foi possível abrir sua conta."); } finally { setLoading(false); setSettledScope(accountId); } },[accountId]);
 useEffect(()=>{ let active=true; void platformRequest<Context>("/context",accountId).then(c=>{if(active){setContext(c);setError("");}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active){setLoading(false);setSettledScope(accountId);}}); return()=>{active=false;}; },[accountId]);
 useEffect(()=>{
  if(!context || sessionStorage.getItem("show-trial-notice")!=="true") return;
  sessionStorage.removeItem("show-trial-notice");
  if(context.role!=="ADMINISTRADOR" && context.account && planFor(context).tier==="TRIAL") notify(context.active?`Seu teste gratuito termina em ${date(context.account.trialEndsAt)}. Você tem 1 WhatsApp e 1 Gmail para experimentar.`:"Seu teste gratuito terminou. Acesse Assinatura para continuar.","info");
 },[context]);
 const href=(path="")=>`/app${path}${accountId?`?account=${encodeURIComponent(accountId)}`:""}`;
 if(loading || settledScope!==accountId) return <main className="saas-loading"><span className="spinner"/>Abrindo seu espaço…</main>;
 if(!context || error) return <main className="saas-loading"><Feedback message={error}/><button className="saas-button" onClick={()=>void load()}>Tentar novamente</button><Link to="/app">Voltar</Link></main>;
 const admin=context.role==="ADMINISTRADOR"; const manager=admin || context.role==="CLIENTE"; const account=context.account; const clientsOnly=admin && !account;
 const labels:Record<string,string>={overview:clientsOnly?"Clientes":"Visão geral",integracoes:"Integrações",whatsapp:"WhatsApp",gmail:"Gmail",widget:"Widget parceiro",equipe:"Equipe",marca:"Identidade da marca",assinatura:"Assinatura",upgrade:"Ampliar plano",perfil:"Meu perfil"};
 const title=labels[section] || labels.overview;
 const savedColors = {
  primary: color(account?.primaryColor, originalColors.primary),
  accent: color(account?.accentColor, originalColors.accent),
 };
 const customBrand = savedColors.primary.toLowerCase() !== originalColors.primary || savedColors.accent.toLowerCase() !== originalColors.accent;
 const style = brandStyle(savedColors);

 function applySavedBrand(brand: BrandDraft) {
  setContext(current => current?.account && current.account.id === account?.id ? {
   ...current,
   account: {
    ...current.account,
    brandName: brand.name,
    logo: brand.logo,
    primaryColor: brand.primary,
    accentColor: brand.accent,
   },
  } : current);
 }
 async function signOut() { try {await logout();}catch {notify("Sessão encerrada neste dispositivo.","info");} navigate("/login",{replace:true}); }
 return <div className={customBrand ? "workspace has-custom-brand" : "workspace"} style={style}><a className="skip-link" href="#workspace-content">Pular para o conteúdo</a>
  <button className="workspace-drawer-backdrop" aria-label="Fechar navegação" hidden={!menu} onClick={()=>setMenu(false)}/>
  <aside className={`workspace-sidebar ${menu?"is-open":""}`}><Link className="workspace-brand" to={href()}>{account?.logo?<img src={account.logo} alt={account.brandName}/>:<BrandLogo compact/>}<strong>{account?.brandName || "ConsorTech"}</strong></Link><button className="workspace-menu" aria-label={menu?"Fechar menu":"Abrir menu"} aria-expanded={menu} aria-controls="workspace-navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button>
   <nav id="workspace-navigation" aria-label="Navegação principal" onClick={()=>setMenu(false)}
    onKeyDown={event => {
     if (event.key !== "Escape" || !menu) return;
     setMenu(false);
     event.currentTarget.closest("aside")?.querySelector<HTMLButtonElement>(".workspace-menu")?.focus();
    }}>
    {(admin || context.role==="FUNCIONARIO") && <Link className="text-button" to="/admin/dashboard">Operação de consórcios</Link>}
    <small>{clientsOnly?"PLATAFORMA":"SEU ESPAÇO"}</small>
    {admin&&<NavLink end to="/app" className={!account?"selected":""}><Building2 size={18}/>Clientes{account&&<ArrowLeft size={15}/>}</NavLink>}
    {!clientsOnly&&<><NavLink end to={href()} className={section==="overview"?"selected":""}><LayoutDashboard size={18}/>Visão geral</NavLink><small>APLICAÇÕES</small><div className="integration-nav"><NavLink to={href("/integracoes")} className={section==="integracoes"?"selected":undefined}><PlugZap size={18}/>Integrações</NavLink><div className="integration-subpages" role="group" aria-label="Subpáginas de Integrações"><NavLink className={section==="whatsapp"?"selected":undefined} to={href("/whatsapp")}><MessageCircle size={16}/>WhatsApp</NavLink><NavLink className={section==="gmail"?"selected":undefined} to={href("/gmail")}><Mail size={16}/>Gmail</NavLink><NavLink className={section==="widget"?"selected":undefined} to={href("/widget")}><Sparkles size={16}/>Widget parceiro</NavLink></div></div><small>CONTA</small><NavLink to={href("/equipe")} className={section==="equipe"?"selected":""}><Users size={18}/>Equipe</NavLink>{manager&&<><NavLink to={href("/marca")} className={section==="marca"?"selected":""}><Palette size={18}/>Sua marca</NavLink><NavLink to={href("/assinatura")} className={section==="assinatura"?"selected":""}><CreditCard size={18}/>Assinatura</NavLink></>}</>}
   </nav><div className="workspace-account"><Link to={href("/perfil")} className="sidebar-profile" onClick={()=>setMenu(false)}><span className="sidebar-avatar">{context.photo?<img src={context.photo} alt={`Foto de ${context.name}`}/>:<UserRound size={20}/>}</span><span><strong>{context.name}</strong><small>{admin?"Administrador":context.role==="CLIENTE"?"Titular da conta":"Equipe"}</small></span></Link><div className="sidebar-account-actions"><Link to={href("/perfil")} onClick={()=>setMenu(false)}><UserRound size={15}/>Meu perfil</Link><button type="button" onClick={()=>void signOut()}><LogOut size={15}/>Sair</button></div></div>
  </aside>
  <div className="workspace-column"><header className="workspace-topbar"><div className="workspace-breadcrumb">{account?<Link to={href()}>{account.brandName}</Link>:<span>Plataforma</span>}<ChevronRight size={14}/>{["whatsapp","gmail"].includes(section)&&<><Link to={href("/integracoes")}>Integrações</Link><ChevronRight size={14}/></>}<strong>{title}</strong></div><div className="workspace-profile"><ThemeSwitcher/></div></header>
   <main className="workspace-main" id="workspace-content" tabIndex={-1}>
    {admin&&account&&<div className="account-inspection"><span><Building2 size={17}/>Gerenciando a conta <strong>{account.nome}</strong></span><Link to="/app"><ArrowLeft size={16}/>Voltar aos clientes</Link></div>}
    {section==="overview"&&!clientsOnly&&account&&<div className={`trial-strip ${!context.active?"expired":""}`}><span><span className="connection-dot"/>{account.suspended?"Conta suspensa":planFor(context).tier==="PRO"?`Assinatura ativa até ${date(account.paidUntil)}${context.subscription?.billingProvider==="STRIPE"?" · Stripe":context.simulationEnabled?" · simulação":""}`:context.active?`Seu teste gratuito termina em ${date(account.trialEndsAt)}. Aproveite seu espaço.`:"Seus três dias gratuitos terminaram. Ative a assinatura para continuar."}</span>{manager&&<Link to={href("/assinatura")}>Ver assinatura <ArrowRight size={15}/></Link>}</div>}
    {section==="perfil"?<ProfileSettings context={context} reload={load}/>:clientsOnly?<ClientDirectory/>:section==="upgrade"&&manager?<PlanUpgrade context={context} accountId={accountId} reload={load}/>:section==="whatsapp"?<PlatformWhatsApp context={context} accountId={accountId} reload={load}/>:section==="gmail"?<Mailboxes context={context} accountId={accountId} reload={load}/>:section==="widget"?<PartnerWidget context={context} accountId={accountId}/>:section==="equipe"?<Team context={context} accountId={accountId} reload={load}/>:section==="marca"&&manager?<Brand key={location.key} context={context} accountId={accountId} colors={savedColors} onSaved={applySavedBrand}/>:section==="assinatura"&&manager?<Subscription context={context} accountId={accountId} reload={load}/>:section==="integracoes"?<Integrations context={context} href={href}/>:<Overview context={context} href={href}/>}
   </main><footer className="workspace-footer"><span>{account?.brandName || "ConsorTech"}</span><span>Seu espaço de trabalho, conectado.</span></footer>
  </div>
 </div>;
}
function ClientDirectory() {
 const [clients,setClients]=useState<Client[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [creating,setCreating]=useState(false);const [query,setQuery]=useState("");
 const load=useCallback(()=>platformRequest<Client[]>("/clients",null).then(setClients).catch(e=>setError(e.message)),[]);
 useEffect(()=>{void load();},[load]);
 async function create(event:FormEvent<HTMLFormElement>) {event.preventDefault();const form=event.currentTarget;const data=new FormData(form);setBusy(true);setError("");try{await platformRequest("/clients",null,"POST",{name:data.get("name"),email:data.get("email"),password:data.get("password")});form.reset();setCreating(false);await load();notify("Cliente criado com três dias gratuitos.","success");}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function toggle(c:Client){setBusy(true);try{await platformRequest(`/clients/${c.id}/active`,null,"PUT",{active:c.suspended});await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const filtered=clients.filter(c=>`${c.nome} ${c.email||""}`.toLowerCase().includes(query.toLowerCase()));
 return <><div className="workspace-heading"><div><span className="saas-eyebrow">ADMINISTRAÇÃO</span><h1>Seus clientes, em perspectiva.</h1><p>Acompanhe as contas e o que cada empresa conectou à plataforma.</p></div><button className="saas-button primary" onClick={()=>setCreating(!creating)}><Plus size={17}/>Novo cliente</button></div><div className="saas-metrics">{[{label:"Contas de clientes",value:clients.length,icon:Building2},{label:"Instâncias de WhatsApp",value:clients.reduce((n,c)=>n+Number(c.instances),0),icon:MessageCircle},{label:"Gmails configurados",value:clients.reduce((n,c)=>n+Number(c.gmails),0),icon:Mail},{label:"Usuários das equipes",value:clients.reduce((n,c)=>n+Number(c.users),0),icon:Users}].map(({label,value,icon:Icon})=><article key={label}><span><Icon size={20}/></span><small>{label}</small><strong>{value}</strong></article>)}</div><Feedback message={error}/>{creating&&<section className="saas-panel"><div className="saas-panel-heading"><h2>Nova conta de cliente</h2><button className="icon-button" aria-label="Fechar formulário" onClick={()=>setCreating(false)}><X/></button></div><form className="saas-form inline-form" onSubmit={create}><label>Nome da empresa<input name="name" required maxLength={120}/></label><label>E-mail do titular<input name="email" type="email" required/></label><label>Senha inicial<input name="password" type="password" minLength={6} required autoComplete="new-password"/></label><button disabled={busy} className="saas-button primary">Criar cliente</button></form></section>}
 <section className="saas-panel"><div className="saas-panel-heading"><div><h2>Contas da plataforma</h2><p>Selecione um cliente para gerenciar suas aplicações e configurações.</p></div><label className="saas-search"><span className="sr-only">Buscar clientes</span><input placeholder="Buscar empresa ou e-mail" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>{filtered.length?<div className="client-grid">{filtered.map(c=><article className="client-card" key={c.id}><div className="client-card-top"><span className="account-avatar">{c.nome.slice(0,2).toUpperCase()}</span><span className={`saas-badge ${c.suspended?"muted":(c.professional&&c.paidUntil&&new Date(c.paidUntil)>new Date())||new Date(c.trialEndsAt)>new Date()?"green":"amber"}`}>{c.suspended?"Suspenso":c.professional&&c.paidUntil&&new Date(c.paidUntil)>new Date()?"Assinatura ativa":new Date(c.trialEndsAt)>new Date()?"Em teste":"Teste encerrado"}</span></div><h3>{c.nome}</h3><p>{c.email || "Conta existente da operação"}</p><div className="client-counts"><span><MessageCircle size={16}/><strong>{c.instances}</strong>WhatsApp</span><span><Mail size={16}/><strong>{c.gmails}</strong>Gmail</span><span><Users size={16}/><strong>{c.users}</strong>Usuários</span></div><div className="client-card-actions"><Link className="saas-button primary" to={`/app?account=${c.id}`}>Abrir conta <ArrowRight size={16}/></Link><button className="text-button" disabled={busy} onClick={()=>void toggle(c)}>{c.suspended?"Reativar":"Suspender"}</button></div></article>)}</div>:<Empty icon={<Building2/>} title="Nenhum cliente encontrado" description="Crie uma conta ou ajuste sua busca para continuar."/>}</section></>;
}
function Overview({context:c,href}:{context:Context;href:(path?:string)=>string}) {
 const plan=planFor(c);
 const owner=c.role==="CLIENTE"||c.role==="ADMINISTRADOR";
 const steps=[
  {done:c.instances.length>0,label:"Cadastre seu primeiro WhatsApp",detail:"Adicione um número e conecte seu celular.",path:"/whatsapp"},
  {done:c.mailboxes.length>0,label:"Configure seu remetente Gmail",detail:"Verifique a conta que sua empresa vai utilizar.",path:"/gmail"},
  ...(owner?[{done:!!c.account?.logo,label:"Adicione o logo da sua marca",detail:"Deixe o espaço com a identidade da sua empresa.",path:"/marca"}]:[]),
  {done:c.users.length>0,label:"Traga sua equipe para perto",detail:"Organize os acessos das pessoas da sua conta.",path:"/equipe"},
 ];
 const completed=steps.filter(step=>step.done).length;
 const shortcuts=[
  {icon:MessageCircle,label:"WhatsApp",detail:"Aparelhos e conexões",path:"/whatsapp",tone:"green"},
  {icon:Mail,label:"Gmail",detail:"Contas e remetentes",path:"/gmail",tone:"blue"},
  {icon:Users,label:"Equipe",detail:"Pessoas e acessos",path:"/equipe",tone:"purple"},
  {icon:owner?Palette:UserRound,label:owner?"Sua marca":"Meu perfil",detail:owner?"Logo, nome e cores":"Seu nome e sua foto",path:owner?"/marca":"/perfil",tone:"orange"},
 ];
 return <>
  <section className="workspace-heading overview-intro" aria-labelledby="overview-title">
   <div className="overview-intro-copy"><span className="saas-eyebrow"><Sparkles size={14} aria-hidden="true"/> SEU ESPAÇO DE TRABALHO</span><h1 id="overview-title">Sua operação,<br/><em>mais conectada.</em></h1><p>Bem-vindo à {c.account?.brandName || "sua empresa"}. Seus canais, sua equipe e os próximos passos, em um só lugar.</p><Link className="saas-button primary" to={href("/integracoes")}>Gerenciar meus canais <ArrowRight size={17}/></Link></div>
   <div className="overview-plan-summary"><span className="overview-plan-icon"><PlugZap size={25} aria-hidden="true"/></span><small>SEU PLANO ATUAL</small><strong>{plan.tier==="PRO"?"Profissional":"Teste gratuito"}</strong><p>{plan.whatsappLimit} {plan.whatsappLimit===1?"WhatsApp":"WhatsApps"} <span aria-hidden="true">·</span> {plan.gmailLimit} {plan.gmailLimit===1?"Gmail":"Gmails"}</p>{owner?<Link to={href("/assinatura")}>Acompanhar assinatura <ArrowRight size={14}/></Link>:<span className="overview-plan-note">Conexões compartilhadas com sua equipe</span>}</div>
  </section>
  <div className="saas-metrics three overview-metrics">
   {[{icon:MessageCircle,label:"WhatsApps cadastrados",value:c.instances.length,detail:`de ${plan.whatsappLimit} ${plan.whatsappLimit===1?"vaga no plano":"vagas no plano"}`,tone:"green"},{icon:Mail,label:"Gmails verificados",value:c.mailboxes.length,detail:`de ${plan.gmailLimit} ${plan.gmailLimit===1?"vaga no plano":"vagas no plano"}`,tone:"blue"},{icon:Users,label:"Pessoas da equipe",value:c.users.length,detail:"usuários cadastrados neste espaço",tone:"purple"}].map(({icon:Icon,label,value,detail,tone})=><article key={label}><div className="overview-metric-head"><small>{label}</small><span className={`channel-icon ${tone}`}><Icon size={20} aria-hidden="true"/></span></div><strong>{value}</strong><p>{detail}</p></article>)}
  </div>
  <div className="overview-dashboard">
   <section className="saas-panel usage-panel"><div className="saas-panel-heading"><div><span className="saas-eyebrow">CAPACIDADE DOS CANAIS</span><h2>Uso do seu plano</h2></div><span className="saas-badge muted">{plan.tier==="PRO"?"Profissional":"Teste gratuito"}</span></div>{[{label:"WhatsApp",used:c.instances.length,limit:plan.whatsappLimit,icon:MessageCircle},{label:"Gmail",used:c.mailboxes.length,limit:plan.gmailLimit,icon:Mail}].map(({label,used,limit,icon:Icon})=><div className="usage-channel" key={label}><div><span><Icon size={18}/>{label}</span><strong>{used} de {limit}</strong></div><progress aria-label={`Uso de ${label}`} max={limit} value={Math.min(used,limit)}/><small>{used>=limit?"Todas as vagas deste canal estão em uso.":`${limit-used} ${limit-used===1?"vaga disponível":"vagas disponíveis"} para sua empresa.`}</small></div>)}{owner&&plan.tier==="TRIAL"&&<Link className="saas-button" to={href("/upgrade")}>Conhecer o plano Profissional <ArrowRight size={16}/></Link>}</section>
   <section className="saas-panel onboarding-panel"><div className="saas-panel-heading"><div><span className="saas-eyebrow">CONFIGURE SEU ESPAÇO</span><h2>Próximos passos</h2></div><span className="saas-badge muted">{completed} de {steps.length}</span></div><progress className="setup-progress" aria-label="Etapas de configuração concluídas" max={steps.length} value={completed}/>{steps.map(step=><Link key={step.label} to={href(step.path)}><span className={step.done?"step-complete":"step-pending"}>{step.done?<CheckCircle2 size={19}/>:<ChevronRight size={19}/>}</span><span><strong>{step.label}</strong><small>{step.detail}</small></span><ArrowRight size={15}/></Link>)}</section>
  </div>
  <section className="overview-shortcuts" aria-labelledby="shortcuts-title"><div className="overview-section-heading"><div><span className="saas-eyebrow">VÁ DIRETO AO QUE PRECISA</span><h2 id="shortcuts-title">Atalhos do dia a dia</h2></div><span>Uma rotina mais simples começa aqui.</span></div><div className="overview-shortcut-grid">{shortcuts.map(({icon:Icon,label,detail,path,tone})=><Link key={path} to={href(path)}><span className={`channel-icon ${tone}`}><Icon size={20}/></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={16}/></Link>)}</div></section>
 </>;
}
function Integrations({context:c,href}:{context:Context;href:(path?:string)=>string}) {
 const plan=planFor(c);const owner=c.role==="CLIENTE"||c.role==="ADMINISTRADOR";
 return <><PageTitle eyebrow="APLICAÇÕES" title="Central de integrações." description="Configure os canais da sua empresa. Escolha uma aplicação para conectar aparelhos ou gerenciar remetentes."/><div className="application-grid">{[{name:"WhatsApp",icon:MessageCircle,tone:"green",count:c.instances.length,limit:plan.whatsappLimit,description:"Gere o QR Code, vincule um aparelho e acompanhe a conexão. Você pode desconectar ou trocar o número quando precisar.",path:"/whatsapp"},{name:"Gmail",icon:Mail,tone:"red",count:c.mailboxes.length,limit:plan.gmailLimit,description:"Adicione um remetente com a senha de aplicativo do Google. Verifique, organize e remova as contas de e-mail deste espaço.",path:"/gmail"}].map(({name,icon:Icon,tone,count,limit,description,path})=><article className="application-card" key={name}><div><span className={`feature-symbol ${tone}`}><Icon size={30}/></span><span className="saas-badge muted">{count} de {limit} vagas utilizadas</span></div><h2>{name}</h2><p>{description}</p><div className="integration-resources">{name==="WhatsApp"?c.instances.length?c.instances.map(i=><span key={i.id}><MessageCircle size={13}/>{i.name}</span>):<small>Nenhum número cadastrado.</small>:c.mailboxes.length?c.mailboxes.map(m=><span key={m.id}><CheckCircle2 size={13}/>{m.email}</span>):<small>Nenhum Gmail configurado.</small>}</div><Link className="saas-button primary" to={href(path)}>Gerenciar {name}<ArrowRight size={17}/></Link></article>)}</div>{owner&&plan.tier==="TRIAL"&&<section className="saas-welcome"><div className="welcome-art"><PlugZap size={37}/></div><div><span className="saas-eyebrow">SUA EMPRESA PODE IR ALÉM</span><h2>No Profissional: três WhatsApps e dois Gmails.</h2><p>Conheça os benefícios e experimente a compra com Pix ou cartão fictícios.</p><div><Link to={href("/upgrade")}>Ver benefícios e ampliar meu plano <ArrowRight size={16}/></Link></div></div></section>}</>;
}
export function Mailboxes({context:c,accountId,reload}:{context:Context;accountId:string|null;reload:()=>Promise<void>}) {
 const mailboxes=Array.isArray(c?.mailboxes)?c.mailboxes:[];
 const navigate=useNavigate(); const plan=planFor(c); const full=mailboxes.length>=plan.gmailLimit;
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);const manager=c.role==="CLIENTE"||c.role==="ADMINISTRADOR";
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(full){navigate(workspaceLink("/upgrade",accountId,"gmail"));return;}const form=e.currentTarget;setBusy(true);setError("");try{await platformRequest("/mailboxes",accountId,"POST",Object.fromEntries(new FormData(form)));form.reset();await reload();notify("Gmail verificado e configurado.","success");}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function remove(id:number){if(!window.confirm("Remover a configuração deste Gmail?"))return;setBusy(true);try{await platformRequest(`/mailboxes/${id}`,accountId,"DELETE");await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><PageTitle eyebrow="INTEGRAÇÕES / GMAIL" title="Cada remetente no seu lugar." description="Configure várias contas Gmail, com um nome para cada uso da sua empresa."/><Feedback message={error}/><div className="saas-two-column"><section className="saas-panel"><div className="saas-panel-heading"><h2>Contas do Gmail</h2><span className="feature-symbol red"><Mail/></span></div>{mailboxes.length?<div className="resource-list">{mailboxes.map(m=><article key={m.id}><span className="channel-icon red"><Mail size={20}/></span><div><strong>{m.name}</strong><small>{m.email}</small></div><span className="saas-badge green">Verificado</span>{manager&&<button className="text-button danger" disabled={busy} onClick={()=>void remove(m.id)}>Remover</button>}</article>)}</div>:<Empty icon={<Mail/>} title="Seu primeiro remetente começa aqui." description="Adicione uma conta Gmail para organizar os canais de e-mail da sua empresa."/>}</section>{manager&&<section className="saas-panel">{full?<div className="quota-upsell"><span className="feature-symbol purple"><Mail/></span><h2>Sua vaga de Gmail está em uso.</h2><p>Seu plano inclui {plan.gmailLimit} {plan.gmailLimit===1?"conta":"contas"}. Conheça os benefícios para ampliar seus canais.</p><Link className="saas-button primary" to={workspaceLink("/upgrade",accountId,"gmail")}>Liberar mais Gmails <ArrowRight size={17}/></Link></div>:<><h2>Adicionar Gmail</h2><p className="saas-muted">Use uma senha de aplicativo do Google. A conexão é verificada antes de salvar.</p><form className="saas-form" onSubmit={submit}><label>Nome da conta<input name="name" required placeholder="Ex.: Financeiro" maxLength={120}/></label><label>E-mail Gmail<input name="email" type="email" required placeholder="empresa@gmail.com"/></label><label>Senha de aplicativo<input name="password" type="password" required autoComplete="new-password"/></label><button disabled={busy||!c.active} className="saas-button primary">{busy?<RefreshCw className="spin" size={17}/>:<Plus size={17}/>}Verificar e adicionar</button><small>As credenciais são protegidas no servidor e não aparecem para os usuários da equipe.</small></form></>}</section>}</div></>;
}
function Brand({ context, accountId, colors, onSaved }: {
 context: Context;
 accountId: string | null;
 colors: BrandColors;
 onSaved: (brand: BrandDraft) => void;
}) {
 const account = context.account!;
 const saved = { name: account.brandName, logo: account.logo ?? "", ...colors };
 const [draft, setDraft] = useState<BrandDraft>(saved);
 const [saving, setSaving] = useState(false);
 const [readingLogo, setReadingLogo] = useState(false);
 const [error, setError] = useState("");
 const busy = saving || readingLogo;
 const dirty = draft.name !== saved.name || draft.logo !== saved.logo || draft.primary.toLowerCase() !== saved.primary.toLowerCase() || draft.accent.toLowerCase() !== saved.accent.toLowerCase();

 function upload(file: File | undefined) {
  if (!file) return;
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 280000) {
   setError("Envie um PNG, JPG ou WebP de até 280 KB.");
   return;
  }
  setError("");
  setReadingLogo(true);
  const reader = new FileReader();
  reader.onload = () => setDraft(current => ({ ...current, logo: String(reader.result) }));
  reader.onerror = () => setError("Não foi possível ler a imagem. Escolha outro arquivo.");
  reader.onloadend = () => setReadingLogo(false);
  reader.readAsDataURL(file);
 }

 async function save(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (busy || !context.active) return;
  const brand = { ...draft, name: draft.name.trim() };
  if (!brand.name) {
   setError("Informe o nome da marca.");
   return;
  }
  setSaving(true);
  setError("");
  try {
   await platformRequest("/brand", accountId, "PUT", brand);
   onSaved(brand);
   setDraft(brand);
   notify("Sua identidade foi atualizada.", "success");
  } catch (error) {
   setError(error instanceof Error ? error.message : "Não foi possível salvar a marca.");
  } finally {
   setSaving(false);
  }
 }

 return <>
  <PageTitle eyebrow="IDENTIDADE" title="Sua marca" description="Personalize seu espaço e veja o resultado antes de aplicar as mudanças."/>
  <form className="saas-panel brand-settings-card" onSubmit={save} style={brandStyle(draft)}>
   <section className="brand-live-preview" aria-label="Prévia da marca">
    <div className="brand-live-preview-heading"><div><span className="saas-eyebrow">PRÉVIA AO VIVO</span><h2>Assim sua equipe verá o espaço</h2></div><span className="saas-badge muted">Ainda não aplicada</span></div>
    <div className="product-preview brand-live-preview-card">
     <div className="preview-browser"><span/><span/><span/><small>VISÃO GERAL</small></div>
     <div className="preview-content">
      <div className="preview-greeting">
       <span className="preview-monogram">{draft.logo ? <img src={draft.logo} alt="Prévia do logo"/> : <BrandLogo compact/>}</span>
       <div><small>SEU ESPAÇO DE TRABALHO</small><h3>{draft.name.trim() || "Sua empresa"}</h3></div>
       <span className="live-badge">Tudo em um lugar</span>
      </div>
      <h2>O próximo passo fica mais simples.</h2>
      <div className="preview-stats">
       <article><MessageCircle/><strong>WhatsApp</strong><small>Vários números, uma operação</small></article>
       <article><Mail/><strong>Gmail</strong><small>Cada remetente no seu lugar</small></article>
      </div>
      <div className="brand-live-preview-colors"><span><i style={{backgroundColor:draft.primary}}/>Cor principal <code>{draft.primary}</code></span><span><i style={{backgroundColor:draft.accent}}/>Cor de destaque <code>{draft.accent}</code></span></div>
     </div>
    </div>
   </section>
   <div className="brand-editor-form">
   <div className="brand-controls-heading"><div><span className="saas-eyebrow">PERSONALIZAÇÃO</span><h2>Edite sua marca</h2><p>As mudanças aparecem na prévia acima e só são aplicadas depois de salvar.</p></div><Palette size={22}/></div>
   <fieldset className="saas-form brand-editor-fields" disabled={busy}>
    <label>Nome da marca<input required maxLength={120} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
    <div className="brand-logo-control"><label>Logo da empresa<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { upload(event.target.files?.[0]); event.target.value = ""; }}/></label><small>PNG, JPG ou WebP de até 280 KB.</small>{draft.logo && <button className="text-button" type="button" onClick={() => setDraft({ ...draft, logo: "" })}>Remover logo</button>}</div>
    <div className="color-fields">
     <label className="brand-color-field"><span><strong>Cor principal</strong><code>{draft.primary}</code></span><input type="color" aria-label="Cor principal" value={draft.primary} onChange={event => setDraft({ ...draft, primary: event.target.value })}/></label>
     <label className="brand-color-field"><span><strong>Cor de destaque</strong><code>{draft.accent}</code></span><input type="color" aria-label="Cor de destaque" value={draft.accent} onChange={event => setDraft({ ...draft, accent: event.target.value })}/></label>
    </div>
    <div className="brand-preset-options">
     <button className="saas-button" type="button" onClick={() => setDraft({ ...draft, ...originalColors })}>Cores originais</button>
     <button className="saas-button" type="button" onClick={() => setDraft({ ...draft, ...consorTechColors })}>Azul-escuro e azul-claro</button>
    </div>
   </fieldset>
   <Feedback message={error}/>
   {!context.active && <p>Ative sua assinatura para salvar a marca.</p>}
   <div className="brand-editor-actions"><span>{dirty ? "Você tem alterações que ainda não foram salvas." : "Sua marca está atualizada."}</span><button className="saas-button primary" disabled={busy || !context.active || !dirty}><Check size={17}/>{saving ? "Salvando…" : "Salvar identidade"}</button></div>
   </div>
  </form>
 </>;
}
function Subscription({context:c,accountId}:{context:Context;accountId:string|null;reload:()=>Promise<void>}) {
 const plan=planFor(c);const paid=plan.tier==="PRO";const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function openPortal(){setBusy(true);setError("");try{const session=await platformRequest<{url:string}>("/subscription/portal",accountId,"POST");window.location.assign(session.url);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <><PageTitle eyebrow="SUA CONTA" title="Um plano para o seu próximo passo." description="Acompanhe seu teste gratuito e escolha como ampliar suas conexões."/><Feedback message={error}/><section className="subscription-card"><div><span className="saas-badge green">{paid?"Plano Profissional":"Teste gratuito · 3 dias"}</span><h2>{paid?"Sua empresa tem mais espaço.":"Comece com um canal de cada vez."}</h2><p>{paid?`Seu acesso está ativo até ${date(c.account!.paidUntil)}.`:`Seu teste termina em ${date(c.account!.trialEndsAt)}. Ele inclui um WhatsApp e um Gmail. Amplie o plano para conectar mais contas.`}</p><ul><li><CheckCircle2/>{plan.whatsappLimit} {plan.whatsappLimit===1?"instância de WhatsApp":"instâncias de WhatsApp"}</li><li><CheckCircle2/>{plan.gmailLimit} {plan.gmailLimit===1?"conta Gmail":"contas Gmail"}</li><li><CheckCircle2/>Equipe e identidade da sua empresa</li></ul></div><div className="subscription-action"><CreditCard size={36}/><h3>{paid?"Plano ativo":"Conheça o Profissional"}</h3><p>{paid?"Gerencie suas conexões dentro das vagas do seu plano.":"Até três WhatsApps e dois Gmails, com contratação mensal pelo Stripe ou simulação local."}</p>{paid&&c.subscription?.billingProvider==="STRIPE"&&<button className="saas-button" disabled={busy} onClick={()=>void openPortal()}>{busy?<RefreshCw className="spin" size={17}/>:<CreditCard size={17}/>}Gerenciar assinatura no Stripe</button>}<Link className="saas-button primary" to={workspaceLink(paid?"/integracoes":"/upgrade",accountId)}>{paid?"Gerenciar integrações":c.stripeEnabled?"Ver plano mensal":"Ver benefícios e simular compra"}<ArrowRight size={17}/></Link>{c.subscription?.billingProvider!=="STRIPE"&&<small>{c.simulationEnabled?"Ambiente de simulação. Nenhuma cobrança real.":"A cobrança real ainda não está configurada."}</small>}</div></section></>;
}
export function PageTitle({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) {return <div className="workspace-heading"><div><span className="saas-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></div>;}
