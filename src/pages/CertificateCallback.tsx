import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as doctorsApi from "@/lib/api/doctors";
import type { CertificateInfo } from "@/lib/api/doctors";
import { ApiError } from "@/lib/api/errors";
import { color, radius, shadow } from "@/theme/tokens";
import { MeLogo } from "@/app/MeLogo";
import { GhostButton, PrimaryButton } from "@/app/ui";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

/**
 * Retorno do VIDaaS após aprovar o certificado. O backend redireciona para
 * /certificado/callback; aqui buscamos o estado e mostramos sucesso/falha.
 */
export function CertificateCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await doctorsApi.getCertificate();
        if (alive) setCert(c);
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : "Não foi possível confirmar o certificado.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const linked = cert?.status === "LINKED";
  const success = !error && linked;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: color.muted,
        fontFamily: "Poppins, sans-serif",
        color: color.text,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: color.surface,
          border: `1px solid ${color.border}`,
          borderRadius: radius.card,
          padding: 28,
          boxShadow: shadow.card,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <MeLogo height={34} />
        </div>

        {loading ? (
          <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.6 }}>
            Concluindo o vínculo do certificado…
          </p>
        ) : (
          <>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 28,
                padding: "0 12px",
                borderRadius: 999,
                background: success ? color.tealSoft : color.dangerSoft,
                color: success ? color.teal : color.danger,
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {success ? "Certificado vinculado" : "Vínculo não concluído"}
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 600, letterSpacing: "-.4px" }}>
              {success ? "Tudo certo com seu certificado" : "Não foi possível concluir o vínculo"}
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.6 }}>
              {success
                ? `Seu certificado ICP-Brasil está vinculado${
                    fmtDate(cert?.notAfter ?? null) ? `, válido até ${fmtDate(cert?.notAfter ?? null)}` : ""
                  }. Você já pode assinar receitas e documentos.`
                : error ||
                  "A autorização do certificado não foi concluída. Você pode tentar vincular novamente pelo seu perfil."}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
              <PrimaryButton onClick={() => navigate("/perfil", { replace: true })}>
                Voltar ao perfil
              </PrimaryButton>
              <GhostButton onClick={() => navigate("/documentos", { replace: true })}>
                Ver Documentos
              </GhostButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
