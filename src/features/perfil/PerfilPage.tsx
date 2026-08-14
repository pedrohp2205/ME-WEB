import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/app/Toast";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as doctorsApi from "@/lib/api/doctors";
import { isIssuerComplete } from "@/lib/api/doctors";
import { ApiError } from "@/lib/api/errors";
import { color, radius } from "@/theme/tokens";
import {
  Card,
  Field,
  GhostButton,
  PageTitle,
  PrimaryButton,
  SectionTitle,
  TextInput,
  Chip,
} from "@/app/ui";
import { centsToInput, formatBRL, inputToCents } from "@/lib/format/money";
import { TwoFactorSection } from "./TwoFactorSection";

function errMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export function PerfilPage() {
  const { doctor, setDoctor, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const twoCol = width >= 768 ? "repeat(2,minmax(0,1fr))" : "1fr";

  const [address, setAddress] = useState(doctor?.professionalAddress ?? "");
  const [phone, setPhone] = useState(doctor?.phoneNumber ?? "");
  const [price, setPrice] = useState(centsToInput(doctor?.consultationPriceCents));
  const [savingIssuer, setSavingIssuer] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  if (!doctor) return null;
  const issuerOk = isIssuerComplete(doctor);

  async function saveIssuer() {
    if (!address.trim() || !phone.trim()) {
      toast("Preencha endereço profissional e telefone.", "err");
      return;
    }
    setSavingIssuer(true);
    try {
      const updated = await doctorsApi.updateIssuerInfo(address.trim(), phone.trim());
      setDoctor(updated);
      toast("Dados de emitente salvos. Você já pode emitir controle especial.");
    } catch (e) {
      toast(errMessage(e, "Não foi possível salvar o emitente."), "err");
    } finally {
      setSavingIssuer(false);
    }
  }

  function fillIssuerExample() {
    setAddress("Av. Dr. Antônio Gomes de Barros, 145, sala 802 — Jatiúca, Maceió/AL");
    setPhone("(82) 3025-4477");
  }

  async function savePrice() {
    const cents = inputToCents(price);
    if (cents == null) {
      toast("Informe um preço válido em reais.", "err");
      return;
    }
    setSavingPrice(true);
    try {
      const updated = await doctorsApi.updatePrice(cents);
      setDoctor(updated);
      setPrice(centsToInput(updated.consultationPriceCents));
      toast("Preço da teleconsulta atualizado.");
    } catch (e) {
      toast(errMessage(e, "Não foi possível atualizar o preço."), "err");
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <div style={{ animation: "up .25s ease-out", display: "grid", gap: 16, maxWidth: 860 }}>
      <PageTitle title="Perfil" subtitle="Seus dados profissionais e de emitente." />

      {/* Dados do médico (definidos no cadastro; somente leitura) */}
      <Card>
        <SectionTitle>Dados do médico</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: twoCol, gap: 14 }}>
          <Field label="Nome">
            <TextInput value={doctor.fullName} readOnly disabled />
          </Field>
          <Field label="CRM">
            <TextInput value={doctor.crm} readOnly disabled />
          </Field>
          <Field label="RQE">
            <TextInput value={doctor.rqe ?? "—"} readOnly disabled />
          </Field>
          <Field label="Preço atual da teleconsulta">
            <TextInput value={formatBRL(doctor.consultationPriceCents)} readOnly disabled />
          </Field>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 12, color: color.textFaint, lineHeight: 1.6 }}>
          Nome, CRM e RQE são definidos no cadastro e não são editáveis aqui.
        </p>
      </Card>

      {/* Preço da teleconsulta */}
      <Card>
        <SectionTitle>Preço da teleconsulta</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: twoCol, gap: 14, alignItems: "end" }}>
          <Field label="Valor em reais (R$)" hint="Ex.: 180 ou 180,00">
            <TextInput
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="180,00"
            />
          </Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={savePrice} disabled={savingPrice}>
            {savingPrice ? "Salvando…" : "Salvar preço"}
          </PrimaryButton>
        </div>
      </Card>

      {/* Dados de emitente */}
      <Card style={{ borderColor: issuerOk ? color.border : color.primarySoftBorder }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Dados de emitente</h2>
          <Chip
            label={issuerOk ? "completo" : "incompleto"}
            bg={issuerOk ? color.tealSoft : color.primarySoft}
            fg={issuerOk ? color.teal : color.primary}
          />
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
          Endereço profissional e telefone são obrigatórios para emitir receita de controle
          especial (Portaria 344/98).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: twoCol, gap: 14 }}>
          <Field label="Endereço profissional">
            <TextInput
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, sala, bairro, cidade/UF"
            />
          </Field>
          <Field label="Telefone">
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(82) 0000-0000"
            />
          </Field>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          <PrimaryButton onClick={saveIssuer} disabled={savingIssuer}>
            {savingIssuer ? "Salvando…" : "Salvar dados"}
          </PrimaryButton>
          <GhostButton onClick={fillIssuerExample}>Preencher exemplo</GhostButton>
        </div>
      </Card>

      {/* Segurança (2FA) */}
      <TwoFactorSection />

      {/* Ações */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <GhostButton onClick={() => navigate("/verificar")}>Verificação pública</GhostButton>
        <button
          onClick={() => void logout()}
          style={{
            height: 46,
            padding: "0 20px",
            border: `1px solid ${color.border}`,
            borderRadius: radius.pill,
            background: color.surface,
            color: color.danger,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
