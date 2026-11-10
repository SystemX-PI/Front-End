import { getToken, renewSession } from "./auth";
import { ApiError, request } from "./http";
import { normalizeContemplation } from "./format";

export type UserType = "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";
export type CommunicationStatus = "PENDENTE" | "REALIZADA" | "SUCESSO" | "SEM_RESPOSTA" | "FALHA";
export type CommunicationSummary = "PENDENTE" | "COMUNICADO_PARCIAL" | "COMUNICADO_NOS_DOIS" | "FALHA";
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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const originalToken = getToken();
  try {
    return (await request(path, options, originalToken)) as T;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && originalToken) {
      // Another request may already have renewed this same expired token.
      const token = getToken() !== originalToken ? getToken() : await renewSession();
      options.signal?.throwIfAborted();
      return (await request(path, options, token)) as T;
    }
    throw error;
  }
}

export interface PageResponse<T> { items: T[]; total: number; page: number; size: number }
export interface GroupResponse { id: number; numero: string; consorcioId: number; quantidadeCotas: number | null; valorParcela: number | null }
export interface ConsortiumTypeResponse { id: number; nome: string }
export interface PortalProcessResponse {
  processo: ProcessResponse; responsavel: string | null; cota: string; valorCredito: number;
  documentos: { id: number; tipo: string; status: string; nomeArquivo: string | null; observacao: string | null }[];
  historico: { id: number; statusAnterior: string | null; novoStatus: string; data: string; observacao: string | null }[];
}

function crudApi<T>(resource: string) {
  return {
    get: (id: number) => apiRequest<T>(`/api/${resource}/${id}`),
    update: (id: number, payload: object) => apiRequest<T>(`/api/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    remove: (id: number) => apiRequest<void>(`/api/${resource}/${id}`, { method: "DELETE" }),
    page: (page = 0, q = "", signal?: AbortSignal) => apiRequest<PageResponse<T>>(`/api/${resource}/pagina?${new URLSearchParams({ page: String(page), size: "20", q })}`, { signal }),
  };
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
    notificationSummary: (inicio: string, fim: string, signal?: AbortSignal) =>
      apiRequest<{ total: number; accepted: number; pending: number; failed: number }>(
        `/api/integracoes/comunicacoes/historico?${new URLSearchParams({ inicio, fim })}`,
        { signal },
      ),
    queueSummary: (signal?: AbortSignal) =>
      apiRequest<{ total: number; pendentes: number; comunicados: number; comFalha: number }>(
        "/api/integracoes/comunicacoes/fila/resumo", { signal },
      ),
    queuePage: (page = 0, q = "", status = "", signal?: AbortSignal) => apiRequest<PageResponse<QueueItem>>(
      `/api/integracoes/comunicacoes/fila/pagina?${new URLSearchParams({ page: String(page), size: "20", q, status })}`, { signal }),
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
    ...crudApi<UserResponse>("usuarios"),
    changePassword: (id: number, senha: string) => apiRequest<void>(`/api/usuarios/${id}/senha`, { method: "PUT", body: JSON.stringify({ senha }) }),
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
    ...crudApi<ConsortiumResponse>("consorcios"),
    list: () => apiRequest<ConsortiumResponse[]>("/api/consorcios"),
    create: (payload: { nome: string; tipoId: number }) =>
      apiRequest<ConsortiumResponse>("/api/consorcios", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  quotas: {
    ...crudApi<QuotaResponse>("cotas"),
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
  groups: { ...crudApi<GroupResponse>("grupos"), create: (payload: object) => apiRequest<GroupResponse>("/api/grupos", { method: "POST", body: JSON.stringify(payload) }) },
  consortiumTypes: { ...crudApi<ConsortiumTypeResponse>("tipos-consorcio"), create: (payload: { nome: string }) => apiRequest<ConsortiumTypeResponse>("/api/tipos-consorcio", { method: "POST", body: JSON.stringify(payload) }) },
  portal: {
    list: (page = 0, signal?: AbortSignal) => apiRequest<PageResponse<ProcessResponse>>(`/api/portal/processos?page=${page}&size=20`, { signal }),
    get: (id: number, signal?: AbortSignal) => apiRequest<PortalProcessResponse>(`/api/portal/processos/${id}`, { signal }),
  },
  operation: {
    closures: (page:number,q:string,status: 'EM_PROCESSO_DE_BAIXA' | 'FINALIZADO',signal?:AbortSignal) => apiRequest<PageResponse<ProcessResponse>>('/api/processos-contemplacao/pagina?'+new URLSearchParams({page:String(page),size:'20',q,status}),{signal}),
    history: (id:number,page:number,signal?:AbortSignal) => apiRequest<PageResponse<OperationEvent>>('/api/integracoes/processos/'+id+'/comunicacoes/historico?page='+page+'&size=20',{signal}),
    audit: (page:number,q:string,acao:string,data:string,signal?:AbortSignal) => apiRequest<PageResponse<OperationEvent>>('/api/auditoria/pagina?'+new URLSearchParams({page:String(page),size:'20',q,acao,...(data ? {data} : {})}),{signal}),
  },
  processes: {
    get: (id: number, signal?: AbortSignal) =>
      apiRequest<ProcessResponse>(`/api/processos-contemplacao/${id}`, { signal }),
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
    sendWhatsApp: (id: number, telefone: string, mensagem: string, remetenteId?: number) =>
      apiRequest<CommunicationResponse>(
        `/api/integracoes/processos/${id}/comunicacao/whatsapp`,
        { method: "POST", body: JSON.stringify({ telefone, mensagem, remetenteId }) },
      ),
    createClosure: (id: number, usuarioId: number, observacao?: string) =>
      apiRequest<ClosureResponse>(`/api/integracoes/processos/${id}/baixa`, {
        method: "POST",
        body: JSON.stringify({ usuarioId, observacao }),
      }),
    getClosure: (id: number, signal?: AbortSignal) =>
      apiRequest<ClosureResponse>(`/api/integracoes/processos/${id}/baixa`, { signal }),
  },
};

export interface OperationEvent {id:number;data:string;acao?:string;canal?:string;status?:string;usuarioNome?:string;observacao?:string;entidade?:string;registroId?:number}
export interface AssistantAction {
  token: string; tipo: "NOTIFICAR_WHATSAPP"; processoId: number; telefone: string; mensagem: string; aviso: string;
}
export interface AssistantResponse { mensagem: string; acao: AssistantAction | null }
export const assistant = {
  message: (mensagem: string) => apiRequest<AssistantResponse>("/api/assistente/mensagens", { method: "POST", body: JSON.stringify({ mensagem }) }),
  confirm: (token: string) => apiRequest<CommunicationResponse>(`/api/assistente/acoes/${encodeURIComponent(token)}/confirmar`, { method: "POST" }),
};
export function sessionUserId(): number | null {
 try { const part=getToken()?.split('.')[1]; if(!part)return null;const data=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));return Number.isSafeInteger(data.uid)&&data.uid>0?data.uid:null; } catch {return null;}
}
