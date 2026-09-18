import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import { ThemeProvider } from "@aws-amplify/ui-react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";

let configured = false;

function configureAmplify() {
  if (configured) return;
  const identityPoolId = import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID;
  if (!identityPoolId) {
    throw new Error("VITE_COGNITO_IDENTITY_POOL_ID não configurado.");
  }
  Amplify.configure({
    Auth: {
      Cognito: {
        identityPoolId,
        allowGuestAccess: true,
      },
    },
  });
  configured = true;
}

const displayText = {
  hintMoveFaceFrontOfCameraText: "Posicione o rosto na frente da câmera",
  hintTooManyFacesText: "Deixe só um rosto na frente da câmera",
  hintFaceDetectedText: "Rosto detectado",
  hintCanNotIdentifyText: "Posicione o rosto na frente da câmera",
  hintTooCloseText: "Afaste-se um pouco",
  hintTooFarText: "Aproxime-se um pouco",
  hintConnectingText: "Conectando…",
  hintVerifyingText: "Verificando…",
  hintCheckCompleteText: "Verificação concluída",
  hintIlluminationTooBrightText: "Vá para um lugar com menos luz",
  hintIlluminationTooDarkText: "Vá para um lugar mais iluminado",
  hintIlluminationNormalText: "Iluminação adequada",
  hintHoldFaceForFreshnessText: "Fique parado",
  hintCenterFaceText: "Centralize o rosto",
  hintCenterFaceInstructionText: "Centralize o rosto no oval",
  hintFaceOffCenterText: "O rosto não está centralizado",
  hintMatchIndicatorText: "50% concluído. Continue se aproximando.",
  cameraMinSpecificationsHeadingText: "A câmera não atende aos requisitos mínimos",
  cameraMinSpecificationsMessageText: "A câmera precisa ter pelo menos 320x240 e 15 quadros por segundo.",
  cameraNotFoundHeadingText: "Câmera indisponível",
  cameraNotFoundMessageText: "Verifique se a câmera está conectada e se o navegador tem permissão para usá-la.",
  retryCameraPermissionsText: "Tentar de novo",
  waitingCameraPermissionText: "Aguardando a permissão da câmera",
  a11yVideoLabelText: "Imagem da câmera para a prova de vida",
  goodFitCaptionText: "Bom enquadramento",
  goodFitAltText: "Rosto dentro do oval",
  tooFarCaptionText: "Longe demais",
  tooFarAltText: "Rosto pequeno dentro do oval",
  photosensitivityWarningHeadingText: "Aviso de fotossensibilidade",
  photosensitivityWarningBodyText: "A verificação exibe luzes coloridas. Tenha cuidado se você for fotossensível.",
  photosensitivityWarningInfoText: "Algumas pessoas podem ter convulsões ao ver luzes coloridas.",
  photosensitivityWarningLabelText: "Mais informações sobre fotossensibilidade",
  startScreenBeginCheckText: "Começar",
  recordingIndicatorText: "Gravando",
  cancelLivenessCheckText: "Cancelar",
  errorLabelText: "Erro",
  connectionTimeoutHeaderText: "Tempo esgotado",
  connectionTimeoutMessageText: "A conexão demorou demais. Tente de novo.",
  timeoutHeaderText: "Tempo esgotado",
  timeoutMessageText: "O rosto não ficou no oval a tempo. Tente de novo e mantenha o rosto dentro dele.",
  faceDistanceHeaderText: "Movimento detectado",
  faceDistanceMessageText: "Evite se aproximar da câmera durante a conexão.",
  multipleFacesHeaderText: "Mais de um rosto",
  multipleFacesMessageText: "Deixe só um rosto na frente da câmera.",
  clientHeaderText: "Erro no dispositivo",
  clientMessageText: "Não foi possível concluir por um problema no dispositivo.",
  serverHeaderText: "Erro no servidor",
  serverMessageText: "Não foi possível concluir por um problema no servidor.",
  landscapeHeaderText: "Modo paisagem não suportado",
  landscapeMessageText: "Gire o aparelho para o modo retrato.",
  portraitMessageText: "Mantenha o aparelho em modo retrato durante a verificação.",
  tryAgainText: "Tentar de novo",
};

export default function AwsLivenessDetector({
  sessionId,
  region,
  onAnalysisComplete,
  onError,
  onUserCancel,
}: {
  sessionId: string;
  region: string;
  onAnalysisComplete: () => Promise<void>;
  onError: (message: string) => void;
  onUserCancel: () => void;
}) {
  configureAmplify();
  return (
    <ThemeProvider>
      <FaceLivenessDetector
        sessionId={sessionId}
        region={region}
        onAnalysisComplete={onAnalysisComplete}
        onError={(error) => onError(error.error?.message ?? String(error.state))}
        onUserCancel={onUserCancel}
        displayText={displayText}
      />
    </ThemeProvider>
  );
}
