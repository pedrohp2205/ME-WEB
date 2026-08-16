// Editor do resumo clínico em SOAP. Vive fora da página de atendimento porque
// o médico também precisa dele durante a teleconsulta, ao lado da sala.
import { useEffect, useState } from "react";
import { useToast } from "@/app/Toast";
import * as consultationsApi from "@/lib/api/consultations";
import type { ConsultationSummary } from "@/lib/api/consultations";
import { ApiError } from "@/lib/api/errors";
import { dateBR, timeLocal } from "@/lib/format/datetime";
import { Card, Chip, Field, GhostButton, TextArea } from "@/app/ui";
import { ErrorBox } from "./ConsultasPage";
import { color, radius } from "@/theme/tokens";

function msg(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export function SoapCard({
  appointmentId,
  canEdit,
  twoCol,
}: {
  appointmentId: string;
  canEdit: boolean;
  twoCol: string;
}) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [s, setS] = useState("");
  const [o, setO] = useState("");
  const [as, setAs] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "sign">("");
  const [confirmSign, setConfirmSign] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    consultationsApi
      .getByAppointment(appointmentId)
      .then((sum) => {
        if (!alive) return;
        setSummary(sum);
        setS(sum?.subjective ?? "");
        setO(sum?.objective ?? "");
        setAs(sum?.assessment ?? "");
        setP(sum?.plan ?? "");
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setLoadError(msg(e, "Não foi possível carregar o resumo."));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [appointmentId]);

  const signed = !!summary?.isSigned;
  const locked = !canEdit || signed;

  function fields() {
    return {
      subjective: s.trim() || null,
      objective: o.trim() || null,
      assessment: as.trim() || null,
      plan: p.trim() || null,
    };
  }

  async function saveDraft() {
    setBusy("save");
    try {
      const res = summary
        ? await consultationsApi.updateSummary(summary.id, fields())
        : await consultationsApi.createSummary(appointmentId, fields());
      setSummary(res);
      toast("Rascunho do resumo salvo.");
    } catch (e) {
      toast(msg(e, "Não foi possível salvar o resumo."), "err");
    } finally {
      setBusy("");
    }
  }

  async function doSign() {
    if (!summary) return;
    setBusy("sign");
    try {
      const res = await consultationsApi.signSummary(summary.id);
      setSummary(res);
      setConfirmSign(false);
      toast("Resumo clínico assinado.");
    } catch (e) {
      toast(msg(e, "Não foi possível assinar o resumo."), "err");
    } finally {
      setBusy("");
    }
  }

  if (loading)
    return (
      <Card>
        <div style={{ fontSize: 13, color: color.textMuted }}>Carregando resumo…</div>
      </Card>
    );
  if (loadError)
    return (
      <Card>
        <ErrorBox message={loadError} onRetry={() => window.location.reload()} />
      </Card>
    );

  return (
    <Card style={{ opacity: canEdit ? 1 : 0.7 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Resumo clínico (SOAP)</h2>
        {signed && (
          <Chip label="Assinado · somente leitura" bg={color.tealSoft} fg={color.teal} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: twoCol, gap: 14 }}>
        <Field label="Subjetivo" hint="Queixa e relato do paciente">
          <TextArea value={s} disabled={locked} onChange={(e) => setS(e.target.value)}
            placeholder="Queixa e história relatadas" />
        </Field>
        <Field label="Objetivo" hint="Exame físico e achados">
          <TextArea value={o} disabled={locked} onChange={(e) => setO(e.target.value)}
            placeholder="Exame físico e achados" />
        </Field>
        <Field label="Avaliação" hint="Hipótese e diagnóstico">
          <TextArea value={as} disabled={locked} onChange={(e) => setAs(e.target.value)}
            placeholder="Hipóteses e diagnóstico" />
        </Field>
        <Field label="Plano" hint="Conduta e tratamento">
          <TextArea value={p} disabled={locked} onChange={(e) => setP(e.target.value)}
            placeholder="Conduta, prescrição e retorno" />
        </Field>
      </div>

      {signed && summary?.signedAt && (
        <p style={{ margin: "16px 0 0", fontSize: 12, color: color.teal }}>
          Assinado em {dateBR(summary.signedAt)} às {timeLocal(summary.signedAt)}.
        </p>
      )}

      {canEdit && !signed && (
        <div style={{ marginTop: 16 }}>
          {!confirmSign ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <GhostButton onClick={saveDraft} disabled={!!busy}>
                {busy === "save" ? "Salvando…" : "Salvar rascunho"}
              </GhostButton>
              <button
                onClick={() => setConfirmSign(true)}
                disabled={!summary || !!busy}
                title={!summary ? "Salve o rascunho antes de assinar." : undefined}
                style={{
                  height: 46,
                  padding: "0 22px",
                  border: "none",
                  borderRadius: 999,
                  background: color.ink,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: !summary || busy ? "default" : "pointer",
                  opacity: !summary || busy ? 0.5 : 1,
                }}
              >
                Assinar resumo
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
                padding: 16,
                borderRadius: radius.control,
                background: color.muted,
                border: `1px solid ${color.border}`,
              }}
            >
              <div style={{ fontSize: 13, color: color.text, lineHeight: 1.6 }}>
                <strong>Assinar é definitivo.</strong> Após assinar, o resumo fica somente leitura
                e não poderá mais ser editado.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <button
                  onClick={doSign}
                  disabled={!!busy}
                  style={{
                    height: 44,
                    padding: "0 22px",
                    border: "none",
                    borderRadius: 999,
                    background: color.ink,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {busy === "sign" ? "Assinando…" : "Confirmar assinatura"}
                </button>
                <GhostButton onClick={() => setConfirmSign(false)} disabled={!!busy}>
                  Cancelar
                </GhostButton>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
