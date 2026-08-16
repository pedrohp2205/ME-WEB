import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ToastProvider } from "@/app/Toast";
import { RequireDoctor } from "@/routes/RequireDoctor";
import { RequireApproved } from "@/routes/RequireApproved";
import { PublicOnly } from "@/routes/PublicOnly";
import { LoginPage } from "@/features/auth/LoginPage";
import { CadastroPage } from "@/features/auth/CadastroPage";
import { CredenciamentoPage } from "@/features/auth/CredenciamentoPage";
import { VerifyPage } from "@/features/public/VerifyPage";
import { OAuthRedirect } from "@/pages/OAuthRedirect";
import { SignatureCallback } from "@/pages/SignatureCallback";
import { AppShell } from "@/app/shell/AppShell";
import { ComingSoon } from "@/app/shell/ComingSoon";
import { PerfilPage } from "@/features/perfil/PerfilPage";
import { AgendaPage } from "@/features/agenda/AgendaPage";
import { ConsultasPage } from "@/features/consultas/ConsultasPage";
import { ConsultaDetailPage } from "@/features/consultas/ConsultaDetailPage";
import { SalaPage } from "@/features/teleconsulta/SalaPage";
import { DocumentosPage } from "@/features/documentos/DocumentosPage";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Públicas */}
            <Route
              path="/login"
              element={
                <PublicOnly>
                  <LoginPage />
                </PublicOnly>
              }
            />
            <Route
              path="/cadastro"
              element={
                <PublicOnly>
                  <CadastroPage />
                </PublicOnly>
              }
            />
            <Route path="/verificar" element={<VerifyPage />} />
            <Route path="/oauth2/redirect" element={<OAuthRedirect />} />
            <Route path="/document-signature/callback" element={<SignatureCallback />} />

            {/* Autenticado, mas ainda sem credenciamento (análise / 2FA) */}
            <Route
              path="/credenciamento"
              element={
                <RequireDoctor>
                  <CredenciamentoPage />
                </RequireDoctor>
              }
            />

            {/* Protegidas (papel DOCTOR credenciado) — shell com navegação */}
            <Route
              element={
                <RequireDoctor>
                  <RequireApproved>
                    <AppShell />
                  </RequireApproved>
                </RequireDoctor>
              }
            >
              <Route path="/" element={<ComingSoon title="Início" part="Parte 3" />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/consultas" element={<ConsultasPage />} />
              <Route path="/consultas/:id" element={<ConsultaDetailPage />} />
              <Route path="/consultas/:id/sala" element={<SalaPage />} />
              <Route path="/documentos" element={<DocumentosPage />} />
              <Route path="/modelos" element={<ComingSoon title="Modelos" part="Parte 6" />} />
              <Route path="/acessos" element={<ComingSoon title="Acessos" part="Parte 6" />} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
