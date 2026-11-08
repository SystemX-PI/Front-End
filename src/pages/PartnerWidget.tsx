import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Code2, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import { planFor, platformRequest, workspaceLink, type Context } from "../services/platform";

type Installation = { accountId: number; origin: string | null; key: string | null };

export default function PartnerWidget({ context, accountId }: { context: Context; accountId: string | null }) {
  const eligible = planFor(context).tier === "PRO" && !context.account?.suspended;
  const [installation, setInstallation] = useState<Installation | null>(null);
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(true);
  const [confirm, setConfirm] = useState<"rotate" | "remove" | null>(null);

  useEffect(() => {
    if (!eligible) return;
    let current = true;
    void platformRequest<Installation>("/widget", accountId).then((value) => {
      if (!current) return;
      setInstallation(value);
      setOrigin(value.origin ?? "");
    }).catch((err: Error) => { if (current) setError(err.message); })
      .finally(() => { if (current) setBusy(false); });
    return () => { current = false; };
  }, [accountId, eligible]);

  async function update(action: "rotate" | "remove") {
    setBusy(true);
    setError("");
    setFeedback("");
    setConfirm(null);
    try {
      if (action === "remove") {
        await platformRequest<void>("/widget", accountId, "DELETE");
        setInstallation(null);
        setOrigin("");
        setFeedback("Widget desativado.");
      } else {
        const result = await platformRequest<Installation>("/widget", accountId, "PUT", { origin });
        setInstallation(result);
        setOrigin(result.origin ?? "");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    if (installation?.origin) setConfirm("rotate");
    else void update("rotate");
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback("Copiado.");
    } catch {
      setFeedback("Selecione e copie o texto exibido.");
    }
  }

  const base = window.location.origin;
  const snippet = `<script src="${base}/widget-parceiro.js" data-session-url="/systemx/sessao" defer></script>`;
  const contract = `POST ${base}/api/widget/session
Content-Type: application/json
X-Widget-Key: <chave no servidor do parceiro>

{ "accountId": ${installation?.accountId ?? 0} }`;

  return <>
    <div className="workspace-heading">
      <div>
        <span className="saas-eyebrow">INTEGRAÇÕES / WIDGET PARCEIRO</span>
        <h1>SystemX dentro do seu sistema</h1>
        <p>Adicione um chat para acompanhar notificações de WhatsApp e Gmail sem sair da sua aplicação.</p>
      </div>
    </div>
    {!eligible ? <section className="saas-panel quota-upsell">
      <span className="feature-symbol purple"><MessageCircle /></span>
      <h2>Disponível no plano Profissional</h2>
      <p>Com o plano ativo, você pode instalar o chat e consultar o volume e a situação dos envios por canal e período.</p>
      <Link className="saas-button primary" to={workspaceLink("/upgrade", accountId, "widget")}>Conhecer o plano Profissional</Link>
    </section> : <div className="saas-two-column">
      <section className="saas-panel">
        <span className="feature-symbol purple"><ShieldCheck /></span>
        <h2>Autorizar o sistema parceiro</h2>
        <p>Cadastre o endereço em que o chat poderá funcionar. Cada conta pode autorizar um endereço.</p>
        <form className="saas-form" onSubmit={save}>
          <label>Endereço do sistema parceiro
            <input type="url" value={origin} onChange={(event) => setOrigin(event.target.value)}
              placeholder="https://sistema.suaempresa.com.br" required maxLength={255} />
          </label>
          <button className="saas-button primary" disabled={busy}>
            {installation?.origin ? "Salvar e trocar chave" : "Ativar widget"}
          </button>
        </form>
        {installation?.origin && <button type="button" className="text-button danger" disabled={busy}
          onClick={() => setConfirm("remove")}>Desativar widget</button>}
        {confirm && <div role="group" aria-label="Confirmar alteração">
          <p>{confirm === "rotate" ? "A chave atual e as sessões abertas perderão o acesso." : "O chat deixará de funcionar no sistema parceiro."}</p>
          <button className="saas-button" onClick={() => setConfirm(null)}>Cancelar</button>{" "}
          <button className="saas-button primary" onClick={() => void update(confirm)}>Confirmar</button>
        </div>}
        {error && <p className="saas-error" role="alert">{error}</p>}
        {feedback && <p role="status">{feedback}</p>}
      </section>
      <section className="saas-panel saas-form">
        <span className="feature-symbol purple"><Code2 /></span>
        <h2>Instalar o chat</h2>
        {!installation?.origin ? <p>Ative o widget para receber o código de instalação.</p> : <>
          {installation.key && <label>Chave de instalação · exibida apenas agora
            <input value={installation.key} readOnly autoComplete="off" />
            <button className="saas-button" onClick={() => void copy(installation.key!)}><Copy size={16} />Copiar chave</button>
          </label>}
          <p>1. No servidor parceiro, crie <code>POST /systemx/sessao</code>. Valide o login e a permissão do usuário e faça a chamada abaixo. Devolva o JSON recebido com <code>Cache-Control: no-store</code>.</p>
          <textarea readOnly rows={5} value={contract} aria-label="Requisição do servidor parceiro" />
          <p>2. Cole este código na página autenticada do parceiro. Guarde a chave de instalação no servidor parceiro.</p>
          <textarea readOnly rows={3} value={snippet} aria-label="Código de instalação" />
          <button className="saas-button" onClick={() => void copy(snippet)}><Copy size={16} />Copiar código de instalação</button>
        </>}
      </section>
    </div>}
  </>;
}
