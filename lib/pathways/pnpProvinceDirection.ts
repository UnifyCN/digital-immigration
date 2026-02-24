import type { PNPSignals } from "./pnpSignals"

export const PROVINCE_DIRECTED_FLEXIBILITY = new Set(["prefer-specific", "only-specific"])

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

export function isProvinceDirected(signals: Pick<PNPSignals, "settleFlexibility" | "preferredProvince">): boolean {
  if ((signals.preferredProvince ?? "").trim().length > 0) return true
  return PROVINCE_DIRECTED_FLEXIBILITY.has(normalize(signals.settleFlexibility))
}
