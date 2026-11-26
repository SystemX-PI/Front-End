import { createContext, useContext } from "react";
import { apiRequest, type PageResponse, type QueueItem, type UserResponse } from "../services/backend";
import { formatPhone } from "../services/format";
import type { useResource } from "../hooks/useResource";

export type ProcessOption = QueueItem & { name?: string; email?: string; phone?: string };

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

export async function loadProcesses(signal: AbortSignal, company = false) {
  const queue = await list<QueueItem>("/api/integracoes/comunicacoes/fila/pagina", signal);
  let namesUnavailable = false;
  const clients = queue.some(item => item.comunicacao.email?.destinatario)
    ? await list<UserResponse>(company ? "/api/platform/operation/records" : "/api/clientes/pagina", signal).catch(error => {
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

export type Directory = ReturnType<typeof useResource<Awaited<ReturnType<typeof loadProcesses>>>>;
export const DirectoryContext = createContext<Directory | null>(null);

export function useProcessDirectory() {
  const directory = useContext(DirectoryContext);
  if (!directory) throw new Error("A lista de processos não está disponível.");
  return directory;
}
