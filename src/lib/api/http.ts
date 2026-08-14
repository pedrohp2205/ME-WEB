// Cliente HTTP da M.E-API.
// - Base URL por env (VITE_API_BASE_URL, default http://localhost:8080).
// - Injeta Authorization: Bearer <access token>.
// - Em 401: tenta UMA vez POST /auth/refresh (serializado contra concorrência) e
//   refaz a requisição original; se o refresh falhar, faz logout.

import {
  ApiError,
  fallbackMessage,
  type ApiErrorBody,
} from "./errors";
import {
  emitLogout,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type Tokens,
} from "./tokenStore";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const API_PREFIX = "/api/v1";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Corpo JSON. Serializado automaticamente. */
  body?: unknown;
  /** Anexa o Bearer token (default true). Use false em endpoints públicos. */
  auth?: boolean;
  /** Query params (valores undefined/null são ignorados). */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Não tentar refresh em 401 (usado internamente pelo próprio refresh). */
  skipRefresh?: boolean;
}

function buildUrl(
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = path.startsWith("/api/") ? path : API_PREFIX + path;
  const url = new URL(API_BASE_URL + base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    body = null;
  }
  const message =
    (body?.message && body.message.trim()) || fallbackMessage(res.status);
  return new ApiError(res.status, message, body);
}

// ---- refresh serializado ----
let refreshPromise: Promise<Tokens> | null = null;

async function doRefresh(): Promise<Tokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError(401, "Sessão expirada.", null);

  const res = await fetch(buildUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw await parseError(res);

  const data = (await res.json()) as Partial<Tokens>;
  if (!data.token || !data.refreshToken) {
    throw new ApiError(401, "Resposta de refresh inválida.", null);
  }
  const tokens: Tokens = { token: data.token, refreshToken: data.refreshToken };
  setTokens(tokens); // rotação: guarda o novo par
  return tokens;
}

function refreshOnce(): Promise<Tokens> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function rawFetch(
  method: Method,
  path: string,
  opts: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth !== false && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
}

async function send(
  method: Method,
  path: string,
  opts: RequestOptions,
): Promise<Response> {
  let res: Response;
  try {
    res = await rawFetch(method, path, opts, getAccessToken());
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, fallbackMessage(0), null);
  }

  // 401 -> tenta refresh uma vez e refaz a chamada original.
  if (res.status === 401 && opts.auth !== false && !opts.skipRefresh) {
    try {
      const tokens = await refreshOnce();
      res = await rawFetch(method, path, opts, tokens.token);
    } catch {
      emitLogout();
      throw new ApiError(401, "Sua sessão expirou. Faça login novamente.", null);
    }
  }

  if (!res.ok) throw await parseError(res);
  return res;
}

async function toJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return send("GET", path, opts ?? {}).then(toJson<T>);
  },
  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return send("POST", path, { ...opts, body }).then(toJson<T>);
  },
  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return send("PUT", path, { ...opts, body }).then(toJson<T>);
  },
  patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return send("PATCH", path, { ...opts, body }).then(toJson<T>);
  },
  del<T>(path: string, opts?: RequestOptions): Promise<T> {
    return send("DELETE", path, opts ?? {}).then(toJson<T>);
  },
  /** Baixa um arquivo (ex.: PDF assinado) como Blob, com refresh e Bearer. */
  blob(path: string, opts?: RequestOptions): Promise<Blob> {
    return send("GET", path, opts ?? {}).then((res) => res.blob());
  },
};
