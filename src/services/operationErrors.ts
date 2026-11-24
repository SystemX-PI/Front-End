import {ApiError} from "./http";
export function unavailable(error:unknown) {return error instanceof ApiError && [404,405,501].includes(error.status);}
export function operationError(error:unknown):never {if(unavailable(error))throw new Error("Este recurso está aguardando a integração do serviço. Tente novamente mais tarde.");throw error;}

export function closureReadFailure(error: unknown): { message: string; retry: boolean } {
  if (error instanceof ApiError) {
    if (error.transport === "timeout") return { message: "A consulta demorou mais que o esperado.", retry: true };
    if (error.transport === "network") return { message: "Não foi possível conectar ao servidor para consultar a baixa.", retry: true };
    switch (error.status) {
      case 401: return { message: "Sua sessão expirou. Entre novamente para consultar a baixa.", retry: false };
      case 402: return { message: "Esta consulta exige uma conta com plano ou teste ativo.", retry: false };
      case 403: return { message: "Seu perfil não tem permissão para consultar a baixa.", retry: false };
      case 404: return { message: "O processo solicitado não foi encontrado.", retry: false };
      case 409: return { message: "O estado do processo mudou. Consulte novamente.", retry: true };
      case 500: return { message: "O servidor encontrou um problema ao consultar a baixa.", retry: true };
      case 502:
      case 503:
      case 504: return { message: "O serviço de baixas está temporariamente indisponível.", retry: true };
    }
  }
  return { message: "Não foi possível consultar a baixa.", retry: true };
}
