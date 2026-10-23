import { clearSession, getToken } from "./auth";
import { ApiError, request } from "./http";
import { normalizeContemplation } from "./format";

export type UserType = "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";
export type CommunicationStatus = "PENDENTE" | "REALIZADA" | "SUCESSO" | "SEM_RESPOSTA" | "FALHA";
export type CommunicationSummary = "PENDENTE" | "COMUNICADO_PARCIAL" | "COMUNICADO_NOS_DOIS";
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
  status: CommunicationStatus;
  erro: string | null;
  criadaEm: string;
  enviadaEm: string | null;
}

export interface CommunicationResponse {
  processoId: number;
  statusGeral: CommunicationSummary;
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
  statusProcesso: ProcessStatus;
  statusComunicacao: CommunicationStatus | null;
  jaExistia: boolean;
  comunicacaoWhatsAppId: number | null;
  statusWhatsApp: CommunicationStatus | null;
}

export interface QueueItem {
  processoId: number;
  origem: string | null;
  idExterno: string | null;
  statusProcesso: ProcessStatus;
  recebidaEm: string | null;
  comunicacao: CommunicationResponse;
}

export interface EvolutionStatusResponse {
  instanceName: string;
  state: string;
  code: string | null;
  qrCode: string | null;
  pairingCode: string | null;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return (await request(path, options, getToken())) as T;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSession();
      window.dispatchEvent(new Event("auth:session-expired"));
    }
    throw error;
  }
}

export const backend = {
  configuration: {
    configureEmail: (payload: { email: string; senhaAplicativo: string }) =>
      apiRequest<{ configurado: boolean; email: string }>(
        "/api/configuracoes/email",
        { method: "PUT", body: JSON.stringify(payload) },
      ),
  },
  whatsapp: {
    generateQr: (instanceName: string) =>
      apiRequest<EvolutionStatusResponse>("/api/integracoes/whatsapp/qr", {
        method: "POST",
        body: JSON.stringify({ instanceName }),
      }),
    status: (instanceName: string) =>
      apiRequest<EvolutionStatusResponse>(
        `/api/integracoes/whatsapp/status?instanceName=${encodeURIComponent(instanceName)}`,
      ),
  },
  integrations: {
    queue: (signal?: AbortSignal) =>
      apiRequest<QueueItem[]>("/api/integracoes/comunicacoes/fila", { signal }),
    receiveContemplation: (
      payload: ContemplationRequest,
      integrationKey: string,
    ) =>
      apiRequest<IntegrationResponse>("/api/integracoes/contemplacoes", {
        method: "POST",
        headers: { "X-Integration-Key": integrationKey },
        body: JSON.stringify(normalizeContemplation(payload)),
      }),
  },
  users: {
    list: (signal?: AbortSignal) =>
      apiRequest<UserResponse[]>("/api/usuarios", { signal }),
    create: (payload: {
      nome: string;
      email: string;
      senha: string;
      tipo: UserType;
    }) =>
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
    create: (payload: {
      numero: string;
      grupoId: number;
      valorCredito: number;
    }) =>
      apiRequest<QuotaResponse>("/api/cotas", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  processes: {
    get: (id: number) =>
      apiRequest<ProcessResponse>(`/api/processos-contemplacao/${id}`),
    updateStatus: (
      id: number,
      payload: {
        status: ProcessStatus;
        observacao?: string;
        usuarioId: number;
      },
    ) =>
      apiRequest<ProcessResponse>(`/api/processos-contemplacao/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    communication: (id: number) =>
      apiRequest<CommunicationResponse>(
        `/api/integracoes/processos/${id}/comunicacao`,
      ),
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
