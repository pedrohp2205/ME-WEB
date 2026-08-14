import { useEffect } from "react";
import { setTokens } from "@/lib/api/tokenStore";
import { Splash } from "@/app/Splash";

/**
 * Retorno do login Google. O backend redireciona para
 * /oauth2/redirect?token=...&refreshToken=...
 * Guardamos os tokens e recarregamos na raiz para o AuthProvider validar a sessão.
 */
export function OAuthRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    if (token && refreshToken) {
      setTokens({ token, refreshToken });
      window.location.replace("/");
    } else {
      window.location.replace("/login");
    }
  }, []);

  return <Splash label="Concluindo login…" />;
}
