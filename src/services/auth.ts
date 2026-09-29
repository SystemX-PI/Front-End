const API_URL = import.meta.env.VITE_API_URL || "";

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
  tipo: "ADMINISTRADOR" | "FUNCIONARIO" | "CLIENTE";
  expiresIn: number;
}

interface ApiError {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    const fieldMessage = data.fields
      ? Object.values(data.fields).filter(Boolean).join(" ")
      : "";
    throw new Error(
      fieldMessage || data.message || data.error || "Não foi possível concluir a requisição.",
    );
  }

  return data;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: payload.email, senha: payload.password }),
  });
  const data = await parseResponse<AuthResponse>(response);

  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("userType", data.tipo);
  localStorage.setItem("userEmail", payload.email);
  return data;
}

export async function register(payload: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_URL}/api/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: payload.name,
      email: payload.email,
      senha: payload.password,
      tipo: "FUNCIONARIO",
    }),
  });
  await parseResponse(response);
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userType");
  localStorage.removeItem("userEmail");
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
