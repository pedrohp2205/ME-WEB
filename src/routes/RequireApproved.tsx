import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ReactNode } from "react";

/**
 * Segunda guarda, depois de <RequireDoctor>: o painel só abre para quem está
 * credenciado (cadastro aprovado + 2FA ativo). Cadastro em análise, recusado ou
 * sem 2FA cai em /credenciamento — que é exatamente o que o backend permite a
 * um DOCTOR_ONBOARDING; sem isto o médico entraria num painel em que toda
 * chamada responde 403.
 */
export function RequireApproved({ children }: { children: ReactNode }) {
  const { credentialing } = useAuth();

  if (credentialing && !credentialing.canPractice) {
    return <Navigate to="/credenciamento" replace />;
  }
  return <>{children}</>;
}
