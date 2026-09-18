import { useEffect, useMemo, useState } from "react";
import {
  completeHandoffLiveness,
  getHandoff,
  startHandoffLiveness,
  type HandoffStatus,
} from "@/lib/api/verification";
import { ApiError } from "@/lib/api/errors";
import { MeBrand } from "@/app/MeLogo";
import { Card, Chip } from "@/app/ui";
import { color } from "@/theme/tokens";
import { LivenessCapture } from "./LivenessCapture";

type State =
  | { kind: "loading" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; status: HandoffStatus }
  | { kind: "done" };

function tokenFromHash(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("t");
}

export function VerificacaoFacialMobilePage() {
  const token = useMemo(tokenFromHash, []);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Link incompleto. Leia o QR code de novo no computador." });
      return;
    }
    getHandoff(token)
      .then((status) => setState(status.faceVerified ? { kind: "done" } : { kind: "ready", status }))
      .catch((e) =>
        setState({
          kind: "invalid",
          message: e instanceof ApiError ? e.message : "Não foi possível abrir a verificação.",
        }),
      );
  }, [token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.appBg,
        color: color.text,
        fontFamily: "Poppins, sans-serif",
        padding: "28px 16px 48px",
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <MeBrand height={34} />
        </div>

        <Card padding={24}>
          {state.kind === "loading" && <p style={{ margin: 0, color: color.textMuted }}>Carregando…</p>}

          {state.kind === "invalid" && (
            <>
              <Chip label="Link inválido" bg={color.dangerSoft} fg={color.danger} />
              <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.7 }}>{state.message}</p>
            </>
          )}

          {state.kind === "ready" && token && (
            <>
              <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600, letterSpacing: "-.4px" }}>
                Olá, {state.status.firstName}
              </h1>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
                Vamos confirmar que é você. Segure o celular na altura do rosto, em modo retrato.
              </p>
              <LivenessCapture
                consentAlreadyGiven={state.status.biometricConsentGiven}
                start={(consent) => startHandoffLiveness(token, consent)}
                complete={(id) => completeHandoffLiveness(token, id)}
                onFinished={() => setState({ kind: "done" })}
              />
            </>
          )}

          {state.kind === "done" && (
            <>
              <Chip label="Concluído" bg={color.tealSoft} fg={color.teal} />
              <h1 style={{ margin: "14px 0 8px", fontSize: 22, fontWeight: 600 }}>Prova de vida concluída</h1>
              <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
                Pode voltar para o computador: a tela de lá já foi atualizada. Você pode fechar esta página.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
