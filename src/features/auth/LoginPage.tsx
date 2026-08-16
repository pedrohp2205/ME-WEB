import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/errors";
import { API_BASE_URL } from "@/lib/api/http";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { MeBrand } from "@/app/MeLogo";
import { color, radius } from "@/theme/tokens";

type Phase = "login" | "2fa";

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 48,
  padding: "0 16px",
  border: `1px solid ${color.border}`,
  borderRadius: radius.control,
  background: color.muted,
  fontSize: 14,
  color: color.text,
  outline: "none",
  transition: "border-color .18s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: color.textMuted,
  marginBottom: 6,
};

const errStyle: React.CSSProperties = {
  height: 18,
  fontSize: 12,
  color: color.danger,
  padding: "3px 4px",
};

export function LoginPage() {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [code, setCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errSenha, setErrSenha] = useState("");
  const [errCode, setErrCode] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    let ee = "";
    let es = "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) ee = "Informe um e-mail válido.";
    if (senha.length < 4) es = "A senha deve ter ao menos 4 caracteres.";
    setErrEmail(ee);
    setErrSenha(es);
    setFormError("");
    if (ee || es) return;

    setBusy(true);
    try {
      const res = await login(email, senha);
      if (res.kind === "twoFactor") {
        setChallengeToken(res.challengeToken);
        setPhase("2fa");
        setCode("");
      } else {
        navigate("/", { replace: true });
      }
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Falha ao entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code)) {
      setErrCode("O código deve ter 6 dígitos.");
      return;
    }
    setErrCode("");
    setFormError("");
    setBusy(true);
    try {
      await verifyTwoFactor(challengeToken, code);
      navigate("/", { replace: true });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Falha ao verificar.");
    } finally {
      setBusy(false);
    }
  }

  function handleGoogle() {
    // Fluxo OAuth2 do backend; retorna em /oauth2/redirect com os tokens.
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  }

  const twoColumns = useWindowWidth() >= 1024;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: twoColumns ? "1fr 1fr" : "1fr",
        alignItems: "stretch",
        background: color.appBg,
        color: color.text,
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Coluna do formulário (à direita no desktop) */}
      <div
        style={{
          gridColumn: twoColumns ? 2 : "auto",
          gridRow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400, animation: "up .3s ease-out" }}>
          <div style={{ marginBottom: 36 }}>
            <MeBrand height={48} showLabel={false} />
          </div>

          {phase === "login" ? (
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
                Entrar no painel
              </h1>
              <p style={{ margin: "0 0 28px", color: color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                Acesse para gerenciar sua agenda, atender e emitir documentos assinados.
              </p>

              <label style={labelStyle}>E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="voce@clinica.com.br"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={inputStyle}
              />
              <div style={errStyle}>{errEmail}</div>

              <label style={labelStyle}>Senha</label>
              <input
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={inputStyle}
              />
              <div style={errStyle}>{errSenha}</div>

              <button
                onClick={handleLogin}
                disabled={busy}
                style={{
                  width: "100%",
                  height: 50,
                  border: "none",
                  borderRadius: radius.pill,
                  background: color.primary,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                  marginTop: 6,
                }}
              >
                {busy ? "Entrando…" : "Entrar"}
              </button>

              {formError && (
                <div style={{ marginTop: 14, fontSize: 13, color: color.danger, lineHeight: 1.5 }}>
                  {formError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  color: color.textFaint,
                  fontSize: 12,
                  margin: "22px 0 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: color.border }} />
                ou
                <div style={{ flex: 1, height: 1, background: color.border }} />
              </div>
              <button
                onClick={handleGoogle}
                style={{
                  width: "100%",
                  height: 50,
                  marginTop: 18,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.pill,
                  background: "#fff",
                  color: color.text,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Entrar com Google
              </button>

              <div
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  color: color.textMuted,
                  textAlign: "center",
                }}
              >
                Ainda não tem cadastro?{" "}
                <button
                  onClick={() => navigate("/cadastro")}
                  style={{
                    border: "none",
                    background: "none",
                    color: color.primary,
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Criar cadastro médico
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  marginTop: 22,
                }}
              >
                <span
                  title="Recuperação de senha ainda não disponível no servidor."
                  style={{ fontSize: 12, color: color.textFaint, cursor: "not-allowed" }}
                >
                  Esqueci minha senha
                </span>
                <button
                  onClick={() => navigate("/verificar")}
                  style={{
                    border: "none",
                    background: "none",
                    color: color.textMuted,
                    fontSize: 12,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: "4px 0",
                  }}
                >
                  Verificar um documento pelo código
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600, letterSpacing: "-.6px" }}>
                Verificação em duas etapas
              </h1>
              <p style={{ margin: "0 0 28px", color: color.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                Digite o código de 6 dígitos do seu aplicativo autenticador.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                style={{
                  ...inputStyle,
                  height: 64,
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: 12,
                  textAlign: "center",
                }}
              />
              <div style={{ ...errStyle, height: 20 }}>{errCode}</div>
              <button
                onClick={handleVerify}
                disabled={busy}
                style={{
                  width: "100%",
                  height: 50,
                  border: "none",
                  borderRadius: radius.pill,
                  background: color.primary,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Verificando…" : "Verificar e entrar"}
              </button>
              {formError && (
                <div style={{ marginTop: 14, fontSize: 13, color: color.danger, lineHeight: 1.5 }}>
                  {formError}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button
                  onClick={() => {
                    setPhase("login");
                    setCode("");
                    setErrCode("");
                    setFormError("");
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    color: color.textMuted,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coluna de arte (split-screen) — ilustração ancorada na base, marca no topo */}
      {twoColumns && (
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            position: "relative",
            overflow: "hidden",
            // mesmo creme da imagem — sem emenda entre panel e ilustração
            background: color.appBg,
          }}
        >
          <img
            src="/login-illustration.png"
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "bottom",
              display: "block",
            }}
          />
          {/* Degradê suave no encontro dos painéis (borda direita, junto ao
              formulário) — funde a ilustração no creme, sem linha dura. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 140,
              background:
                "linear-gradient(to left, #FFFDFB 0%, rgba(255,253,251,0.6) 45%, rgba(255,253,251,0) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* Marca no topo, sobre a área creme vazia (nunca sobre a médica/cards) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "44px 56px 0",
            }}
          >
            <div style={{ maxWidth: 420 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-.7px",
                  lineHeight: 1.22,
                  color: color.primary,
                }}
              >
                Agenda, atendimento e documentos assinados em um só lugar.
              </h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
