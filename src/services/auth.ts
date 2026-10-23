import { request } from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: "ADMINISTRADOR" | "FUNCIONARIO";
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tipo: "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";
  expiresIn: number;
}

const USER_TYPES: AuthResponse["tipo"][] = [
  "ADMINISTRADOR",
  "FUNCIONARIO",
  "CLIENTE",
];

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

  if (
    !data ||
    typeof data.token !== "string" ||
    !data.token ||
    typeof data.refreshToken !== "string" ||
    !data.refreshToken ||
    !USER_TYPES.includes(data.tipo) ||
    !Number.isFinite(data.expiresIn)
  ) {
    throw new Error(
      "O backend retornou uma resposta de autenticação inválida.",
    );
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("userType", data.tipo);
  localStorage.setItem("userEmail", payload.email.trim());
  return data;
}

export async function register(payload: RegisterRequest): Promise<void> {
  if (!payload.name.trim()) throw new Error("Informe seu nome.");
  await request("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: payload.name.trim(),
      email: payload.email.trim(),
      senha: payload.password,
      tipo: payload.userType,
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
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userType");
  localStorage.removeItem("userEmail");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getUserType(): AuthResponse["tipo"] | null {
  const userType = localStorage.getItem("userType");
  return userType === "ADMINISTRADOR" ||
    userType === "FUNCIONARIO" ||
    userType === "CLIENTE"
    ? userType
    : null;
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
