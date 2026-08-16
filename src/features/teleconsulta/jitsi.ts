// Carrega o external_api.js do servidor de vídeo sob demanda e expõe o construtor.
// O script fica no domínio do Jitsi, não no bundle: assim ele acompanha a versão
// do servidor e não precisa ser versionado aqui.

type JitsiApi = {
  addListener(event: string, handler: (payload?: unknown) => void): void;
  executeCommand(command: string, ...args: unknown[]): void;
  dispose(): void;
};

type JitsiApiConstructor = new (
  domain: string,
  options: Record<string, unknown>,
) => JitsiApi;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiApiConstructor;
  }
}

const loading = new Map<string, Promise<JitsiApiConstructor>>();

/** Resolve com o construtor da API de embed do Jitsi hospedado em [serverUrl]. */
export function loadJitsiApi(serverUrl: string): Promise<JitsiApiConstructor> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI);

  const src = `${serverUrl.replace(/\/$/, "")}/external_api.js`;
  const pending = loading.get(src);
  if (pending) return pending;

  const promise = new Promise<JitsiApiConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      const api = window.JitsiMeetExternalAPI;
      if (api) resolve(api);
      else reject(new Error("O servidor de vídeo respondeu, mas não expôs a API de sala."));
    };
    script.onerror = () => {
      loading.delete(src);
      reject(new Error("Não foi possível carregar o servidor de vídeo."));
    };
    document.head.appendChild(script);
  });

  loading.set(src, promise);
  return promise;
}

export type { JitsiApi, JitsiApiConstructor };
