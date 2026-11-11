import type {
  LoginCredentials,
  ManagedUser,
  NewUser,
  UserCatalogOption,
  UserProfile,
} from "../models/auth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
  .replace(/\/+$/, "");

export class AuthApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AuthApiError";
  }
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id_usuario === "number" &&
    typeof profile.nombre === "string" &&
    typeof profile.usuario === "string" &&
    typeof profile.rol === "string" &&
    typeof profile.sucursal === "string"
  );
}

function isManagedUser(value: unknown): value is ManagedUser {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id_usuario === "number" &&
    typeof user.nombre === "string" &&
    typeof user.usuario === "string" &&
    typeof user.rol === "string" &&
    typeof user.sucursal === "string"
  );
}

function isCatalogOption(value: unknown): value is UserCatalogOption {
  if (typeof value !== "object" || value === null) return false;
  const option = value as Record<string, unknown>;
  return typeof option.id === "number" && typeof option.nombre === "string";
}

export async function requestApi(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new AuthApiError(
        "No se pudo conectar con el backend. Comprueba que FastAPI esté iniciado.",
        0,
      );
    }
    throw error;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AuthApiError("El backend devolvió una respuesta inválida.", response.status);
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : "No se pudo completar la solicitud.";
    throw new AuthApiError(detail, response.status);
  }

  return payload;
}

export async function login(credentials: LoginCredentials): Promise<UserProfile> {
  const payload = await requestApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      usuario: credentials.username,
      password: credentials.password,
      remember_me: credentials.rememberMe,
    }),
  });

  if (typeof payload !== "object" || payload === null || !("user" in payload) || !isUserProfile(payload.user)) {
    throw new AuthApiError("El backend no devolvió un perfil de usuario válido.", 502);
  }

  return payload.user;
}

export async function register(account: { nombre: string; usuario: string; password: string }): Promise<UserProfile> {
  const payload = await requestApi("/auth/register", {
    method: "POST",
    body: JSON.stringify(account),
  });
  if (typeof payload !== "object" || payload === null || !("user" in payload) || !isUserProfile(payload.user)) {
    throw new AuthApiError("El backend no devolvió un perfil de usuario válido.", 502);
  }
  return payload.user;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const payload = await requestApi("/auth/me", { method: "GET" });
  if (!isUserProfile(payload)) {
    throw new AuthApiError("El backend no devolvió un perfil de usuario válido.", 502);
  }
  return payload;
}

export async function logout(): Promise<void> {
  await requestApi("/auth/logout", { method: "POST" });
}

export async function getUserManagementOptions(): Promise<{
  roles: UserCatalogOption[];
  sucursales: UserCatalogOption[];
}> {
  const payload = await requestApi("/users/options", { method: "GET" });
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("roles" in payload) ||
    !("sucursales" in payload) ||
    !Array.isArray(payload.roles) ||
    !payload.roles.every(isCatalogOption) ||
    !Array.isArray(payload.sucursales) ||
    !payload.sucursales.every(isCatalogOption)
  ) {
    throw new AuthApiError("El backend devolvió catálogos de usuarios inválidos.", 502);
  }
  return { roles: payload.roles, sucursales: payload.sucursales };
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const payload = await requestApi("/users", { method: "GET" });
  if (!Array.isArray(payload) || !payload.every(isManagedUser)) {
    throw new AuthApiError("El backend devolvió una lista de usuarios inválida.", 502);
  }
  return payload;
}

export async function createManagedUser(user: NewUser): Promise<void> {
  await requestApi("/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}
