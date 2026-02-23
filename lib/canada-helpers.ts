const CANADA_TOKENS = new Set(["canada", "ca", "can", "canadian", "cdn"])
const CANADA_COMPACT = new Set(["canada", "ca", "can", "canadian", "canadaca"])

export function isCanadaCountry(value: string | undefined | null): boolean {
  const normalized = (value ?? "").trim().toLowerCase()
  if (!normalized) return false

  const compact = normalized.replace(/[^a-z]/g, "")
  if (CANADA_COMPACT.has(compact)) return true

  const tokens = normalized.split(/[^a-z]+/).filter(Boolean)
  return tokens.some((token) => CANADA_TOKENS.has(token))
}
