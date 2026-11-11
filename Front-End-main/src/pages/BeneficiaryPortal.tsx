import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { InlineFeedback } from "../components/IntegrationUi";
import { logout } from "../services/auth";
import { backend } from "../services/backend";
import { useResource } from "../hooks/useResource";
import { formatDate, readable } from "../services/format";

export default function BeneficiaryPortal() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState("processo");
  const load = useCallback((signal: AbortSignal) => backend.portal.list(page - 1, signal), [page]);
  const list = useResource(load);
  useEffect(() => {
    if (list.data) setSelected(current => list.data!.items.some(p => p.id === current) ? current : list.data!.items[0]?.id ?? null);
  }, [list.data]);
  const loadDetail = useCallback((signal: AbortSignal) => selected === null ? Promise.resolve(null) : backend.portal.get(selected, signal), [selected]);
  const detail = useResource(loadDetail);
  async function leave() {
    try { await logout(); navigate("/login", { replace: true }); }
    catch (e) { navigate("/login", { replace: true, state: { logoutWarning: e instanceof Error ? e.message : "Falha ao encerrar sessao." } }); }
  }
  return <div className="portal-page">
    <header className="portal-header"><div className="portal-brand"><BrandLogo compact /><span>Portal do Cliente</span></div><span>{localStorage.getItem("userEmail")}</span><ThemeSwitcher /><button className="button secondary" onClick={() => void leave()}>Sair</button></header>
    <main className="portal-content">
      <section className="portal-hero"><h1>Meus processos</h1><p>Acompanhe os processos vinculados a sua conta.</p></section>
      {list.error && <InlineFeedback kind="error" message={list.error} />}
      <button className="button secondary" onClick={() => { list.refresh(); detail.refresh(); }}>Atualizar</button>
      {list.loading ? <p role="status">Carregando processos...</p> : !list.data?.items.length ? <InlineFeedback kind="info" message="Nenhum processo vinculado a esta conta." /> : <>
        <label className="field"><span>Processo</span><select value={selected ?? ""} onChange={e => setSelected(Number(e.target.value))}>{list.data.items.map(p => <option key={p.id} value={p.id}>#{p.id} - {readable(p.status)}</option>)}</select></label>
        <div className="form-actions"><button className="button secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Pagina {page}</span><button className="button secondary" disabled={page * 20 >= list.data.total} onClick={() => setPage(p => p + 1)}>Proxima</button></div>
        <nav className="portal-tabs" aria-label="Informacoes do processo">{["processo", "documentos", "historico"].map(value => <button className={`portal-tab ${tab === value ? "active" : ""}`} aria-pressed={tab === value} key={value} onClick={() => setTab(value)}>{readable(value)}</button>)}</nav>
        {detail.error && <InlineFeedback kind="error" message={detail.error} />}
        {detail.loading ? <p role="status">Carregando detalhes...</p> : detail.data && <section className="portal-panel">
          {tab === "processo" && <><h2>Processo #{detail.data.processo.id}</h2><dl><dt>Situacao</dt><dd>{readable(detail.data.processo.status)}</dd><dt>Responsavel</dt><dd>{detail.data.responsavel || "Ainda nao atribuido"}</dd><dt>Cota</dt><dd>{detail.data.cota}</dd><dt>Credito</dt><dd>{detail.data.valorCredito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</dd><dt>Atualizado em</dt><dd>{formatDate(detail.data.processo.atualizadoEm || detail.data.processo.criadoEm)}</dd></dl></>}
          {tab === "documentos" && <><h2>Documentos</h2><p>Ate 100 registros mais recentes.</p>{detail.data.documentos.length ? detail.data.documentos.map(d => <article className="panel" key={d.id}><h3>{readable(d.tipo)}</h3><p>{readable(d.status)}</p><p>{d.nomeArquivo}</p><p>{d.observacao}</p></article>) : <p>Nenhum documento registrado.</p>}</>}
          {tab === "historico" && <><h2>Historico</h2><p>Ate 100 movimentacoes mais recentes.</p>{detail.data.historico.length ? detail.data.historico.map(h => <article className="panel" key={h.id}><h3>{readable(h.novoStatus)}</h3><p>{formatDate(h.data)}</p><p>{h.observacao}</p></article>) : <p>Nenhuma movimentacao registrada.</p>}</>}
        </section>}
      </>}
    </main>
  </div>;
}
