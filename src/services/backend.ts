import { clearSession, getToken } from "./auth";

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

export interface ContemplationRequest {
  origem: string;
  idExterno: string;
  nome: string;
  email: string;
  telefone?: string;
  cotaId: number;
  assembleiaId: number;
  dataContemplacao: string;
  tipo: "SORTEIO" | "LANCE";
  valorCredito: number;
}

export interface IntegrationResponse {
  processoId: number;
  comunicacaoId: number | null;
  origem: string;
  idExterno: string;
  statusProcesso: string;
  statusComunicacao: string | null;
  jaExistia: boolean;
  comunicacaoWhatsAppId: number | null;
  statusWhatsApp: string | null;
}

interface ApiError {
  message?: string;
  error?: string;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao backend. Verifique a API e a configuração de VITE_API_URL.",
    );
  }
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new Event("auth:session-expired"));
    }
    const statusMessage = response.status === 401
      ? "Sua sessão expirou. Entre novamente."
      : response.status === 403
        ? "Apenas administradores podem realizar esta configuração."
        : response.status === 404
          ? "A operação solicitada não está disponível no backend."
          : "Erro ao acessar o backend.";
    throw new Error(data.message || data.error || statusMessage);
  }
  return data;
}

export const backend = {
  integrations: {
    receiveContemplation: (payload: ContemplationRequest, integrationKey: string) =>
      apiRequest<IntegrationResponse>("/api/integracoes/contemplacoes", {
        method: "POST",
        headers: { "X-Integration-Key": integrationKey },
        body: JSON.stringify(payload),
      }),
  },
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
