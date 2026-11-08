import { createContext, useContext, useState, type ReactNode } from "react";
import { apiRequest, type PageResponse, type QueueItem, type UserResponse } from "../services/backend";
import { digits, formatPhone, readable } from "../services/format";
import { useResource } from "../hooks/useResource";
import { EmptyState, ErrorState, Pagination, Skeleton } from "./DataUi";

export type ProcessOption = QueueItem & { name?: string; email?: string; phone?: string };
const pageSize = 10;
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

async function list<T>(endpoint: string, signal: AbortSignal) {
  const pageAt = (page: number) => apiRequest<PageResponse<T>>(`${endpoint}?page=${page}&size=100`, { signal });
  const first = await pageAt(0);
  const items = [...first.items];
  for (let page = 1; items.length < first.total; page++) {
    const next = await pageAt(page);
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return items;
}

async function loadProcesses(signal: AbortSignal) {
  const queue = await list<QueueItem>("/api/integracoes/comunicacoes/fila/pagina", signal);
  let namesUnavailable = false;
  const clients = queue.some(item => item.comunicacao.email?.destinatario)
    ? await list<UserResponse>("/api/clientes/pagina", signal).catch(error => {
      if (signal.aborted) throw error;
      namesUnavailable = true;
      return [];
    }) : [];
  const names = new Map(clients.map(client => [client.email.trim().toLowerCase(), client.nome]));
  return { namesUnavailable, items: [...new Map(queue.map(item => [item.processoId, item])).values()].map((item): ProcessOption => {
    const email = item.comunicacao.email?.destinatario?.trim();
    const phone = item.comunicacao.whatsapp?.destinatario?.trim();
    return { ...item, email, phone, name: email ? names.get(email.toLowerCase()) : undefined };
  }) };
}

export function processName(item: ProcessOption) {
  return item.name || item.email || (item.phone && formatPhone(item.phone)) || item.idExterno || "Contemplação sem identificação";
}

export function processReference(item: ProcessOption) {
  return [item.origem, item.idExterno].filter(Boolean).join(" · ") || "Sem referência externa";
}

export function initialProcessId(value: string | null) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

type Directory = ReturnType<typeof useResource<Awaited<ReturnType<typeof loadProcesses>>>>;
const DirectoryContext = createContext<Directory | null>(null);

export function ProcessDirectoryProvider({ children }: { children: ReactNode }) {
  const directory = useResource(loadProcesses);
  return <DirectoryContext.Provider value={directory}>{children}</DirectoryContext.Provider>;
}

export function useProcessDirectory() {
  const directory = useContext(DirectoryContext);
  if (!directory) throw new Error("A lista de processos não está disponível.");
  return directory;
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
