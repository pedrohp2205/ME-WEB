import { lazy, Suspense, useState } from "react";
import type { FaceVerificationStatusResponse, LivenessSession } from "@/lib/api/verification";
import { ApiError } from "@/lib/api/errors";
import { PrimaryButton } from "@/app/ui";
import { color, radius } from "@/theme/tokens";

const AwsLivenessDetector = lazy(() => import("./AwsLivenessDetector"));

type Stage =
  | { kind: "consent" }
  | { kind: "starting" }
  | { kind: "capturing"; session: LivenessSession }
  | { kind: "checking" }
  | { kind: "failed"; message: string };

export function LivenessCapture({
  consentAlreadyGiven,
  start,
  complete,
  onFinished,
}: {
  consentAlreadyGiven: boolean;
  start: (biometricConsent: boolean) => Promise<LivenessSession>;
  complete: (id: string) => Promise<FaceVerificationStatusResponse>;
  onFinished: (result: FaceVerificationStatusResponse) => void;
}) {
  const [consent, setConsent] = useState(consentAlreadyGiven);
  const [stage, setStage] = useState<Stage>({ kind: "consent" });

  async function begin() {
    setStage({ kind: "starting" });
    try {
      const session = await start(consent);
      if (session.provider !== "rekognition" || !session.region) {
        await finish(session);
        return;
      }
      setStage({ kind: "capturing", session });
    } catch (e) {
      setStage({ kind: "failed", message: messageOf(e) });
    }
  }

  async function finish(session: LivenessSession) {
    setStage({ kind: "checking" });
    try {
      const result = await complete(session.id);
      if (result.status === "SUCCEEDED") {
        onFinished(result);
      } else {
        setStage({
          kind: "failed",
          message:
            result.status === "EXPIRED"
              ? "A verificação expirou. Tente de novo."
              : "Não conseguimos confirmar que é você. Tente de novo em um lugar bem iluminado, olhando para a câmera.",
        });
      }
    } catch (e) {
      setStage({ kind: "failed", message: messageOf(e) });
    }
  }

  if (stage.kind === "capturing") {
    return (
      <Suspense fallback={<Aviso texto="Abrindo a câmera…" />}>
        <AwsLivenessDetector
          sessionId={stage.session.sessionId}
          region={stage.session.region!}
          onAnalysisComplete={() => finish(stage.session)}
          onError={(message) => setStage({ kind: "failed", message: `Não foi possível concluir: ${message}` })}
          onUserCancel={() => setStage({ kind: "consent" })}
        />
      </Suspense>
    );
  }

  if (stage.kind === "starting") return <Aviso texto="Preparando a verificação…" />;
  if (stage.kind === "checking") return <Aviso texto="Conferindo o resultado…" />;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {stage.kind === "failed" && (
        <div
          style={{
            padding: "12px 14px",
            background: color.dangerSoft,
            borderRadius: radius.control,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {stage.message}
        </div>
      )}

      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: color.textMuted, lineHeight: 1.8 }}>
        <li>Fique num lugar bem iluminado, sem luz forte atrás de você.</li>
        <li>Tire óculos escuros, boné ou máscara.</li>
        <li>Mantenha o rosto dentro do oval até a verificação terminar.</li>
      </ul>

      {!consentAlreadyGiven && (
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.6 }}>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span>
            Autorizo a M.E Saúde a tratar a minha biometria facial para confirmar a minha identidade no
            credenciamento, comparando o meu rosto com a foto dos documentos que enviei. A imagem é
            processada pela Amazon Web Services no Brasil e apagada em até 90 dias depois da análise do cadastro.
          </span>
        </label>
      )}

      <div>
        <PrimaryButton onClick={begin} disabled={!consent}>
          {stage.kind === "failed" ? "Tentar de novo" : "Começar a verificação"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div style={{ padding: "28px 0", textAlign: "center", fontSize: 14, color: color.textMuted }}>{texto}</div>
  );
}

function messageOf(e: unknown): string {
  return e instanceof ApiError ? e.message : "Não foi possível iniciar a verificação. Tente de novo.";
}

