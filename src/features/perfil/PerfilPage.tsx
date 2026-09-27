import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useToast } from "@/app/Toast";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as doctorsApi from "@/lib/api/doctors";
import { isIssuerComplete } from "@/lib/api/doctors";
import * as reviewsApi from "@/lib/api/reviews";
import * as trustedDevicesApi from "@/lib/api/trustedDevices";
import { ApiError } from "@/lib/api/errors";
import { dateBR } from "@/lib/format/datetime";
import { initials } from "@/lib/format/name";
import { Icon } from "@/app/icons";
import { color, radius, shadow } from "@/theme/tokens";
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
import { centsToInput, inputToCents } from "@/lib/format/money";
import { TwoFactorSection } from "./TwoFactorSection";

function errMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

/**
 * updatePrice/updateIssuer respondem o DoctorResponse sem `specialties`; sem isto,
 * salvar o preço/emitente zeraria os chips de especialidades em memória até um novo
 * carregamento. Preserva as especialidades atuais quando a resposta não as traz.
 */
function withSpecialties(
  updated: doctorsApi.DoctorResponse,
  prev: doctorsApi.DoctorResponse | null,
): doctorsApi.DoctorResponse {
  if (updated.specialties?.length || !prev) return updated;
  return { ...updated, specialties: prev.specialties };
}

export function PerfilPage() {
  const { doctor, setDoctor, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const width = useWindowWidth();
  // Card de topo: 3 seções lado a lado quando há largura; senão empilha.
  const topCols = width >= 1080 ? 3 : 1;
  // Quantas colunas de seção o card de baixo mostra (encaixa a página sem scroll
  // em telas grandes; vira 1 coluna no mobile).
  const sectionCols = width >= 1300 ? 3 : width >= 860 ? 2 : 1;
  // A última seção ocupa o resto da linha, para não sobrar buraco no grid.
  const SECTION_COUNT = 5;
  const remainder = SECTION_COUNT % sectionCols;
  const lastSpan = remainder === 0 ? 1 : sectionCols - remainder + 1;

  const [address, setAddress] = useState(doctor?.professionalAddress ?? "");
  const [phone, setPhone] = useState(doctor?.phoneNumber ?? "");
  const [price, setPrice] = useState(centsToInput(doctor?.consultationPriceCents));
  const [savingIssuer, setSavingIssuer] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  if (!doctor) return null;
  const issuerOk = isIssuerComplete(doctor);

  // Rótulo/registro do conselho vindos da API (genérico por profissão), com
  // fallback ao CRM legado.
  const councilLabel = doctor.council ?? "Registro profissional";
  const councilValue = doctor.councilNumber
    ? `${doctor.councilNumber}${doctor.councilUf ? ` / ${doctor.councilUf}` : ""}`
    : doctor.crm;

  async function saveIssuer() {
    if (!address.trim() || !phone.trim()) {
      toast("Preencha endereço profissional e telefone.", "err");
      return;
    }
    setSavingIssuer(true);
    try {
      const updated = await doctorsApi.updateIssuerInfo(address.trim(), phone.trim());
      setDoctor(withSpecialties(updated, doctor));
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
      setDoctor(withSpecialties(updated, doctor));
      setPrice(centsToInput(updated.consultationPriceCents));
      toast("Preço da teleconsulta atualizado.");
    } catch (e) {
      toast(errMessage(e, "Não foi possível atualizar o preço."), "err");
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <div style={{ animation: "up .25s ease-out", display: "grid", gap: 16 }}>
      <PageTitle title="Perfil" subtitle="Seus dados profissionais e de emitente." />

      {/* Card de destaque: baixo, em 3 seções lado a lado, avatar no canto. */}
      <Card
        padding={0}
        style={{
          position: "relative",
          borderColor: color.primarySoftBorder,
          background: `linear-gradient(120deg, ${color.surface} 45%, ${color.primarySoft})`,
          overflow: "hidden",
        }}
      >
        <Avatar
          name={doctor.fullName}
          size={56}
          style={{ position: "absolute", top: 16, right: 16 }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: topCols === 3 ? "1fr 1fr 1fr" : "1fr",
            alignItems: "start",
          }}
        >
          {/* Seção 1 — Identidade (cadastro; somente leitura) */}
          <div style={{ padding: 18, paddingRight: topCols === 3 ? 18 : 84 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".7px",
                textTransform: "uppercase",
                color: color.primary,
              }}
            >
              Profissional
            </div>
            <h2
              style={{
                margin: "5px 0 0",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-.4px",
                color: color.text,
                lineHeight: 1.22,
              }}
            >
              {doctor.fullName}
            </h2>
            <div style={{ marginTop: 10 }}>
              <Chip label={`${councilLabel} ${councilValue}`} bg={color.primarySoft} fg={color.primary} />
            </div>
            {doctor.rqe && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: color.textMuted }}>RQE {doctor.rqe}</div>
            )}
          </div>

          {/* Seção 2 — Especialidades (editar/salvar por ícones) */}
          <div style={topSectionStyle(topCols)}>
            <EspecialidadesCard embedded />
          </div>

          {/* Seção 3 — Preço da teleconsulta (salvar = check) */}
          <div style={{ ...topSectionStyle(topCols), paddingRight: 84 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: color.text }}>Preço da teleconsulta</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 14, color: color.textMuted, flex: "none" }}>R$</span>
              <TextInput
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="180,00"
                aria-label="Valor da teleconsulta em reais"
                style={{ flex: 1, minWidth: 0 }}
              />
              <IconButton
                label="Salvar preço"
                tone="primary"
                onClick={savePrice}
                disabled={savingPrice}
              >
                <Icon name="check" size={18} />
              </IconButton>
            </div>
            <div style={{ marginTop: 6, fontSize: 11.5, color: color.textFaint }}>Ex.: 180 ou 180,00</div>
          </div>
        </div>
      </Card>

      {/* Demais funções: um único card dividido em seções (divisórias finas de 1px). */}
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${sectionCols}, minmax(0, 1fr))`,
            gap: 1,
            background: color.border,
          }}
        >
          {/* Dados de emitente */}
          <div style={{ background: color.surface, padding: 18 }}>
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
            <div style={{ display: "grid", gap: 14 }}>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <PrimaryButton onClick={saveIssuer} disabled={savingIssuer}>
                {savingIssuer ? "Salvando…" : "Salvar dados"}
              </PrimaryButton>
              <GhostButton onClick={fillIssuerExample}>Preencher exemplo</GhostButton>
            </div>
          </div>

          {/* Certificado digital */}
          <div style={{ background: color.surface, padding: 18 }}>
            <CertificadoCard embedded />
          </div>

          {/* Avaliações dos pacientes */}
          <div style={{ background: color.surface, padding: 18 }}>
            <AvaliacoesCard embedded doctorId={doctor.id} />
          </div>

          {/* Segurança (2FA) */}
          <div style={{ background: color.surface, padding: 18 }}>
            <TwoFactorSection embedded />
          </div>

          {/* Dispositivos confiáveis (ocupa o resto da última linha) */}
          <div style={{ background: color.surface, padding: 18, gridColumn: `span ${lastSpan}` }}>
            <DispositivosCard embedded />
          </div>
        </div>
      </Card>

      {/* Ações (rodapé, largura total) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          paddingTop: 16,
          borderTop: `1px solid ${color.border}`,
        }}
      >
        <GhostButton onClick={() => navigate("/verificar")}>Verificação pública</GhostButton>
        <button
          onClick={() => void logout()}
          style={{
            height: 46,
            padding: "0 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${color.border}`,
            borderRadius: radius.pill,
            background: color.surface,
            color: color.danger,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Icon name="logout" size={18} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ hero / avatar

/** Avatar circular com gradiente coral + iniciais (mesmo estilo do AppShell). */
function Avatar({
  name,
  size = 68,
  style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: 999,
        background: color.primaryGradient,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
        letterSpacing: ".5px",
        boxShadow: shadow.card,
        ...style,
      }}
    >
      {initials(name)}
    </span>
  );
}

/** Botão-ícone com área de toque de 34px, hover suave e tom coral opcional. */
function IconButton({
  label,
  onClick,
  children,
  disabled = false,
  tone = "muted",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  tone?: "muted" | "primary";
}) {
  const [hover, setHover] = useState(false);
  const lit = !disabled && (hover || tone === "primary");
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 34,
        height: 34,
        flex: "none",
        display: "grid",
        placeItems: "center",
        border: `1px solid ${hover && !disabled ? color.primarySoftBorder : "transparent"}`,
        borderRadius: 999,
        background: hover && !disabled ? color.primarySoft : "transparent",
        color: disabled ? color.textFaint : lit ? color.primary : color.textMuted,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .15s, color .15s, border-color .15s",
      }}
    >
      {children}
    </button>
  );
}

/** Seção do card de topo — divisória sutil (à esquerda em linha; no topo quando empilha). */
function topSectionStyle(cols: number): React.CSSProperties {
  return {
    padding: 18,
    borderLeft: cols === 3 ? `1px solid ${color.primarySoftBorder}` : "none",
    borderTop: cols === 3 ? "none" : `1px solid ${color.primarySoftBorder}`,
  };
}

// ---------------------------------------------------------------- especialidades

const MAX_SPECIALTIES = 5;

function EspecialidadesCard({ embedded = false }: { embedded?: boolean } = {}) {
  const { doctor, setDoctor } = useAuth();
  const { toast } = useToast();

  const current = doctor?.specialties ?? [];
  const [editing, setEditing] = useState(false);
  const [options, setOptions] = useState<doctorsApi.Specialty[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const profession = doctor?.profession ?? "MEDICINE";

  async function loadOptions() {
    setLoading(true);
    setLoadError("");
    try {
      setOptions(await doctorsApi.listSpecialties(profession));
    } catch (e) {
      setLoadError(errMessage(e, "Não foi possível carregar as especialidades."));
    } finally {
      setLoading(false);
    }
  }

  function openEdit() {
    setSelected(new Set(current.map((s) => s.id)));
    setQuery("");
    setEditing(true);
    void loadOptions();
  }

  function cancel() {
    setEditing(false);
    setLoadError("");
    setQuery("");
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SPECIALTIES) next.add(id);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await doctorsApi.updateSpecialties([...selected]);
      setDoctor(updated); // reflete no contexto (chips atualizam)
      toast("Especialidades atualizadas.");
      setEditing(false);
    } catch (e) {
      toast(errMessage(e, "Não foi possível salvar as especialidades."), "err");
    } finally {
      setSaving(false);
    }
  }

  const full = selected.size >= MAX_SPECIALTIES;

  const inner = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          minHeight: 34,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 600, color: color.text }}>Especialidades</span>
        {editing ? (
          <div style={{ display: "flex", gap: 2 }}>
            <IconButton
              label="Salvar especialidades"
              tone="primary"
              onClick={() => void save()}
              disabled={saving || loading}
            >
              <Icon name="check" size={18} />
            </IconButton>
            <IconButton label="Cancelar" onClick={cancel} disabled={saving}>
              <Icon name="close" size={17} />
            </IconButton>
          </div>
        ) : (
          <IconButton label="Editar especialidades" onClick={openEdit}>
            <Icon name="pencil" size={17} />
          </IconButton>
        )}
      </div>

      {!editing ? (
        current.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {current.map((s) => (
              <Chip key={s.id} label={s.name} bg={color.primarySoft} fg={color.primary} />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
            Nenhuma especialidade selecionada. Toque no lápis para escolher (até {MAX_SPECIALTIES}).
          </p>
        )
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12.5, color: color.textMuted }}>
              Selecione até {MAX_SPECIALTIES}.
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: full ? color.warn : color.textMuted,
              }}
            >
              {selected.size}/{MAX_SPECIALTIES}
            </span>
          </div>

          {full && (
            <div style={{ fontSize: 12, color: color.warn }}>Máximo de {MAX_SPECIALTIES} especialidades.</div>
          )}

          {loading && (
            <p style={{ margin: 0, fontSize: 13, color: color.textMuted }}>Carregando especialidades…</p>
          )}

          {loadError && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: color.dangerSoft,
                borderRadius: radius.controlSm,
                fontSize: 13,
                color: color.danger,
              }}
            >
              <span style={{ flex: 1, minWidth: 160 }}>{loadError}</span>
              <GhostButton onClick={() => void loadOptions()}>Tentar de novo</GhostButton>
            </div>
          )}

          {options && !loading && !loadError && <SpecialtyPicker
            options={options}
            selected={selected}
            full={full}
            query={query}
            onQuery={setQuery}
            onToggle={toggle}
            maxListHeight={embedded ? 240 : 440}
          />}
        </div>
      )}
    </>
  );

  return embedded ? inner : <Card>{inner}</Card>;
}

/** Lista vertical de especialidades, com busca e rolagem (~10 itens visíveis). */
function SpecialtyPicker({
  options,
  selected,
  full,
  query,
  onQuery,
  onToggle,
  maxListHeight = 440,
}: {
  options: doctorsApi.Specialty[];
  selected: Set<string>;
  full: boolean;
  query: string;
  onQuery: (v: string) => void;
  onToggle: (id: string) => void;
  maxListHeight?: number;
}) {
  if (options.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: color.textMuted }}>
        Nenhuma especialidade disponível para a sua profissão.
      </p>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <TextInput
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Buscar especialidade…"
        aria-label="Buscar especialidade"
      />

      {filtered.length === 0 ? (
        <p style={{ margin: "2px 0", fontSize: 13, color: color.textMuted }}>
          Nenhuma especialidade encontrada.
        </p>
      ) : (
        <div
          style={{
            border: `1px solid ${color.border}`,
            borderRadius: radius.control,
            overflow: "hidden",
          }}
        >
          {/* ~10 linhas de 44px visíveis; o resto rola. */}
          <div role="listbox" aria-multiselectable style={{ maxHeight: maxListHeight, overflowY: "auto" }}>
            {filtered.map((opt, i) => {
              const on = selected.has(opt.id);
              return (
                <SpecialtyRow
                  key={opt.id}
                  name={opt.name}
                  on={on}
                  disabled={!on && full}
                  last={i === filtered.length - 1}
                  onClick={() => onToggle(opt.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SpecialtyRow({
  name,
  on,
  disabled,
  last,
  onClick,
}: {
  name: string;
  on: boolean;
  disabled: boolean;
  last: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const bg = on ? color.primarySoft : hover && !disabled ? color.muted : "transparent";
  return (
    <button
      type="button"
      role="option"
      aria-selected={on}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        height: 44,
        padding: "0 14px",
        border: "none",
        borderBottom: last ? "none" : `1px solid ${color.border}`,
        background: bg,
        color: on ? color.primary : disabled ? color.textFaint : color.text,
        fontSize: 14,
        fontWeight: on ? 600 : 500,
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "background .12s",
      }}
    >
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </span>
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          flex: "none",
          borderRadius: 999,
          border: `1px solid ${on ? color.primary : color.border}`,
          background: on ? color.primary : "transparent",
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        {on && <Icon name="check" size={13} />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------- certificado

function fmtCertDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

/**
 * Vínculo do certificado digital (ICP-Brasil / VIDaaS) — habilita assinar
 * receitas e documentos (canPrescribe). Em produção redireciona para o VIDaaS;
 * em dev o provedor é mock e o vínculo se completa no servidor.
 */
function CertificadoCard({ embedded = false }: { embedded?: boolean } = {}) {
  const { refreshCredentialing } = useAuth();
  const { toast } = useToast();

  const [cert, setCert] = useState<doctorsApi.CertificateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      setCert(await doctorsApi.getCertificate());
    } catch (e) {
      setLoadError(errMessage(e, "Não foi possível carregar o certificado."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function vincular() {
    setBusy(true);
    try {
      const auth = await doctorsApi.startCertificateAuthorization();
      if (auth.authorizationUrl) {
        // Produção (VIDaaS): aprova no app do certificado e volta em /certificado/callback.
        window.location.href = auth.authorizationUrl;
        return;
      }
      // Desenvolvimento (mock): o vínculo já se completou no servidor.
      const updated = await doctorsApi.getCertificate();
      setCert(updated);
      toast("Certificado vinculado.");
      void refreshCredentialing().catch(() => {});
    } catch (e) {
      toast(errMessage(e, "Não foi possível iniciar a vinculação."), "err");
    } finally {
      setBusy(false);
    }
  }

  const status = cert?.status ?? null;
  const linked = status === "LINKED";

  const inner = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Certificado digital</h2>
        {linked && <Chip label="Certificado vinculado" bg={color.tealSoft} fg={color.teal} />}
        {(status === "FAILED" || status === "REVOKED") && (
          <Chip
            label={status === "REVOKED" ? "Revogado" : "Falhou"}
            bg={color.dangerSoft}
            fg={color.danger}
          />
        )}
        {status === "PENDING" && <Chip label="Em andamento" bg={color.warnSoft} fg={color.warn} />}
      </div>

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: color.textMuted }}>Carregando certificado…</p>
      ) : loadError ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: color.dangerSoft,
            borderRadius: radius.controlSm,
            fontSize: 13,
            color: color.danger,
          }}
        >
          <span style={{ flex: 1, minWidth: 160 }}>{loadError}</span>
          <GhostButton onClick={() => void load()}>Tentar de novo</GhostButton>
        </div>
      ) : linked ? (
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13.5, color: color.text, lineHeight: 1.6 }}>
            Seu certificado está vinculado — você já pode assinar receitas e documentos.
          </p>
          <div
            style={{
              display: "grid",
              gap: 10,
              padding: "14px 16px",
              background: color.muted,
              border: `1px solid ${color.border}`,
              borderRadius: radius.control,
            }}
          >
            {[
              ["Titular", cert?.subject ?? "—"],
              ["Provedor", cert?.provider ?? "—"],
              ["Válido até", fmtCertDate(cert?.notAfter ?? null) || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 12, color: color.textMuted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", minWidth: 0 }}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <GhostButton onClick={() => void vincular()} disabled={busy}>
              {busy ? "Abrindo…" : "Vincular outro certificado"}
            </GhostButton>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14, color: color.textMuted, lineHeight: 1.7 }}>
            {status === "PENDING"
              ? "Vínculo em andamento. Se você não concluiu a autorização, tente novamente."
              : status === "FAILED"
                ? "A vinculação do certificado falhou. Tente vincular novamente."
                : status === "REVOKED"
                  ? "Seu certificado foi revogado. Vincule um certificado válido para voltar a assinar."
                  : "Nenhum certificado vinculado. Vincule seu certificado ICP-Brasil para assinar receitas e documentos."}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: color.textFaint, lineHeight: 1.6 }}>
            Em produção a aprovação é feita no app do seu certificado (VIDaaS); em desenvolvimento o
            vínculo é simulado.
          </p>
          <div>
            <PrimaryButton onClick={() => void vincular()} disabled={busy}>
              {busy
                ? "Iniciando…"
                : status === "PENDING"
                  ? "Tentar de novo"
                  : status === "FAILED" || status === "REVOKED"
                    ? "Vincular novamente"
                    : "Vincular certificado"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </>
  );

  return embedded ? inner : <Card>{inner}</Card>;
}

// ---------------------------------------------------------------- avaliações

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span aria-hidden style={{ display: "inline-flex", gap: 1, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const on = i <= full;
        return (
          <span key={i} style={{ display: "inline-flex", color: on ? color.warnAlt : color.border }}>
            <Icon name="star" size={size + 3} variant={on ? "solid" : "outline"} />
          </span>
        );
      })}
    </span>
  );
}

/** Avaliações públicas recebidas pelo profissional — somente leitura. */
function AvaliacoesCard({
  doctorId,
  embedded = false,
}: {
  doctorId: string;
  embedded?: boolean;
}) {
  const [reviews, setReviews] = useState<reviewsApi.PublicReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      setReviews(await reviewsApi.listProfessionalReviews(doctorId));
    } catch (e) {
      setLoadError(errMessage(e, "Não foi possível carregar as avaliações."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const count = reviews?.length ?? 0;
  const average =
    count > 0 ? reviews!.reduce((s, r) => s + r.rating, 0) / count : 0;

  const inner = (
    <>
      <SectionTitle>Avaliações dos pacientes</SectionTitle>

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: color.textMuted }}>Carregando avaliações…</p>
      ) : loadError ? (
        <ErrorRetry message={loadError} onRetry={() => void load()} />
      ) : count === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
          Você ainda não recebeu avaliações.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              background: color.muted,
              border: `1px solid ${color.border}`,
              borderRadius: radius.control,
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-1px", color: color.text }}>
              {average.toFixed(1).replace(".", ",")}
            </span>
            <div style={{ display: "grid", gap: 3 }}>
              <Stars value={average} size={16} />
              <span style={{ fontSize: 12.5, color: color.textMuted }}>
                {count} {count === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          </div>

          <div style={{ maxHeight: embedded ? 172 : 300, overflowY: "auto", display: "grid", gap: 0 }}>
            {reviews!.map((r, i) => (
              <div
                key={r.id}
                style={{
                  padding: "12px 2px",
                  borderTop: i === 0 ? "none" : `1px solid ${color.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Stars value={r.rating} />
                  <span style={{ fontSize: 12, color: color.textFaint }}>{dateBR(r.createdAt)}</span>
                </div>
                {r.comment && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: color.text, lineHeight: 1.6 }}>
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return embedded ? inner : <Card>{inner}</Card>;
}

// -------------------------------------------------------- dispositivos confiáveis

/** Lista e revoga os dispositivos que pulam o 2FA até expirarem. */
function DispositivosCard({ embedded = false }: { embedded?: boolean } = {}) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<trustedDevicesApi.TrustedDevice[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      setDevices(await trustedDevicesApi.listTrustedDevices());
    } catch (e) {
      setLoadError(errMessage(e, "Não foi possível carregar os dispositivos."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function revoke(id: string) {
    if (!window.confirm("Revogar este dispositivo? No próximo acesso por ele será pedido o 2FA.")) {
      return;
    }
    setRevoking(id);
    try {
      await trustedDevicesApi.revokeTrustedDevice(id);
      setDevices((prev) => (prev ?? []).filter((d) => d.id !== id));
      toast("Dispositivo revogado.");
    } catch (e) {
      toast(errMessage(e, "Não foi possível revogar o dispositivo."), "err");
    } finally {
      setRevoking(null);
    }
  }

  const inner = (
    <>
      <SectionTitle>Dispositivos confiáveis</SectionTitle>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: color.textMuted, lineHeight: 1.7 }}>
        Dispositivos confiáveis pulam a verificação em duas etapas até expirarem. Ao revogar um
        deles, o 2FA será exigido de novo no próximo acesso por aquele aparelho.
      </p>

      {loading ? (
        <p style={{ margin: 0, fontSize: 13, color: color.textMuted }}>Carregando dispositivos…</p>
      ) : loadError ? (
        <ErrorRetry message={loadError} onRetry={() => void load()} />
      ) : (devices?.length ?? 0) === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: color.textMuted, lineHeight: 1.6 }}>
          Nenhum dispositivo confiável salvo.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
            maxHeight: embedded ? 180 : undefined,
            overflowY: embedded ? "auto" : undefined,
          }}
        >
          {devices!.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                background: color.muted,
                border: `1px solid ${color.border}`,
                borderRadius: radius.control,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{d.label ?? "Dispositivo"}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: color.textMuted, lineHeight: 1.6 }}>
                  Criado em {dateBR(d.createdAt)} · Último uso {d.lastUsedAt ? dateBR(d.lastUsedAt) : "—"} ·
                  Expira em {dateBR(d.expiresAt)}
                </div>
              </div>
              <GhostButton
                onClick={() => void revoke(d.id)}
                disabled={revoking === d.id}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Icon name="trash" size={16} />
                {revoking === d.id ? "Revogando…" : "Revogar"}
              </GhostButton>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return embedded ? inner : <Card>{inner}</Card>;
}

// ------------------------------------------------------------------ util

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: color.dangerSoft,
        borderRadius: radius.controlSm,
        fontSize: 13,
        color: color.danger,
      }}
    >
      <span style={{ flex: 1, minWidth: 160 }}>{message}</span>
      <GhostButton onClick={onRetry}>Tentar de novo</GhostButton>
    </div>
  );
}
