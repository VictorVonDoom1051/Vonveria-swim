import { API_URL, CSRF_COOKIE_NAME } from "./constants";

const HTTP_NO_CONTENT = 204;

function readCsrfCookie(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match?.[1] !== undefined ? decodeURIComponent(match[1]) : undefined;
}

/** La cookie CSRF la emite apps/api en cualquier respuesta; una llamada GET basta para obtenerla. */
async function ensureCsrfCookie(): Promise<string | undefined> {
  const existing = readCsrfCookie();
  if (existing) {
    return existing;
  }
  await fetch(`${API_URL}/organization/branding`, { credentials: "include" });
  return readCsrfCookie();
}

export interface ApiErrorBody {
  errorCode?: string;
  message?: string | string[];
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(typeof body.message === "string" ? body.message : (body.errorCode ?? "Error de API"));
    this.status = status;
    this.body = body;
  }
}

/** Fetch wrapper para client components: cookies de sesion + header CSRF en mutaciones. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (method !== "GET") {
    const csrfToken = await ensureCsrfCookie();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiRequestError(response.status, body);
  }

  if (response.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
