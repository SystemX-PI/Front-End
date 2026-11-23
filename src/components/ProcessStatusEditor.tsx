import {useState,type FormEvent} from 'react';
import {backend,type ProcessResponse,type ProcessStatus} from '../services/backend';
import ConfirmDialog from './ConfirmDialog';
import {readable} from '../services/format';
const statuses:ProcessStatus[]=['CONTEMPLADO','AGUARDANDO_COMUNICACAO','EM_COMUNICACAO','CLIENTE_CONTATADO','AGUARDANDO_DOCUMENTOS','DOCUMENTOS_RECEBIDOS','EM_ANALISE','EM_PROCESSO_DE_BAIXA','CANCELADO'];
export default function ProcessStatusEditor({process,onChange}:{process:ProcessResponse;onChange:(p:ProcessResponse)=>void}){
 const [status,setStatus]=useState<ProcessStatus>(process.status);const [note,setNote]=useState('');const [confirm,setConfirm]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function update(){if(busy)return;setConfirm(false);setBusy(true);setError('');try{onChange(await backend.processes.updateStatus(process.id,{status,observacao:note.trim()}));setNote('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function submit(e:FormEvent){e.preventDefault();setConfirm(true);}
 if(['FINALIZADO','CANCELADO'].includes(process.status))return <p>Processo encerrado. A alteração de status está indisponível.</p>;
 return <form className="panel admin-form" onSubmit={submit}><h3>Atualizar andamento</h3><p>Para encerrar o processo, use a conferência de baixa.</p><label className="field">Novo status<select value={status} onChange={e=>setStatus(e.target.value as ProcessStatus)}>{statuses.map(s=><option key={s} value={s}>{readable(s)}</option>)}</select></label><label className="field">Observação do andamento<textarea value={note} maxLength={255} onChange={e=>setNote(e.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className="button secondary" disabled={busy||status===process.status}>Atualizar andamento</button><ConfirmDialog open={confirm} title={'Alterar andamento para '+readable(status)+'?'} description="Confira o novo status e a observação." confirmLabel="Confirmar alteração" onCancel={()=>setConfirm(false)} onConfirm={()=>void update()}/></form>;
}
