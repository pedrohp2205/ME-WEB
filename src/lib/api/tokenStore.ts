// Armazenamento dos tokens JWT (access curto + refresh com rotação).
// localStorage para sobreviver a reloads. Um listener avisa a app quando a
// sessão é encerrada (refresh falhou / logout) para redirecionar ao login.

const ACCESS_KEY = "me.accessToken";
const REFRESH_KEY = "me.refreshToken";

export interface Tokens {
  token: string;
  refreshToken: string;
}

type Listener = () => void;
const logoutListeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function setTokens(tokens: Tokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.token);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/** Encerra a sessão localmente e notifica os ouvintes (ex.: AuthContext -> login). */
export function emitLogout(): void {
  clearTokens();
  logoutListeners.forEach((fn) => fn());
}

export function onLogout(fn: Listener): () => void {
  logoutListeners.add(fn);
  return () => logoutListeners.delete(fn);
}
