import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as docsApi from "@/lib/api/medicalDocuments";
import type { DocumentVerification } from "@/lib/api/medicalDocuments";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import { docStatusLabel } from "@/lib/domain/document";
import { dateBR } from "@/lib/format/datetime";
import { color, radius, shadow } from "@/theme/tokens";
import { MeLogo } from "@/app/MeLogo";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: DocumentVerification }
  | { kind: "fail"; message: string };

export function VerifyPage() {
  const navigate = useNavigate();
  const { status: authStatus } = useAuth();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get("codigo") ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function doVerify(value: string) {
    const c = value.trim();
    if (!c) return;
    setState({ kind: "loading" });
    try {
      const data = await docsApi.verify(c);
      setState({ kind: "ok", data });
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 404
          ? "Código não encontrado. Confira os caracteres e tente novamente."
          : e instanceof ApiError
            ? e.message
            : "Não foi possível verificar agora.";
      setState({ kind: "fail", message });
    }
  }

  // Verifica automaticamente se veio ?codigo= na URL.
  useEffect(() => {
    const initial = params.get("codigo");
    if (initial) void doVerify(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 20px",
        background: color.muted,
        fontFamily: "Poppins, sans-serif",
        color: color.text,
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <MeLogo height={26} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>Verificação pública de documento</div>
        </div>

        <div
          style={{
            background: color.surface,
            border: `1px solid ${color.border}`,
            borderRadius: radius.card,
            padding: 24,
            boxShadow: shadow.card,
          }}
        >
          <p style={{ margin: "0 0 16px", color: color.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            Informe o código impresso no rodapé do documento. Nenhum dado clínico é exibido aqui.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doVerify(code)}
              placeholder="Código de validação"
              style={{
                flex: 1,
                minWidth: 180,
                height: 48,
                padding: "0 16px",
                border: `1px solid ${color.border}`,
                borderRadius: radius.control,
                background: color.muted,
                fontSize: 14,
                letterSpacing: 1,
                outline: "none",
              }}
            />
            <button
              onClick={() => doVerify(code)}
              style={{
                height: 48,
                padding: "0 22px",
                border: "none",
                borderRadius: 999,
                background: color.primary,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Verificar
            </button>
          </div>

          {state.kind === "loading" && (
            <div
              style={{
                marginTop: 20,
                height: 96,
                borderRadius: radius.control,
                background: "linear-gradient(90deg,#F4EDE9,#FBF6F3,#F4EDE9)",
                backgroundSize: "200% 100%",
                animation: "sh 1.2s infinite",
              }}
            />
          )}

          {state.kind === "fail" && (
            <div
              style={{
                marginTop: 20,
                padding: "16px 18px",
                borderRadius: radius.control,
                background: color.dangerSoft,
                color: color.danger,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {state.message}
            </div>
          )}

          {state.kind === "ok" && <ResultCard data={state.data} />}
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => navigate(authStatus === "authenticated" ? "/" : "/login")}
            style={{
              border: "none",
              background: "none",
              color: color.textMuted,
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 12px",
            }}
          >
            {authStatus === "authenticated" ? "Voltar ao painel" : "Voltar ao login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ data }: { data: DocumentVerification }) {
  const ok = data.signed && !data.canceled;
  const headBg = ok ? color.tealSoft : color.dangerSoft;
  const headFg = ok ? color.teal : color.danger;
  const headline = data.canceled
    ? "Documento cancelado pelo emitente"
    : data.signed
      ? "Documento autêntico e assinado"
      : "Documento ainda não assinado";

  const rows: [string, string][] = [
    ["Tipo", data.documentType],
    ["Status", docStatusLabel(data.status)],
    ["Emitente", [data.doctorName, data.doctorCrm].filter(Boolean).join(" · ") || "—"],
    ["Paciente", data.patientInitials],
    ["Emissão", dateBR(data.issuedAt)],
  ];

  return (
    <div
      style={{
        marginTop: 20,
        border: `1px solid ${color.border}`,
        borderRadius: radius.control,
        overflow: "hidden",
        animation: "up .25s ease-out",
      }}
    >
      <div style={{ padding: "14px 18px", background: headBg, color: headFg, fontSize: 14, fontWeight: 600 }}>
        {headline}
      </div>
      <div style={{ padding: 18, display: "grid", gap: 12 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13 }}>
            <span style={{ color: color.textMuted }}>{k}</span>
            <span style={{ fontWeight: 500, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
