import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { Splash } from "@/app/Splash";
import type { ReactNode } from "react";

/** Impede que um médico já autenticado veja o login; manda pro painel. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <Splash label="Carregando…" />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}
