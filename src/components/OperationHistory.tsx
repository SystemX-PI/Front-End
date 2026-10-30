import {useCallback} from "react";
import {backend} from "../services/backend";
import {operationError} from "../services/operationErrors";
import {useResource} from "../hooks/useResource";
import {EmptyState,ErrorState,Skeleton} from "./DataUi";
import {formatDate,readable} from "../services/format";

export default function OperationHistory({processId}:{processId:number}) {
 const load=useCallback((signal:AbortSignal)=>backend.operation.history(processId,signal).catch(operationError),[processId]);
 const result=useResource(load);
 return <section className="panel data-panel"><h3>Histórico de comunicações</h3>{result.loading?<Skeleton/>:result.error?<ErrorState message={result.error} retry={result.refresh}/>:result.data?.items.length?<ol className="operation-history">{result.data.items.map(e=><li key={e.id}><strong>{e.canal?readable(e.canal):e.acao} · {readable(e.status||"PENDENTE")}</strong><p>{formatDate(e.data)} · {e.usuarioNome||"Responsável não informado"}</p><p>{e.observacao}</p></li>)}</ol>:<EmptyState title="Nenhuma comunicação registrada" description="As tentativas de contato aparecerão aqui quando registradas."/>}</section>;
}
