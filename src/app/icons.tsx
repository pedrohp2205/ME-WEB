// Ícones — paths idênticos aos do protótipo (renderVals.icon).
const PATHS: Record<string, string> = {
  home: "M3 10.5 12 3.5l9 7M5.5 9.5V20h13V9.5",
  cal: "M4 6.5h16V20H4zM8 3.5v4M16 3.5v4M4 11h16",
  clip: "M9 3.5h6v3H9zM6.5 6.5h11v14h-11z M9.5 11h5M9.5 15h5",
  doc: "M7 3.5h7l3.5 3.5V20.5H7zM14 3.5v4h3.5",
  layers: "M12 3.5 3.5 8 12 12.5 20.5 8zM3.5 13.5 12 18l8.5-4.5",
  key: "M14.5 9.5a3 3 0 1 0-6 0 3 3 0 0 0 6 0M11.5 12.5V21M11.5 18h3.5",
  user: "M12 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 21a7.5 7.5 0 0 1 15 0",
  bell: "M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10M10 19a2 2 0 0 0 4 0",
  menu: "M4 7h16M4 12h16M4 17h16",
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
