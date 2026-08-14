// Erros padronizados do backend: { timestamp, status, error, message }.
// As mensagens já vêm em português — exiba `message` direto em toasts/inline.

export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** 422 = regra de negócio (ex.: consulta não confirmada). */
  get isBusinessRule(): boolean {
    return this.status === 422;
  }
  /** 409 = conflito (ex.: horário ocupado). */
  get isConflict(): boolean {
    return this.status === 409;
  }
  /** 403 = sem permissão / sem consentimento. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
  /** 429 = rate limit. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "Não foi possível conectar ao servidor. Verifique se a M.E-API está no ar.",
  403: "Você não tem permissão para esta ação.",
  409: "Conflito com o estado atual. Recarregue e tente novamente.",
  429: "Muitas tentativas. Aguarde um instante e tente de novo.",
  500: "Erro interno no servidor. Tente novamente mais tarde.",
};

export function fallbackMessage(status: number): string {
  return FALLBACK_MESSAGES[status] ?? "Ocorreu um erro inesperado.";
}
