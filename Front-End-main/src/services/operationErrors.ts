import {ApiError} from "./http";
export function unavailable(error:unknown) {return error instanceof ApiError && [404,405,501].includes(error.status);}
export function operationError(error:unknown):never {if(unavailable(error))throw new Error("Este recurso está aguardando a integração do serviço. Tente novamente mais tarde.");throw error;}
