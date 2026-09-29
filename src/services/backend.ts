import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "";

export type UserType = "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";
export type ProcessStatus =
  | "CONTEMPLADO"
  | "AGUARDANDO_COMUNICACAO"
  | "EM_COMUNICACAO"
  | "CLIENTE_CONTATADO"
  | "AGUARDANDO_DOCUMENTOS"
  | "DOCUMENTOS_RECEBIDOS"
  | "EM_ANALISE"
  | "EM_PROCESSO_DE_BAIXA"
  | "FINALIZADO"
  | "CANCELADO";

export interface UserResponse {
  id: number;
  nome: string;
  email: string;
  tipo: UserType;
  ativo: boolean;
}

export interface ConsortiumResponse {
  id: number;
  nome: string;
  tipoId: number;
  tipoNome: string;
  ativo: boolean;
}

export interface QuotaResponse {
  id: number;
  numero: string;
  grupoId: number;
  grupoNumero: string;
  valorCredito: number;
  ativa: boolean;
}

export interface ProcessResponse {
  id: number;
  contemplacaoId: number;
  responsavelId: number | null;
  status: ProcessStatus;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ChannelResponse {
  id: number;
  destinatario: string;
  status: string;
  erro: string | null;
  criadaEm: string;
  enviadaEm: string | null;
}

export interface CommunicationResponse {
  processoId: number;
  statusGeral: string;
  email: ChannelResponse | null;
  whatsapp: ChannelResponse | null;
}

export interface ClosureResponse {
  id: number;
  processoId: number;
  usuarioId: number;
  data: string;
  observacao: string | null;
}

interface ApiError {
  message?: string;
  error?: string;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.message || data.error || "Erro ao acessar o backend.");
  }
  return data;
}

export const backend = {
  users: {
    list: () => apiRequest<UserResponse[]>("/api/usuarios"),
    create: (payload: { nome: string; email: string; senha: string; tipo: UserType }) =>
      apiRequest<UserResponse>("/api/usuarios", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  consortiums: {
    list: () => apiRequest<ConsortiumResponse[]>("/api/consorcios"),
    create: (payload: { nome: string; tipoId: number }) =>
      apiRequest<ConsortiumResponse>("/api/consorcios", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  quotas: {
    list: () => apiRequest<QuotaResponse[]>("/api/cotas"),
    create: (payload: { numero: string; grupoId: number; valorCredito: number }) =>
      apiRequest<QuotaResponse>("/api/cotas", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  processes: {
    get: (id: number) => apiRequest<ProcessResponse>(`/api/processos-contemplacao/${id}`),
    updateStatus: (
      id: number,
      payload: { status: ProcessStatus; observacao?: string; usuarioId: number },
    ) =>
      apiRequest<ProcessResponse>(`/api/processos-contemplacao/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    communication: (id: number) =>
      apiRequest<CommunicationResponse>(`/api/integracoes/processos/${id}/comunicacao`),
    resendCommunication: (id: number) =>
      apiRequest<CommunicationResponse>(
        `/api/integracoes/processos/${id}/comunicacao/reenvio`,
        { method: "POST" },
      ),
    sendWhatsApp: (id: number, telefone: string, mensagem: string) =>
      apiRequest<CommunicationResponse>(
        `/api/integracoes/processos/${id}/comunicacao/whatsapp`,
        { method: "POST", body: JSON.stringify({ telefone, mensagem }) },
      ),
    createClosure: (id: number, usuarioId: number, observacao?: string) =>
      apiRequest<ClosureResponse>(`/api/integracoes/processos/${id}/baixa`, {
        method: "POST",
        body: JSON.stringify({ usuarioId, observacao }),
      }),
    getClosure: (id: number) =>
      apiRequest<ClosureResponse>(`/api/integracoes/processos/${id}/baixa`),
  },
};
