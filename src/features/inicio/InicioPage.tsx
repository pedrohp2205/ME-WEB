import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAsync } from "@/lib/useAsync";
import { useWindowWidth } from "@/lib/useWindowWidth";
import * as appointmentsApi from "@/lib/api/appointments";
import type { Appointment } from "@/lib/api/appointments";
import * as docsApi from "@/lib/api/medicalDocuments";
import * as accessApi from "@/lib/api/access";
import * as reviewsApi from "@/lib/api/reviews";
import { isIssuerComplete } from "@/lib/api/doctors";
import { isTelemedicine, statusChip, statusLabel, typeBar, typeLabel } from "@/lib/domain/appointment";
import { patientDisplayName } from "@/lib/format/patient";
import { firstName } from "@/lib/format/name";
import { isoDate, isoDateLocal, longDayLabel, timeLocal, today0 } from "@/lib/format/datetime";
import { Card, Chip, PageTitle } from "@/app/ui";
import { Icon, type IconName } from "@/app/icons";
import { EntrarNaSalaButton } from "@/features/teleconsulta/EntrarNaSalaButton";
import { color, radius } from "@/theme/tokens";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Consultas SCHEDULED de HOJE (data local), ordenadas por horário. */
function todaysScheduled(appts: Appointment[]): Appointment[] {
  const todayStr = isoDate(today0());
  return appts
    .filter((a) => a.status === "SCHEDULED" && isoDateLocal(a.startDatetime) === todayStr)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
}

/** Próxima consulta SCHEDULED com início >= agora (hoje ou futura). */
function nextScheduled(appts: Appointment[]): Appointment | null {
  const now = Date.now();
  const upcoming = appts
    .filter((a) => a.status === "SCHEDULED" && new Date(a.startDatetime).getTime() >= now)
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  return upcoming[0] ?? null;
}

export function InicioPage() {
  const { doctor, credentialing } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const doctorId = doctor!.id;

  // Buscas independentes: cada seção trata seu próprio loading/erro.
  const appts = useAsync(() => appointmentsApi.listByDoctor(doctorId), [doctorId]);
  const docs = useAsync(() => docsApi.listMine(doctorId), [doctorId]);
  const access = useAsync(() => accessApi.listMyAccessRequests(), []);
  const reviews = useAsync(() => reviewsApi.listProfessionalReviews(doctorId), [doctorId]);

  const now = new Date();
  const dataExtenso = `${longDayLabel(now)} de ${now.getFullYear()}`;

  // Duas colunas em telas largas: principal (esquerda, mais larga) + KPIs
  // estreitos (direita). No mobile empilha tudo em 1 coluna.
  const twoCol = width >= 960;

  return (
    <div style={{ animation: "up .25s ease-out", display: "grid", gap: 16 }}>
      {/* Cabeçalho (saudação + data) acima das colunas */}
      <PageTitle
        title={`${greeting(now.getHours())}, ${firstName(doctor!.fullName)}`}
        subtitle={capitalize(dataExtenso)}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: twoCol ? "minmax(300px, 1fr) minmax(0, 2fr)" : "1fr",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* COLUNA ESQUERDA — Próxima consulta (topo) + KPIs (abaixo). Primeiro no DOM
            para, no mobile, empilhar Próxima → KPIs → (card da direita). */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
            ...(twoCol ? { gridColumn: 1, gridRow: 1 } : null),
          }}
        >
          {/* Próxima consulta — compacta (altura = conteúdo) */}
          <Card padding={18}>
            <ProximaConsultaSection state={appts} onOpen={(id) => navigate(`/consultas/${id}`)} />
          </Card>

          {/* KPIs — 4 métricas empilhadas, separadas por divisórias */}
          <Card
            padding={0}
            style={{
              overflow: "hidden",
              borderColor: color.primarySoftBorder,
              background: `linear-gradient(160deg, ${color.surface} 55%, ${color.primarySoft})`,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }}>
              <KpiSection
                label="Consultas hoje"
                icon="cal"
                cellStyle={kpiVCell(0)}
                onClick={() => navigate("/agenda")}
                state={appts}
                render={(list) => <BigNumber value={todaysScheduled(list).length} />}
              />
              <KpiSection
                label="Aguardando assinatura"
                icon="pencil"
                cellStyle={kpiVCell(1)}
                onClick={() => navigate("/documentos")}
                state={docs}
                render={(list) => (
                  <BigNumber value={list.filter((d) => d.status === "AWAITING_SIGNATURE").length} />
                )}
              />
              <KpiSection
                label="Acessos aguardando resposta"
                icon="key"
                cellStyle={kpiVCell(2)}
                onClick={() => navigate("/acessos")}
                state={access}
                render={(list) => <BigNumber value={list.filter((a) => a.status === "PENDING").length} />}
              />
              <KpiSection
                label="Avaliação média"
                icon="star"
                cellStyle={kpiVCell(3)}
                onClick={() => navigate("/perfil")}
                state={reviews}
                render={(list) => {
                  if (list.length === 0) return <BigNumber value="—" />;
                  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
                  return (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <BigNumber value={avg.toFixed(1).replace(".", ",")} />
                      <span style={{ color: color.warnAlt, display: "inline-flex" }}>
                        <Icon name="star" size={20} variant="solid" />
                      </span>
                    </span>
                  );
                }}
              />
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA — card único com Agenda + Pendências. No desktop, a altura
            é ditada pela coluna esquerda: o conteúdo do card fica em fluxo absoluto
            (não infla a linha), o card estica para casar a esquerda e cada seção rola
            internamente. */}
        <Card
          padding={0}
          style={{
            overflow: "hidden",
            ...(twoCol ? { position: "relative", gridColumn: 2, gridRow: 1 } : null),
          }}
        >
          <div
            style={
              twoCol
                ? { position: "absolute", inset: 0, display: "flex", flexDirection: "column" }
                : undefined
            }
          >
            <div
              style={{
                padding: 18,
                minWidth: 0,
                borderBottom: `1px solid ${color.border}`,
                ...(twoCol ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : null),
              }}
            >
              <AgendaHojeSection
                fill={twoCol}
                state={appts}
                onOpen={(id) => navigate(`/consultas/${id}`)}
                onVerAgenda={() => navigate("/agenda")}
              />
            </div>
            <div
              style={{
                padding: 18,
                minWidth: 0,
                ...(twoCol ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : null),
              }}
            >
              <PendenciasSection
                fill={twoCol}
                docs={docs}
                access={access}
                canPrescribe={credentialing?.canPrescribe ?? null}
                issuerComplete={isIssuerComplete(doctor!)}
                onGo={navigate}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- KPIs (seções)

interface AsyncLike<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Divisória entre KPIs empilhados (borda no topo, exceto o primeiro). */
function kpiVCell(i: number): React.CSSProperties {
  return {
    padding: 16,
    borderTop: i > 0 ? `1px solid ${color.primarySoftBorder}` : "none",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: "none",
  };
}

function BigNumber({ value }: { value: number | string }) {
  return (
    <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-1px", color: color.text }}>
      {value}
    </span>
  );
}

function KpiSection<T>({
  label,
  icon,
  onClick,
  state,
  render,
  cellStyle,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  state: AsyncLike<T>;
  render: (data: T) => ReactNode;
  cellStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...cellStyle,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        minWidth: 0,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flex: "none",
          borderRadius: 999,
          background: color.primarySoft,
          color: color.primary,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: color.textMuted, fontWeight: 500, lineHeight: 1.3 }}>
        {label}
      </span>
      <span style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {state.loading ? (
          <Skeleton width={40} height={24} />
        ) : state.error ? (
          <RetryInline onRetry={state.reload} />
        ) : (
          render(state.data as T)
        )}
      </span>
    </button>
  );
}

function Skeleton({ width, height }: { width: number | string; height: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width,
        height,
        borderRadius: 8,
        background: color.muted,
        animation: "pulse 1.2s ease-in-out infinite",
      }}
    />
  );
}

/** Erro compacto dentro de um tile/linha: não navega; só recarrega o bloco. */
function RetryInline({ onRetry }: { onRetry: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onRetry();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onRetry();
        }
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12.5,
        fontWeight: 600,
        color: color.danger,
        cursor: "pointer",
      }}
    >
      <Icon name="close" size={15} /> Erro · tentar
    </span>
  );
}

// --------------------------------------------------------------- Próxima consulta

/** Cabeçalho de seção — mesmo estilo do Perfil (h2 16/600). */
function SectionHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 14,
        minHeight: 26,
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </h2>
      {right && <span style={{ flex: "none" }}>{right}</span>}
    </div>
  );
}

function ProximaConsultaSection({
  state,
  onOpen,
}: {
  state: AsyncLike<Appointment[]>;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <SectionHead title="Próxima consulta" />
      {state.loading ? (
        <Skeleton width="100%" height={92} />
      ) : state.error ? (
        <BlockError message={state.error} onRetry={state.reload} />
      ) : (
        <ProximaConsultaBody a={nextScheduled(state.data ?? [])} onOpen={onOpen} />
      )}
    </>
  );
}

function ProximaConsultaBody({ a, onOpen }: { a: Appointment | null; onOpen: (id: string) => void }) {
  if (!a) return <EmptyLine icon="cal" text="Sem próximas consultas." />;

  const startMs = new Date(a.startDatetime).getTime();
  const endMs = new Date(a.endDatetime).getTime();
  const nowMs = Date.now();
  const near = nowMs >= startMs - 30 * 60 * 1000 && nowMs <= endMs;
  const isToday = isoDateLocal(a.startDatetime) === isoDate(today0());
  const quando = `${isToday ? "Hoje" : dateShort(a.startDatetime)} às ${timeLocal(a.startDatetime)}`;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.3px" }}>{quando}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <TypePill a={a} />
        <span style={{ fontSize: 13.5, color: color.text }}>
          {patientDisplayName(a.patientId, a.patientName)}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 2 }}>
        {isTelemedicine(a) && near && <EntrarNaSalaButton appointmentId={a.id} />}
        <button
          onClick={() => onOpen(a.id)}
          style={{
            height: 36,
            padding: "0 16px",
            border: `1px solid ${color.border}`,
            borderRadius: 999,
            background: color.surface,
            color: color.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ver consulta
        </button>
      </div>
    </div>
  );
}

function dateShort(iso: string): string {
  const d = new Date(iso);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}`;
}

function TypePill({ a }: { a: Appointment }) {
  const tele = isTelemedicine(a);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        padding: "0 10px",
        borderRadius: 999,
        background: tele ? color.tealSoft : color.primarySoft,
        color: tele ? color.teal : color.primary,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <Icon name={tele ? "device" : "user"} size={14} />
      {typeLabel(a.appointmentType)}
    </span>
  );
}

// --------------------------------------------------------------- Agenda de hoje

function AgendaHojeSection({
  state,
  onOpen,
  onVerAgenda,
  fill = false,
}: {
  state: AsyncLike<Appointment[]>;
  onOpen: (id: string) => void;
  onVerAgenda: () => void;
  fill?: boolean;
}) {
  const list = state.data ? todaysScheduled(state.data) : [];
  return (
    <div style={sectionShell(fill)}>
      <SectionHead
        title="Agenda de hoje"
        right={
          <button
            onClick={onVerAgenda}
            style={{
              border: "none",
              background: "none",
              color: color.primary,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ver agenda completa
          </button>
        }
      />
      {state.loading ? (
        <div style={{ display: "grid", gap: 8 }}>
          <Skeleton width="100%" height={56} />
          <Skeleton width="100%" height={56} />
        </div>
      ) : state.error ? (
        <BlockError message={state.error} onRetry={state.reload} />
      ) : list.length === 0 ? (
        <EmptyLine icon="cal" text="Nenhuma consulta para hoje." />
      ) : (
        <div style={scrollAreaStyle(fill)}>
          {list.map((a) => (
            <AgendaRow key={a.id} a={a} onClick={() => onOpen(a.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Raiz da seção: coluna flex que preenche a célula quando `fill` (desktop). */
function sectionShell(fill: boolean): React.CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    ...(fill ? { height: "100%", minHeight: 0 } : null),
  };
}

/** Área rolável da seção: cresce e rola dentro do card (desktop) ou usa um teto
 *  fixo no mobile, com scrollbar fina padronizada. */
function scrollAreaStyle(fill: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gap: 8,
    overflowY: "auto",
    paddingRight: 4,
    ...(fill ? { flex: 1, minHeight: 0 } : { maxHeight: 260 }),
  };
}

function AgendaRow({ a, onClick }: { a: Appointment; onClick: () => void }) {
  const [bg, fg] = statusChip(a);
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "12px 14px",
        border: `1px solid ${color.border}`,
        borderLeft: `3px solid ${typeBar(a.appointmentType)}`,
        borderRadius: 14,
        background: color.muted,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, flex: "none", width: 46 }}>
        {timeLocal(a.startDatetime)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 13.5,
            color: color.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {patientDisplayName(a.patientId, a.patientName)}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: color.textMuted, marginTop: 2 }}>
          <Icon name={isTelemedicine(a) ? "device" : "user"} size={13} />
          {typeLabel(a.appointmentType)}
        </span>
      </span>
      <Chip label={statusLabel(a)} bg={bg} fg={fg} />
    </button>
  );
}

// --------------------------------------------------------------- Pendências

interface PendItem {
  icon: IconName;
  text: string;
  onClick: () => void;
}

function PendenciasSection({
  docs,
  access,
  canPrescribe,
  issuerComplete,
  onGo,
  fill = false,
}: {
  docs: AsyncLike<docsApi.MedicalDocument[]>;
  access: AsyncLike<accessApi.AccessGrant[]>;
  canPrescribe: boolean | null;
  issuerComplete: boolean;
  onGo: (path: string) => void;
  fill?: boolean;
}) {
  const items: PendItem[] = [];

  if (canPrescribe === false) {
    items.push({
      icon: "certificate",
      text: "Vincule seu certificado digital para assinar receitas e documentos.",
      onClick: () => onGo("/perfil"),
    });
  }
  if (!issuerComplete) {
    items.push({
      icon: "shield",
      text: "Complete os dados de emitente para emitir receita de controle especial.",
      onClick: () => onGo("/perfil"),
    });
  }

  const docsReady = !docs.loading && !docs.error;
  const accessReady = !access.loading && !access.error;

  if (docsReady) {
    const n = (docs.data ?? []).filter((d) => d.status === "AWAITING_SIGNATURE").length;
    if (n > 0) {
      items.push({
        icon: "pencil",
        text: `${n} ${n === 1 ? "documento aguardando assinatura" : "documentos aguardando assinatura"}.`,
        onClick: () => onGo("/documentos"),
      });
    }
  }
  if (accessReady) {
    const n = (access.data ?? []).filter((a) => a.status === "PENDING").length;
    if (n > 0) {
      items.push({
        icon: "key",
        text: `${n} ${n === 1 ? "pedido de acesso aguardando resposta" : "pedidos de acesso aguardando resposta"} do paciente.`,
        onClick: () => onGo("/acessos"),
      });
    }
  }

  const stillChecking = docs.loading || access.loading;
  const allChecked = docsReady && accessReady;
  const nothingPending = items.length === 0;

  return (
    <div style={sectionShell(fill)}>
      <SectionHead title="Pendências" />
      <div style={scrollAreaStyle(fill)}>
        {items.map((it, i) => (
          <button
            key={i}
            onClick={it.onClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "12px 14px",
              border: `1px solid ${color.warnSoftBorder}`,
              borderRadius: 14,
              background: color.warnSoft,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                flex: "none",
                borderRadius: 999,
                background: color.surface,
                color: color.warn,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name={it.icon} size={16} />
            </span>
            <span style={{ flex: 1, fontSize: 13, color: color.text, lineHeight: 1.45 }}>{it.text}</span>
            <Icon name="chevronDown" size={16} />
          </button>
        ))}

        {/* Não afirmar "tudo em dia" se algum bloco falhou/está carregando. */}
        {docs.error && <CheckError label="documentos" onRetry={docs.reload} />}
        {access.error && <CheckError label="pedidos de acesso" onRetry={access.reload} />}

        {nothingPending && !docs.error && !access.error && (
          allChecked ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 14px",
                border: `1px solid ${color.tealSoftBorder}`,
                borderRadius: 14,
                background: color.tealSoft,
                color: color.teal,
              }}
            >
              <Icon name="check" size={18} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Tudo em dia</span>
            </div>
          ) : stillChecking ? (
            <div style={{ fontSize: 13, color: color.textMuted, padding: "6px 2px" }}>
              Verificando pendências…
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

function CheckError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        border: `1px solid ${color.border}`,
        borderRadius: 12,
        fontSize: 12.5,
        color: color.textMuted,
      }}
    >
      <span style={{ flex: 1, minWidth: 160 }}>Não foi possível verificar {label}.</span>
      <button
        onClick={onRetry}
        style={{
          border: "none",
          background: "none",
          color: color.primary,
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Tentar de novo
      </button>
    </div>
  );
}

// --------------------------------------------------------------- compartilhados

function EmptyLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 2px",
        color: color.textMuted,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flex: "none",
          borderRadius: 999,
          background: color.muted,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <span style={{ fontSize: 13.5 }}>{text}</span>
    </div>
  );
}

function BlockError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: radius.control,
        background: color.dangerSoft,
        color: color.danger,
        fontSize: 13,
      }}
    >
      <span style={{ flex: 1, minWidth: 180 }}>{message}</span>
      <button
        onClick={onRetry}
        style={{
          height: 34,
          padding: "0 14px",
          border: `1px solid ${color.danger}`,
          borderRadius: 999,
          background: "transparent",
          color: color.danger,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Tentar de novo
      </button>
    </div>
  );
}
