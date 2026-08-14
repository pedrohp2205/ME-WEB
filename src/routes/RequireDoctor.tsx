import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { Splash } from "@/app/Splash";
import type { ReactNode } from "react";

/** Guarda de rota: só entra quem tem sessão válida de médico (DOCTOR). */
export function RequireDoctor({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Splash label="Validando sessão…" />;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
