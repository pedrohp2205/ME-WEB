import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as doctorsApi from "@/lib/api/doctors";
import { ApiError } from "@/lib/api/errors";
import { useWindowWidth } from "@/lib/useWindowWidth";
import { MeBrand } from "@/app/MeLogo";
import { Field, GhostButton, PrimaryButton, Select, TextInput } from "@/app/ui";
import { color, radius } from "@/theme/tokens";

const STEP_LABELS = ["Dados pessoais", "Registro profissional", "Acesso"];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface Form {
  fullName: string;
  cpf: string;
  phoneNumber: string;
  crm: string;
  crmUf: string;
  rqe: string;
  email: string;
  password: string;
  confirm: string;
}

const BLANK: Form = {
  fullName: "",
  cpf: "",
  phoneNumber: "",
  crm: "",
  crmUf: "",
  rqe: "",
  email: "",
  password: "",
  confirm: "",
};

// ---------------------------------------------------------------- máscaras

function maskCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Mesma regra do value object Cpf do backend — evita ida e volta à API. */
function isValidCpf(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (d.split("").every((c) => c === d[0])) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// ---------------------------------------------------------------- senha

const PASSWORD_RULES: Array<{ label: string; ok: (s: string) => boolean }> = [
  { label: "Pelo menos 8 caracteres", ok: (s) => s.length >= 8 },
  { label: "Uma letra maiúscula", ok: (s) => /[A-Z]/.test(s) },
  { label: "Uma letra minúscula", ok: (s) => /[a-z]/.test(s) },
  { label: "Um número", ok: (s) => /\d/.test(s) },
  {
    label: "Um caractere especial",
    ok: (s) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s),
  },
];

function passwordProblem(s: string): string {
  const falha = PASSWORD_RULES.find((r) => !r.ok(s));
  return falha ? `A senha precisa de: ${falha.label.toLowerCase()}.` : "";
}

// ---------------------------------------------------------------- página

export function CadastroPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setFormState] = useState<Form>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const twoColumns = useWindowWidth() >= 1024;
  const set = (patch: Partial<Form>) => {
    setFormState((f) => ({ ...f, ...patch }));
    setFormError("");
  };

  function validateStep(n: number): boolean {
    const e: Partial<Record<keyof Form, string>> = {};

    if (n === 1) {
      if (form.fullName.trim().length < 3) e.fullName = "Informe seu nome completo.";
      if (!isValidCpf(form.cpf)) e.cpf = "Informe um CPF válido.";
      const tel = form.phoneNumber.replace(/\D/g, "");
      if (tel && tel.length < 10) e.phoneNumber = "Informe o telefone com DDD.";
    }

    if (n === 2) {
      if (!form.crm.trim()) e.crm = "Informe o número do CRM.";
      else if (form.crm.trim().length > 20) e.crm = "O CRM deve ter no máximo 20 caracteres.";
      if (!form.crmUf) e.crmUf = "Selecione a UF do CRM.";
      if (form.rqe.trim().length > 100) e.rqe = "O RQE deve ter no máximo 100 caracteres.";
    }

    if (n === 3) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Informe um e-mail válido.";
      const p = passwordProblem(form.password);
      if (p) e.password = p;
      if (form.confirm !== form.password) e.confirm = "As senhas não conferem.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    setFormError("");
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEP_LABELS.length, s + 1));
  }

  function back() {
    setFormError("");
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    if (!validateStep(3)) return;
    setBusy(true);
    setFormError("");
    try {
      await doctorsApi.registerDoctor({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        crm: form.crm.trim(),
        crmUf: form.crmUf,
        cpf: form.cpf.replace(/\D/g, ""),
        rqe: form.rqe.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
      });
      setSent(true);
    } catch (e) {
      setFormError(
        e instanceof ApiError ? e.message : "Não foi possível enviar o cadastro.",
      );
    } finally {
      setBusy(false);
    }
  }

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
      {/* Coluna do formulário (à direita no desktop, como no login) */}
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
        <div style={{ width: "100%", maxWidth: 440, animation: "up .3s ease-out" }}>
          <div style={{ marginBottom: 32 }}>
            <MeBrand height={48} showLabel={false} />
          </div>

          {sent ? (
            <EnviadoComSucesso onGoToLogin={() => navigate("/login", { replace: true })} />
          ) : (
            <>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-.6px",
                }}
              >
                Criar cadastro médico
              </h1>
              <p
                style={{
                  margin: "0 0 22px",
                  color: color.textMuted,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                Preencha seus dados. A equipe M.E Saúde confere seu registro no
                conselho antes de liberar o painel.
              </p>

              <Stepper step={step} />

              <div style={{ display: "grid", gap: 16, marginTop: 22 }}>
                {step === 1 && (
                  <>
                    <Field label="Nome completo">
                      <TextInput
                        value={form.fullName}
                        onChange={(e) => set({ fullName: e.target.value })}
                        placeholder="Maria Silva Souza"
                        autoComplete="name"
                      />
                      <Erro msg={errors.fullName} />
                    </Field>
                    <Field label="CPF">
                      <TextInput
                        value={form.cpf}
                        onChange={(e) => set({ cpf: maskCpf(e.target.value) })}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                      <Erro msg={errors.cpf} />
                    </Field>
                    <Field label="Telefone (opcional)" hint="Aparece nos documentos que você emitir.">
                      <TextInput
                        value={form.phoneNumber}
                        onChange={(e) => set({ phoneNumber: maskPhone(e.target.value) })}
                        placeholder="(11) 90000-0000"
                        inputMode="tel"
                      />
                      <Erro msg={errors.phoneNumber} />
                    </Field>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12 }}>
                      <Field label="CRM">
                        <TextInput
                          value={form.crm}
                          onChange={(e) => set({ crm: e.target.value })}
                          placeholder="123456"
                        />
                        <Erro msg={errors.crm} />
                      </Field>
                      <Field label="UF">
                        <Select
                          value={form.crmUf}
                          onChange={(e) => set({ crmUf: e.target.value })}
                        >
                          <option value="">—</option>
                          {UFS.map((uf) => (
                            <option key={uf} value={uf}>
                              {uf}
                            </option>
                          ))}
                        </Select>
                        <Erro msg={errors.crmUf} />
                      </Field>
                    </div>
                    <Field
                      label="RQE (opcional)"
                      hint="Registro de Qualificação de Especialista, se você tiver."
                    >
                      <TextInput
                        value={form.rqe}
                        onChange={(e) => set({ rqe: e.target.value })}
                        placeholder="12345"
                      />
                      <Erro msg={errors.rqe} />
                    </Field>
                    <p style={{ margin: 0, fontSize: 12, color: color.textFaint, lineHeight: 1.6 }}>
                      Suas especialidades e o valor da consulta são configurados no
                      painel, depois da aprovação.
                    </p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <Field label="E-mail">
                      <TextInput
                        value={form.email}
                        onChange={(e) => set({ email: e.target.value })}
                        type="email"
                        placeholder="voce@clinica.com.br"
                        autoComplete="email"
                      />
                      <Erro msg={errors.email} />
                    </Field>
                    <Field label="Senha">
                      <TextInput
                        value={form.password}
                        onChange={(e) => set({ password: e.target.value })}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <Erro msg={errors.password} />
                      <RegrasDeSenha value={form.password} />
                    </Field>
                    <Field label="Confirmar senha">
                      <TextInput
                        value={form.confirm}
                        onChange={(e) => set({ confirm: e.target.value })}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        onKeyDown={(e) => e.key === "Enter" && void submit()}
                      />
                      <Erro msg={errors.confirm} />
                    </Field>
                  </>
                )}
              </div>

              {formError && (
                <div
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: color.danger,
                    lineHeight: 1.5,
                  }}
                >
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                {step > 1 && <GhostButton onClick={back} disabled={busy}>Voltar</GhostButton>}
                {step < STEP_LABELS.length ? (
                  <PrimaryButton onClick={next} style={{ flex: 1 }}>
                    Continuar
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onClick={() => void submit()} disabled={busy} style={{ flex: 1 }}>
                    {busy ? "Enviando…" : "Enviar cadastro"}
                  </PrimaryButton>
                )}
              </div>

              <div style={{ marginTop: 20, fontSize: 13, color: color.textMuted }}>
                Já tem conta?{" "}
                <button
                  onClick={() => navigate("/login")}
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
                  Entrar no painel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Coluna de arte — mesma composição do login */}
      {twoColumns && (
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            position: "relative",
            overflow: "hidden",
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
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "44px 56px 0" }}>
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
                Cadastre-se e atenda com agenda, prontuário e receita assinada.
              </h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- peças

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                background: done ? color.teal : active ? color.primary : color.muted,
                color: step >= n ? "#fff" : color.textMuted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {done ? "✓" : n}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: active ? color.text : color.textMuted,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
            {n < STEP_LABELS.length && (
              <span style={{ width: 16, height: 1, background: color.border }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ fontSize: 12, color: color.danger, marginTop: 6, lineHeight: 1.5 }}>{msg}</div>
  );
}

function RegrasDeSenha({ value }: { value: string }) {
  return (
    <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.ok(value);
        return (
          <div
            key={r.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: ok ? color.teal : color.textFaint,
            }}
          >
            <span style={{ width: 12, textAlign: "center" }}>{ok ? "✓" : "•"}</span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

function EnviadoComSucesso({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 26,
          padding: "0 12px",
          borderRadius: 999,
          background: color.tealSoft,
          color: color.teal,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Cadastro enviado
      </span>
      <h1
        style={{
          margin: "16px 0 10px",
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-.6px",
          lineHeight: 1.25,
        }}
      >
        Recebemos seus dados
      </h1>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
        A equipe M.E Saúde vai conferir seu registro no conselho. Enquanto isso
        você já pode entrar com seu e-mail e senha — o painel abre assim que o
        cadastro for aprovado.
      </p>
      <div
        style={{
          padding: "14px 16px",
          background: color.muted,
          border: `1px solid ${color.border}`,
          borderRadius: radius.control,
          fontSize: 13,
          color: color.textMuted,
          lineHeight: 1.7,
          marginBottom: 22,
        }}
      >
        Depois da aprovação você ainda ativa a verificação em duas etapas e
        vincula seu certificado digital para assinar documentos.
      </div>
      <PrimaryButton onClick={onGoToLogin} style={{ width: "100%" }}>
        Ir para o login
      </PrimaryButton>
    </div>
  );
}
