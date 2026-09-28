// Ícones do painel — agora via Heroicons v2 (outline, traço fino), mantendo a API
// pública <Icon name="..." size={n} />. currentColor herda a cor; width/height = size.
import type { ComponentType, SVGProps } from "react";

// Outline (padrão) — traço fino, combina com o visual atual.
import {
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  KeyIcon,
  UserIcon,
  BellIcon,
  Bars3Icon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  ComputerDesktopIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  DocumentCheckIcon,
  ArrowLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

// Sólido — usado sob demanda (ex.: estrela cheia nas avaliações).
import {
  HomeIcon as HomeSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListSolid,
  DocumentTextIcon as DocumentTextSolid,
  RectangleStackIcon as RectangleStackSolid,
  KeyIcon as KeySolid,
  UserIcon as UserSolid,
  BellIcon as BellSolid,
  Bars3Icon as Bars3Solid,
  PencilSquareIcon as PencilSquareSolid,
  CheckIcon as CheckSolid,
  XMarkIcon as XMarkSolid,
  StarIcon as StarSolid,
  ComputerDesktopIcon as ComputerDesktopSolid,
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  TrashIcon as TrashSolid,
  ArrowRightOnRectangleIcon as ArrowRightOnRectangleSolid,
  DocumentCheckIcon as DocumentCheckSolid,
  ArrowLeftIcon as ArrowLeftSolid,
  ChevronUpIcon as ChevronUpSolid,
  ChevronDownIcon as ChevronDownSolid,
  SunIcon as SunSolid,
  MoonIcon as MoonSolid,
} from "@heroicons/react/24/solid";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

// Mapa nome -> [outline, solid]. Todos os nomes conferidos na v2.2.0.
const ICONS: Record<string, [HeroIcon, HeroIcon]> = {
  // navegação / topbar (nomes legados — mantêm os call sites atuais)
  home: [HomeIcon, HomeSolid],
  cal: [CalendarDaysIcon, CalendarDaysSolid],
  clip: [ClipboardDocumentListIcon, ClipboardDocumentListSolid],
  doc: [DocumentTextIcon, DocumentTextSolid],
  layers: [RectangleStackIcon, RectangleStackSolid],
  key: [KeyIcon, KeySolid],
  user: [UserIcon, UserSolid],
  bell: [BellIcon, BellSolid],
  menu: [Bars3Icon, Bars3Solid],
  // novos (perfil e afins)
  pencil: [PencilSquareIcon, PencilSquareSolid],
  check: [CheckIcon, CheckSolid],
  close: [XMarkIcon, XMarkSolid],
  star: [StarIcon, StarSolid],
  device: [ComputerDesktopIcon, ComputerDesktopSolid],
  search: [MagnifyingGlassIcon, MagnifyingGlassSolid],
  shield: [ShieldCheckIcon, ShieldCheckSolid],
  trash: [TrashIcon, TrashSolid],
  logout: [ArrowRightOnRectangleIcon, ArrowRightOnRectangleSolid],
  certificate: [DocumentCheckIcon, DocumentCheckSolid],
  // utilitários de navegação/ordenação
  arrowLeft: [ArrowLeftIcon, ArrowLeftSolid],
  chevronUp: [ChevronUpIcon, ChevronUpSolid],
  chevronDown: [ChevronDownIcon, ChevronDownSolid],
  sun: [SunIcon, SunSolid],
  moon: [MoonIcon, MoonSolid],
};

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 19,
  variant = "outline",
}: {
  name: IconName;
  size?: number;
  variant?: "outline" | "solid";
}) {
  const [outline, solid] = ICONS[name];
  const Cmp = variant === "solid" ? solid : outline;
  // Heroicons outline usam strokeWidth 1.5; subimos um pouco (1.7) para ficar
  // próximo do traço anterior. currentColor é herdado do elemento pai.
  return (
    <Cmp
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...(variant === "outline" ? { strokeWidth: 1.7 } : {})}
    />
  );
}
