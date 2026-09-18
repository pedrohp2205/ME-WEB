import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { createMobileHandoff, getVerification, mobileHandoffUrl } from "@/lib/api/verification";
import { ApiError } from "@/lib/api/errors";
import { GhostButton } from "@/app/ui";
import { color, radius } from "@/theme/tokens";

const POLL_MS = 3000;

export function QrHandoff({ onVerified }: { onVerified: () => void }) {
  const [qr, setQr] = useState<{ image: string; expiresAt: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const generate = useCallback(async () => {
    setError(null);
    setQr(null);
    try {
      const handoff = await createMobileHandoff();
      const image = await QRCode.toDataURL(mobileHandoffUrl(handoff.token), { width: 240, margin: 1 });
      setQr({ image, expiresAt: new Date(handoff.expiresAt).getTime() });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível gerar o QR code.");
    }
  }, []);

  useEffect(() => {
    void generate();
  }, [generate]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!qr) return;
    let active = true;
    const poll = setInterval(async () => {
      try {
        const verification = await getVerification();
        if (active && verification.faceVerified) {
          clearInterval(poll);
          onVerified();
        }
      } catch {
        return;
      }
    }, POLL_MS);
    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [qr, onVerified]);

  const remaining = qr ? Math.max(0, Math.floor((qr.expiresAt - now) / 1000)) : 0;
  const expired = qr !== null && remaining === 0;

  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.7, maxWidth: 420 }}>
        Aponte a câmera do celular para o QR code e siga as instruções. Esta tela atualiza sozinha
        quando a verificação terminar.
      </p>

      <div
        style={{
          width: 256,
          height: 256,
          display: "grid",
          placeItems: "center",
          border: `1px solid ${color.border}`,
          borderRadius: radius.control,
          background: color.surface,
          opacity: expired ? 0.25 : 1,
        }}
      >
        {qr ? (
          <img src={qr.image} alt="QR code para fazer a prova de vida no celular" width={240} height={240} />
        ) : (
          <span style={{ fontSize: 13, color: color.textMuted }}>{error ? "—" : "Gerando…"}</span>
        )}
      </div>

      {error && <div style={{ fontSize: 13, color: color.danger }}>{error}</div>}

      {qr && !expired && (
        <div style={{ fontSize: 12, color: color.textFaint }}>
          Válido por {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </div>
      )}

      {(expired || error) && (
        <GhostButton onClick={() => void generate()}>Gerar outro QR code</GhostButton>
      )}
    </div>
  );
}
