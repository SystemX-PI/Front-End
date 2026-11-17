import { ApiError, request } from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tipo: "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE" | "USUARIO";
  expiresIn: number;
  email?: string;
}

const USER_TYPES: AuthResponse["tipo"][] = [
  "ADMINISTRADOR",
  "FUNCIONARIO",
  "CLIENTE",
  "USUARIO",
];

const ACCESS_EXPIRY_KEY = "accessTokenExpiresAt";
const REFRESH_EARLY_MS = 60_000;
let scheduledRefresh: ReturnType<typeof setTimeout> | null = null;

function scheduleRefreshAt(expiresAt: number): void {
  if (scheduledRefresh !== null) clearTimeout(scheduledRefresh);
  localStorage.setItem(ACCESS_EXPIRY_KEY, String(expiresAt));
  scheduledRefresh = setTimeout(() => {
    scheduledRefresh = null;
    if (getToken()) void renewSession().catch(() => {});
  }, Math.max(0, expiresAt - Date.now() - REFRESH_EARLY_MS));
}

function scheduleRefresh(expiresIn: number): void {
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) return;
  scheduleRefreshAt(Date.now() + expiresIn * 1000);
}

export function resumeSessionRefresh(): void {
  if (!getToken()) return;
  const storedExpiry = Number(localStorage.getItem(ACCESS_EXPIRY_KEY));
  if (Number.isFinite(storedExpiry) && storedExpiry > 0) {
    scheduleRefreshAt(storedExpiry);
    return;
  }
  const tokenExpiry = parseSessionClaims(getToken())?.exp;
  if (typeof tokenExpiry === "number" && Number.isFinite(tokenExpiry)) {
    scheduleRefreshAt(tokenExpiry * 1000);
  }
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const data = (await request(
    "/api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        senha: payload.password,
      }),
    },
    null,
    true,
  )) as AuthResponse;

  storeAuthResponse(data);
  localStorage.setItem("userEmail", payload.email.trim());
  sessionStorage.setItem("show-trial-notice", "true");
  return data;
}

export async function loginWithGoogle(credential: string): Promise<AuthResponse> {
  const data = (await request(
    "/api/auth/google",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    },
    null,
  )) as AuthResponse;

  storeAuthResponse(data);
  sessionStorage.setItem("show-trial-notice", "true");
  return data;
}

export async function registerWithGoogle(
  credential: string,
  companyName: string,
): Promise<AuthResponse> {
  const data = (await request(
    "/api/auth/google/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, companyName: companyName.trim() }),
    },
    null,
  )) as AuthResponse;

  storeAuthResponse(data);
  sessionStorage.setItem("show-trial-notice", "true");
  return data;
}

export function storeAuthResponse(data: AuthResponse): void {
  if (
    !data ||
    typeof data.token !== "string" ||
    !data.token ||
    typeof data.refreshToken !== "string" ||
    !data.refreshToken ||
    !USER_TYPES.includes(data.tipo) ||
    !Number.isFinite(data.expiresIn) ||
    data.expiresIn <= 0
  ) {
    throw new Error(
      "O backend retornou uma resposta de autenticação inválida.",
    );
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("userType", data.tipo);
  scheduleRefresh(data.expiresIn);
  if (typeof data.email === "string" && data.email) {
    localStorage.setItem("userEmail", data.email);
  } else {
    localStorage.removeItem("userEmail");
  }
}

export async function register(payload: RegisterRequest): Promise<void> {
  if (!payload.name.trim()) throw new Error("Informe seu nome.");
  await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: payload.name.trim(),
      email: payload.email.trim(),
      senha: payload.password,
    }),
  });
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refreshToken");
  let serverLogoutSucceeded = !refreshToken;
  if (refreshToken) {
    try {
      await request("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      serverLogoutSucceeded = true;
    } catch {
      serverLogoutSucceeded = false;
    }
  }

  clearSession();
  if (!serverLogoutSucceeded) {
    throw new Error(
      "A sessão local foi encerrada, mas o backend não confirmou o logout.",
    );
  }
}

export function clearSession(): void {
  if (scheduledRefresh !== null) clearTimeout(scheduledRefresh);
  scheduledRefresh = null;
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userType");
  localStorage.removeItem("userEmail");
  localStorage.removeItem(ACCESS_EXPIRY_KEY);
}

let refreshInFlight: Promise<string> | null = null;

export function renewSession(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;
  const previousRefresh = localStorage.getItem("refreshToken");
  if (!previousRefresh) {
    clearSession();
    window.dispatchEvent(new Event("auth:session-expired"));
    return Promise.reject(new ApiError("Sua sessão expirou. Entre novamente.", 401));
  }
  refreshInFlight = (async () => {
    const data = await request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: previousRefresh }),
    }) as AuthResponse;
    if (localStorage.getItem("refreshToken") !== previousRefresh)
      throw new ApiError("A sessão foi alterada. Tente novamente.");
    if (!data?.token || !data.refreshToken || !USER_TYPES.includes(data.tipo) || !Number.isFinite(data.expiresIn) || data.expiresIn <= 0)
      throw new ApiError("Não foi possível renovar a sessão. Tente novamente.");
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("userType", data.tipo);
    scheduleRefresh(data.expiresIn);
    return data.token;
  })().catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401 && localStorage.getItem("refreshToken") === previousRefresh) {
      clearSession();
      window.dispatchEvent(new Event("auth:session-expired"));
    }
    throw error;
  }).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

function parseSessionClaims(token: string | null): { tipo?: unknown; beneficiario?: unknown; exp?: unknown } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserType(): AuthResponse["tipo"] | null {
  const tokenType = parseSessionClaims(getToken())?.tipo;
  if (tokenType === "ADMINISTRADOR" || tokenType === "FUNCIONARIO" || tokenType === "CLIENTE") return tokenType;
  if (tokenType === "USUARIO") return "CLIENTE";
  const userType = localStorage.getItem("userType");
  return userType === "ADMINISTRADOR" ||
    userType === "FUNCIONARIO" ||
    userType === "CLIENTE"
    ? userType
    : userType === "USUARIO"
      ? "CLIENTE"
      : null;
}

export function isBeneficiarySession(): boolean {
  return getUserType() === "CLIENTE" && parseSessionClaims(getToken())?.beneficiario === true;
}

export function sessionHome(): string {
  if (isBeneficiarySession()) return "/portal";
  return getUserType() === "FUNCIONARIO" ? "/admin/dashboard" : "/app";
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export async function requestPasswordReset(email: string): Promise<{message:string;expiresIn:number}> {
 return await request("/api/auth/forgot-password",{method:"POST",body:JSON.stringify({email:email.trim()})}) as {message:string;expiresIn:number};
}
export async function resetPassword(email: string, token: string, newPassword: string): Promise<void> {
 await request("/api/auth/reset-password",{method:"POST",body:JSON.stringify({email:email.trim(),token,newPassword})});
}
