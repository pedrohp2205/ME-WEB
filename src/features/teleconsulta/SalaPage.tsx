import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { SoapCard } from "@/features/consultas/SoapCard";
import * as appointmentsApi from "@/lib/api/appointments";
import type { Teleconsultation } from "@/lib/api/appointments";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import { dateBR, timeLocal } from "@/lib/format/datetime";
import { color, radius } from "@/theme/tokens";
import { GhostButton, PrimaryButton } from "@/app/ui";
import { useToast } from "@/app/Toast";
import { loadJitsiApi } from "./jitsi";
import type { JitsiApi } from "./jitsi";

type Phase = "loading" | "joining" | "blocked" | "error";

interface Blocked {
  title: string;
  detail: string;
  waiting: boolean;
}

/** Sala de teleconsulta embutida no painel. O médico entra como moderador. */
export function SalaPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { doctor } = useAuth();
  const width = useWindowWidth();
  const sideBySide = width >= 1024;
  const { toast } = useToast();

  const container = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [error, setError] = useState("");
  const [room, setRoom] = useState<Teleconsultation | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);

  /**
   * Concluir encerra a chamada junto: uma consulta concluída deixa de ser
   * SCHEDULED, e a partir daí o backend recusa reabrir a sala.
   */
  async function finish() {
    setFinishing(true);
    try {
      await appointmentsApi.complete(id);
      apiRef.current?.executeCommand("hangup");
      apiRef.current?.dispose();
      apiRef.current = null;
      toast("Consulta concluída.");
      navigate(`/consultas/${id}`);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Não foi possível concluir a consulta.", "err");
      setFinishing(false);
      setConfirmFinish(false);
    }
  }

  useEffect(() => {
    let alive = true;

    async function join() {
      setPhase("loading");
      setBlocked(null);
      setError("");
      try {
        const tele = await appointmentsApi.getTeleconsultation(id);
        if (!alive) return;
        setRoom(tele);
        setPhase("joining");
      } catch (e) {
        if (!alive) return;
        const reason = describe(e);
        if (reason) {
          setBlocked(reason);
          setPhase("blocked");
        } else {
          setError(e instanceof ApiError ? e.message : "Não foi possível abrir a sala.");
          setPhase("error");
        }
      }
    }

    join();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (phase !== "joining" || !room || !container.current) return;

    let alive = true;
    let api: JitsiApi | null = null;

    loadJitsiApi(room.serverUrl)
      .then((JitsiMeetExternalAPI) => {
        if (!alive || !container.current) return;
        api = new JitsiMeetExternalAPI(hostOf(room.serverUrl), {
          roomName: room.roomName,
          jwt: room.token ?? undefined,
          parentNode: container.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: doctor?.fullName ?? "Médico(a)" },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            MOBILE_APP_PROMO: false,
          },
        });
        apiRef.current = api;

        api.addListener("readyToClose", () => {
          if (alive) navigate(`/consultas/${id}`);
        });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Não foi possível carregar o servidor de vídeo.");
        setPhase("error");
      });

    return () => {
      alive = false;
      api?.dispose();
      apiRef.current = null;
    };
  }, [phase, room, doctor, id, navigate]);

  return (
    <div style={{ animation: "up .25s ease-out", display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <GhostButton onClick={() => navigate(`/consultas/${id}`)}>Voltar ao atendimento</GhostButton>
        {room && (
          <span style={{ fontSize: 13, color: color.textMuted }}>
            {dateBR(room.startDatetime)} · {timeLocal(room.startDatetime)}–{timeLocal(room.endDatetime)}
          </span>
        )}
        {room && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {confirmFinish ? (
              <>
                <span style={{ fontSize: 13, color: color.textMuted }}>
                  Encerrar a chamada e concluir? Salve o rascunho antes, se ainda não salvou.
                </span>
                <GhostButton onClick={() => setConfirmFinish(false)} disabled={finishing}>
                  Voltar
                </GhostButton>
                <PrimaryButton onClick={finish} disabled={finishing}>
                  {finishing ? "Concluindo…" : "Confirmar"}
                </PrimaryButton>
              </>
            ) : (
              <PrimaryButton onClick={() => setConfirmFinish(true)}>Concluir consulta</PrimaryButton>
            )}
          </span>
        )}
      </div>

      {phase === "blocked" && blocked && <BlockedCard blocked={blocked} onRetry={() => setPhase("loading")} />}

      {phase === "error" && (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: radius.card,
            background: color.dangerSoft,
            color: color.danger,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {error}
          {room && (
            <div style={{ marginTop: 12 }}>
              <a
                href={room.roomUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: color.danger, fontWeight: 600 }}
              >
                Abrir a sala em outra aba
              </a>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: sideBySide ? "minmax(0,1.35fr) minmax(360px,1fr)" : "1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {(phase === "loading" || phase === "joining") && (
          <div
            style={{
              position: "relative",
              height: sideBySide ? "min(72vh, 720px)" : "min(52vh, 460px)",
              borderRadius: radius.card,
              overflow: "hidden",
              background: color.ink,
            }}
          >
            <div ref={container} style={{ position: "absolute", inset: 0 }} />
            {phase === "loading" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "#FFFFFF",
                  fontSize: 14,
                }}
              >
                Conectando à sala…
              </div>
            )}
          </div>
        )}

        <SoapCard appointmentId={id} canEdit twoCol="1fr" />
      </div>
    </div>
  );
}

function BlockedCard({ blocked, onRetry }: { blocked: Blocked; onRetry: () => void }) {
  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: radius.card,
        background: blocked.waiting ? color.warnSoft : color.mutedAlt,
        border: `1px solid ${blocked.waiting ? color.warnSoftBorder : color.border}`,
        display: "grid",
        gap: 8,
      }}
    >
      <strong style={{ fontSize: 15, color: color.text }}>{blocked.title}</strong>
      <span style={{ fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>{blocked.detail}</span>
      {blocked.waiting && (
        <div style={{ marginTop: 6 }}>
          <GhostButton onClick={onRetry}>Verificar de novo</GhostButton>
        </div>
      )}
    </div>
  );
}

/**
 * Traduz as recusas do backend. O 402 não tem retry: quem paga é o paciente,
 * e o médico não tem ação possível além de esperar.
 */
function describe(e: unknown): Blocked | null {
  if (!(e instanceof ApiError)) return null;
  if (e.status === 402) {
    return {
      title: "Aguardando o pagamento do paciente",
      detail:
        "A sala é liberada assim que o pagamento da teleconsulta for confirmado. " +
        "O paciente recebe o aviso no aplicativo.",
      waiting: false,
    };
  }
  if (e.status === 422) {
    return { title: "A sala ainda não está aberta", detail: e.message, waiting: true };
  }
  return null;
}

function hostOf(serverUrl: string): string {
  try {
    return new URL(serverUrl).host;
  } catch {
    return serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
