import {useCallback} from "react";
import {backend} from "../services/backend";
import {operationError} from "../services/operationErrors";
import {useResource} from "../hooks/useResource";
import {EmptyState,ErrorState,Skeleton} from "./DataUi";
import {formatDate,readable} from "../services/format";

export default function OperationHistory({processId}:{processId:number}) {
 const load=useCallback((signal:AbortSignal)=>backend.operation.history(processId,signal).catch(operationError),[processId]);
 const result=useResource(load);
 const items=Array.isArray(result.data?.items)?result.data.items:Array.isArray(result.data)?result.data:[];
 return <section className="panel data-panel"><h3>Histórico de comunicações</h3>{result.loading?<Skeleton/>:result.error?<ErrorState message={result.error} retry={result.refresh}/>:items.length?<ol className="operation-history">{items.map((e,idx)=><li key={e?.id??idx}><strong>{e?.canal?readable(e.canal):e?.acao||"Comunicação"} · {readable(e?.status||"PENDENTE")}</strong><p>{formatDate(e?.data)} · {e?.usuarioNome||"Responsável não informado"}</p>{e?.observacao?<p>{e.observacao}</p>:null}</li>)}</ol>:<EmptyState title="Nenhuma comunicação registrada" description="As tentativas de contato aparecerão aqui quando registradas."/>}</section>;
}
