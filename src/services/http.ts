export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  readonly transport?: "timeout" | "network";

  constructor(
    message: string,
    status = 0,
    fields: Record<string, string> = {},
    transport?: "timeout" | "network",
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.transport = transport;
  }
}

const statusMessages: Record<number, string> = {
  400: "Confira os campos informados e tente novamente.",
  401: "Sua sessão expirou. Entre novamente.",
  402: "Esta ação exige uma conta com plano ou teste ativo.",
  403: "Seu perfil não tem permissão para realizar esta ação.",
  404: "O registro ou recurso solicitado não foi encontrado.",
  409: "Operacao em conflito: confira valores duplicados ou registros vinculados.",
  422: "Os dados enviados não puderam ser processados.",
  429: "Muitas tentativas. Aguarde um momento antes de tentar novamente.",
  500: "O servidor encontrou um problema. Tente novamente em instantes.",
  502: "O serviço de integração não respondeu corretamente. Confira a configuração do canal.",
  503: "Serviço temporariamente indisponível. Tente novamente em instantes.",
};

export async function parseApiResponse<T>(
  response: Response,
  authentication = false,
): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    if (response.ok)
      throw new ApiError(
        "O servidor retornou uma resposta inválida.",
        response.status,
      );
  }
  if (!response.ok) {
    const body =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};
    const fields =
      body.fields && typeof body.fields === "object"
        ? Object.fromEntries(
            Object.entries(body.fields).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : {};
    const genericErrors = new Set([
      "Bad Request",
      "Unauthorized",
      "Forbidden",
      "Not Found",
      "Internal Server Error",
      "Bad Gateway",
      "Service Unavailable",
    ]);
    const detail = [body.message, body.detail, body.error].find(
      (value) =>
        typeof value === "string" && value.trim() && !genericErrors.has(value),
    );
    const message =
      Object.values(fields).join(" ") ||
      (authentication && response.status === 401
        ? "E-mail ou senha incorretos."
        : response.status >= 500 &&
            response.status !== 502 &&
            response.status !== 503
          ? statusMessages[response.status]
          : detail) ||
      statusMessages[response.status] ||
      "Não foi possível concluir a operação.";
    throw new ApiError(String(message), response.status, fields);
  }
  return data as T;
}

export async function request(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  authentication = false,
) {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const timeout = AbortSignal.timeout(30000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let responseStatus = 0;
  try {
    const response = await fetch(
      `${(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}${path}`,
      { ...options, headers, signal },
    );
    responseStatus = response.status;
    return await parseApiResponse<unknown>(response, authentication);
  } catch (error) {
    if (options.signal?.aborted || error instanceof ApiError) throw error;
    if (timeout.aborted || (error instanceof DOMException && error.name === "TimeoutError")) {
      throw new ApiError(
        "A resposta demorou mais que o esperado. Confira o status antes de repetir a operação.",
        responseStatus, {}, "timeout",
      );
    }
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      responseStatus, {}, "network",
    );
  }
}
