export type UnitCode =
  | "TRY"
  | "USD"
  | "EUR"
  | "GOLD_GRAM"
  | "GOLD_QUARTER"
  | "GOLD_HALF"
  | "GOLD_FULL";

export interface UnitDef {
  code: UnitCode;
  label: string;
  icon: string;
}

export const UNITS: UnitDef[] = [
  { code: "TRY",          label: "Türk Lirası",     icon: "₺" },
  { code: "USD",          label: "Amerikan Doları",  icon: "$" },
  { code: "EUR",          label: "Euro",             icon: "€" },
  { code: "GOLD_GRAM",    label: "Gram Altın",       icon: "🪙" },
  { code: "GOLD_QUARTER", label: "Çeyrek Altın",     icon: "🥇" },
  { code: "GOLD_HALF",    label: "Yarım Altın",      icon: "🥇" },
  { code: "GOLD_FULL",    label: "Tam Altın",        icon: "🥇" },
];

/** Returns the Turkish display label for a unit code. Falls back to the raw code if unknown. */
export function getUnitLabel(code: string): string {
  return UNITS.find((u) => u.code === code)?.label ?? code;
}

/** Returns the icon/symbol for a unit code. Falls back to empty string if unknown. */
export function getUnitIcon(code: string): string {
  return UNITS.find((u) => u.code === code)?.icon ?? "";
}

/** Turkish display labels for transaction status codes. */
export const STATUS_LABELS: Record<string, string> = {
  bekliyor:      "Bekliyor",
  kismi_odendi:  "Kısmi Ödendi",
  odendi:        "Ödendi",
  gecikti:       "Gecikti",
  iptal_edildi:  "İptal Edildi / Silindi",
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
