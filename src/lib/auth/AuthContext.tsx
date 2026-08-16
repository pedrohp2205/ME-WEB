import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/lib/api/auth";
import * as doctorsApi from "@/lib/api/doctors";
import type { CredentialingResponse, DoctorResponse } from "@/lib/api/doctors";
import { ApiError } from "@/lib/api/errors";
import {
  emitLogout,
  hasSession,
  onLogout,
  setTokens,
  getRefreshToken,
  clearTokens,
} from "@/lib/api/tokenStore";

type Status = "loading" | "authenticated" | "unauthenticated";

/** Resultado de uma tentativa de login. */
export type LoginResult =
  | { kind: "authenticated" }
  | { kind: "twoFactor"; challengeToken: string };

interface AuthContextValue {
  status: Status;
  doctor: DoctorResponse | null;
  /** Estado do credenciamento (análise do cadastro + 2FA). */
  credentialing: CredentialingResponse | null;
  login(email: string, password: string): Promise<LoginResult>;
  verifyTwoFactor(challengeToken: string, code: string): Promise<void>;
  logout(): Promise<void>;
  /** Atualiza o perfil em memória (ex.: após salvar emitente/preço). */
  setDoctor(doctor: DoctorResponse): void;
  /** Recarrega o perfil do backend. */
  refreshDoctor(): Promise<void>;
  /** Recarrega o credenciamento (ex.: após ativar o 2FA ou sair da análise). */
  refreshCredentialing(): Promise<CredentialingResponse>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Carrega o perfil do médico. Isto também é a GUARDA DE PAPEL: só uma conta
 * DOCTOR com perfil criado responde 200 aqui. Contas não-médico caem em
 * 403/404 e a sessão é rejeitada.
 */
async function loadDoctorOrReject(): Promise<DoctorResponse> {
  try {
    return await doctorsApi.getMe();
  } catch (e) {
    if (
      e instanceof ApiError &&
      (e.status === 403 || e.status === 404)
    ) {
      throw new ApiError(
        e.status,
        "Esta conta não é de um médico ou o perfil ainda não foi criado.",
        e.body,
      );
    }
    throw e;
  }
}

/**
 * Perfil + estado do credenciamento. Um médico em análise responde 200 nos dois
 * endpoints (papel DOCTOR_ONBOARDING), então quem decide se ele entra no painel
 * é a guarda de rota, olhando `canPractice`.
 */
async function loadSession(): Promise<[DoctorResponse, CredentialingResponse]> {
  return Promise.all([loadDoctorOrReject(), doctorsApi.getCredentialing()]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [doctor, setDoctorState] = useState<DoctorResponse | null>(null);
  const [credentialing, setCredentialing] = useState<CredentialingResponse | null>(null);
  const mounted = useRef(true);

  // Sessão persistida: valida carregando o perfil.
  useEffect(() => {
    mounted.current = true;
    if (!hasSession()) {
      setStatus("unauthenticated");
      return;
    }
    loadSession()
      .then(([d, c]) => {
        if (!mounted.current) return;
        setDoctorState(d);
        setCredentialing(c);
        setStatus("authenticated");
      })
      .catch(() => {
        clearTokens();
        if (!mounted.current) return;
        setDoctorState(null);
        setCredentialing(null);
        setStatus("unauthenticated");
      });
    return () => {
      mounted.current = false;
    };
  }, []);

  // Logout forçado (refresh falhou no meio da sessão).
  useEffect(() => {
    return onLogout(() => {
      setDoctorState(null);
      setCredentialing(null);
      setStatus("unauthenticated");
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const res = await authApi.login(email, password);
      if (res.twoFactorRequired && res.challengeToken) {
        return { kind: "twoFactor", challengeToken: res.challengeToken };
      }
      if (!res.token || !res.refreshToken) {
        throw new ApiError(500, "Resposta de login inválida.", null);
      }
      setTokens({ token: res.token, refreshToken: res.refreshToken });
      const [d, c] = await loadSession().catch((e) => {
        clearTokens();
        throw e;
      });
      setDoctorState(d);
      setCredentialing(c);
      setStatus("authenticated");
      return { kind: "authenticated" };
    },
    [],
  );

  const verifyTwoFactor = useCallback(
    async (challengeToken: string, code: string): Promise<void> => {
      const res = await authApi.loginTwoFactor(challengeToken, code);
      if (!res.token || !res.refreshToken) {
        throw new ApiError(500, "Resposta de verificação inválida.", null);
      }
      setTokens({ token: res.token, refreshToken: res.refreshToken });
      const [d, c] = await loadSession().catch((e) => {
        clearTokens();
        throw e;
      });
      setDoctorState(d);
      setCredentialing(c);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      // Best-effort: não bloqueia o logout local se a chamada falhar.
      await authApi.logout(refreshToken).catch(() => undefined);
    }
    emitLogout();
  }, []);

  const setDoctor = useCallback((d: DoctorResponse) => setDoctorState(d), []);
  const refreshDoctor = useCallback(async () => {
    const d = await doctorsApi.getMe();
    setDoctorState(d);
  }, []);
  const refreshCredentialing = useCallback(async () => {
    const c = await doctorsApi.getCredentialing();
    setCredentialing(c);
    return c;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      doctor,
      credentialing,
      login,
      verifyTwoFactor,
      logout,
      setDoctor,
      refreshDoctor,
      refreshCredentialing,
    }),
    [
      status,
      doctor,
      credentialing,
      login,
      verifyTwoFactor,
      logout,
      setDoctor,
      refreshDoctor,
      refreshCredentialing,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
