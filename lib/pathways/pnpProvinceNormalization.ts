export type MVPProvinceCode = "BC"

const ANY_PROVINCE_ALIAS_TO_CODE: Record<string, string> = {
  bc: "BC",
  "british columbia": "BC",
  ab: "AB",
  alberta: "AB",
  on: "ON",
  ontario: "ON",
  mb: "MB",
  manitoba: "MB",
  sk: "SK",
  saskatchewan: "SK",
  qc: "QC",
  quebec: "QC",
  nb: "NB",
  "new brunswick": "NB",
  ns: "NS",
  "nova scotia": "NS",
  pe: "PE",
  pei: "PE",
  "prince edward island": "PE",
  nl: "NL",
  "newfoundland and labrador": "NL",
  yt: "YT",
  yukon: "YT",
  nt: "NT",
  "northwest territories": "NT",
  nu: "NU",
  nunavut: "NU",
}

function normalizeLower(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export function detectProvinceCode(input: string | null | undefined): string | null {
  const normalized = normalizeLower(input)
  if (!normalized) return null
  return ANY_PROVINCE_ALIAS_TO_CODE[normalized] ?? null
}

export function normalizeProvince(input: string | null | undefined): MVPProvinceCode | null {
  const detected = detectProvinceCode(input)
  return detected === "BC" ? "BC" : null
}
