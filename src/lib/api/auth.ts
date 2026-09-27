// Endpoints de autenticação (públicos).
import { api } from "./http";

export interface AuthResponse {
  token: string | null;
  refreshToken: string | null;
  type?: string;
  twoFactorRequired?: boolean;
  challengeToken?: string | null;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/login", { email, password }, { auth: false });
}

export function loginTwoFactor(
  challengeToken: string,
  code: string,
): Promise<AuthResponse> {
  return api.post<AuthResponse>(
    "/auth/login/2fa",
    { challengeToken, code },
    { auth: false },
  );
}

export function logout(refreshToken: string): Promise<void> {
  return api.post<void>("/auth/logout", { refreshToken }, { auth: false });
}

// ---- Recuperação de senha (pública) ----

/** Pede o e-mail de redefinição. Responde 204 SEMPRE (não revela se o e-mail existe). */
export function requestPasswordReset(email: string): Promise<void> {
  return api.post<void>("/auth/password-reset/request", { email }, { auth: false });
}

/** Redefine a senha a partir do token recebido por e-mail. Responde 204. */
export function confirmPasswordReset(token: string, password: string): Promise<void> {
  return api.post<void>(
    "/auth/password-reset/confirm",
    { token, password },
    { auth: false },
  );
}

// ---- 2FA (requer autenticação) ----
export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUri: string;
}

export function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
  return api.post<TwoFactorSetupResponse>("/auth/2fa/setup");
}

export function activateTwoFactor(code: string): Promise<void> {
  return api.post<void>("/auth/2fa/activate", { code });
}

export function disableTwoFactor(code: string): Promise<void> {
  return api.post<void>("/auth/2fa/disable", { code });
}
