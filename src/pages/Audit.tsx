import {useCallback,useState} from "react";
import AdminShell from "../components/AdminShell";
import {backend} from "../services/backend";
import {useResource} from "../hooks/useResource";
import {useDebouncedValue} from "../hooks/useDebouncedValue";
import {EmptyState,ErrorState,Pagination,Skeleton} from "../components/DataUi";
import {operationError} from "../services/operationErrors";
import {formatDate} from "../services/format";
export default function Audit({companyId, embedded = false, tenant = false}: {companyId?:number; embedded?:boolean; tenant?:boolean}){
 const [search,setSearch]=useState('');const [page,setPage]=useState(1);const q=useDebouncedValue(search);
 const [action, setAction] = useState('');
 const [date, setDate] = useState('');
 const [company, setCompany] = useState('');
 const scope = companyId ?? (Number(company) > 0 ? Number(company) : undefined);
 const load=useCallback((signal:AbortSignal)=>backend.operation.audit(page-1,q,action,date,signal,{companyId: scope, tenant}).catch(operationError),[page,q,action,date,scope,tenant]);const result=useResource(load);
 const content = <section className="panel data-panel"><h2>Histórico de ações</h2><div className="admin-audit-filters"><label className="field">{tenant ? "Buscar ação ou ID do processo" : "Buscar por ação, e-mail do operador ou ID"}<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>
 <label className="field">Tipo de ação<select value={action} onChange={event => { setAction(event.target.value); setPage(1); }}>
 <option value="">Todas as ações</option>
 {["Solicitação de WhatsApp", "Alteração de status", "Baixa concluída", ...(!tenant ? ["Empresa cadastrada", "Empresa suspensa", "Empresa reativada"] : [])].map(value => <option key={value}>{value}</option>)}
 </select></label>
 <label className="field">Data (horário universal)<input type="date" value={date} onChange={event => { setDate(event.target.value); setPage(1); }}/></label>
 {!tenant && !companyId && <label className="field">ID da empresa<input type="number" min={1} value={company} onChange={e=>{setCompany(e.target.value);setPage(1);}}/></label>}
 </div>{result.loading?<Skeleton/>:result.error?<ErrorState message={result.error} retry={result.refresh}/>:result.data?.items.length?<><div className="table-scroll"><table className="admin-table admin-table-cards" role="table"><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Data</th><th role="columnheader" scope="col">Ação</th><th role="columnheader" scope="col">Responsável</th><th role="columnheader" scope="col">Registro</th>{!tenant && <th role="columnheader" scope="col">Empresa</th>}<th role="columnheader" scope="col">Detalhes</th></tr></thead><tbody role="rowgroup">{result.data.items.map(e=><tr role="row" key={e.id}><td role="cell" data-label="Data">{formatDate(e.data)}</td><td role="cell" data-label="Ação">{e.acao}</td><td role="cell" data-label="Responsável">{e.usuarioNome||'Não informado'}</td><td role="cell" data-label="Registro">{e.entidade} {e.registroId}</td>{!tenant && <td role="cell" data-label="Empresa">{e.contaId ?? "—"}</td>}<td role="cell" data-label="Detalhes">{e.observacao ? <details><summary>Ver detalhes</summary><p>{e.observacao}</p></details> : "—"}</td></tr>)}</tbody></table></div><Pagination page={page} total={result.data.total} size={20} onChange={setPage}/></>:<EmptyState title="Nenhuma ação registrada" description="Os eventos de auditoria aparecerão aqui quando disponíveis."/>}</section>;
 return embedded ? content : <AdminShell title={tenant ? "Histórico" : "Auditoria"} subtitle={tenant ? "Ações registradas nos processos da sua empresa" : "Rastreabilidade das ações da plataforma"}>{content}</AdminShell>;
}
