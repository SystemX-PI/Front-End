import {useCallback,useState} from "react";
import AdminShell from "../components/AdminShell";
import {backend} from "../services/backend";
import {useResource} from "../hooks/useResource";
import {useDebouncedValue} from "../hooks/useDebouncedValue";
import {EmptyState,ErrorState,Pagination,Skeleton} from "../components/DataUi";
import {operationError} from "../services/operationErrors";
import {formatDate} from "../services/format";
export default function Audit(){
 const [search,setSearch]=useState('');const [page,setPage]=useState(1);const q=useDebouncedValue(search);
 const load=useCallback((signal:AbortSignal)=>backend.operation.audit(page-1,q,signal).catch(operationError),[page,q]);const result=useResource(load);
 return <AdminShell title="Auditoria" subtitle="Rastreabilidade das ações da operação"><section className="panel data-panel"><h2>Histórico de ações</h2><label className="field">Buscar ações<input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label>{result.loading?<Skeleton/>:result.error?<ErrorState message={result.error} retry={result.refresh}/>:result.data?.items.length?<><div className="table-scroll"><table className="admin-table"><thead><tr><th>Data</th><th>Ação</th><th>Responsável</th><th>Registro</th><th>Detalhes</th></tr></thead><tbody>{result.data.items.map(e=><tr key={e.id}><td>{formatDate(e.data)}</td><td>{e.acao}</td><td>{e.usuarioNome||'Não informado'}</td><td>{e.entidade} {e.registroId}</td><td>{e.observacao}</td></tr>)}</tbody></table></div><Pagination page={page} total={result.data.total} size={20} onChange={setPage}/></>:<EmptyState title="Nenhuma ação registrada" description="Os eventos de auditoria aparecerão aqui quando disponíveis."/>}</section></AdminShell>;
}
