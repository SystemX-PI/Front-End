import { useState, type ReactNode } from "react";
import { digits, formatPhone, readable } from "../services/format";
import { useResource } from "../hooks/useResource";
import { EmptyState, ErrorState, Pagination, Skeleton } from "./DataUi";
import { DirectoryContext, loadProcesses, processName, processReference, type Directory, type ProcessOption } from "./process-directory";

const pageSize = 10;
const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function ProcessDirectoryProvider({ children }: { children: ReactNode }) {
  const directory = useResource(loadProcesses);
  return <DirectoryContext.Provider value={directory}>{children}</DirectoryContext.Provider>;
}

export default function ProcessPicker({ directory, selectedId, onSelect, mode = "all", disabled = false, filter }: {
  directory: Directory;
  selectedId: number | null;
  onSelect: (item: ProcessOption) => void;
  mode?: "all" | "open" | "closure";
  disabled?: boolean;
  filter?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const term = normalize(query);
  const phone = /^[+\d() .-]+$/.test(term) ? digits(term) : "";
  const filtered = (directory.data?.items ?? []).filter(item => {
    if (mode === "closure" && item.statusProcesso !== "EM_PROCESSO_DE_BAIXA") return false;
    if (mode === "open" && ["FINALIZADO", "CANCELADO"].includes(item.statusProcesso)) return false;
    return !term || [item.name, item.email, item.phone, item.origem, item.idExterno].some(value => value && normalize(value).includes(term))
      || Boolean(phone && item.phone && digits(item.phone).includes(phone));
  });
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <section className="panel data-panel process-picker">
    <div className="data-panel-heading"><h2>{mode === "closure" ? "Processos em baixa" : "Processos disponíveis"}</h2><button type="button" className="button secondary compact" disabled={directory.loading || disabled} onClick={directory.refresh}>Atualizar</button></div>
    {filter}
    <label className="field">Buscar processo<input type="search" value={query} placeholder="Nome, e-mail, WhatsApp, origem ou código externo" onChange={event => { setQuery(event.target.value); setPage(1); }}/></label>
    {directory.data?.namesUnavailable && <p role="status">Os nomes estão indisponíveis. Busque pelo contato ou pela referência externa.</p>}
    {directory.loading ? <Skeleton rows={3}/> : directory.error ? <ErrorState message={directory.error} retry={directory.refresh}/> : visible.length ? <>
      <div className="process-options">{visible.map(item => <button key={item.processoId} type="button" className="process-option" aria-pressed={selectedId === item.processoId} disabled={disabled} onClick={() => onSelect(item)}>
        <span><strong>{processName(item)}</strong><small>{processReference(item)}</small>{(item.email || item.phone) && <small>{[item.email, item.phone && formatPhone(item.phone)].filter(Boolean).join(" · ")}</small>}</span>
        <span className="process-option-status">{readable(item.statusProcesso)}</span>
      </button>)}</div>
      <Pagination page={currentPage} size={pageSize} total={filtered.length} onChange={setPage}/>
    </> : <EmptyState title={query ? "Nenhum processo encontrado" : mode === "closure" ? "Nenhuma baixa pendente" : "Nenhum processo disponível"} description={query ? "Tente outro nome, contato ou código externo." : "Os processos da fila aparecerão aqui quando estiverem disponíveis."}/>}
  </section>;
}
