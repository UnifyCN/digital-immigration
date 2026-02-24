import bannedTermsData from "../../rules/compliance/banned_terms.json" with { type: "json" }

const BANNED_TERMS: string[] = Array.isArray(bannedTermsData.banned)
  ? bannedTermsData.banned.map((term) => term.toLowerCase())
  : []

export function assertComplianceText(text: string, context = "unknown"): void {
  if (process.env.NODE_ENV === "production") return
  const normalized = text.toLowerCase()
  const found = BANNED_TERMS.find((term) => normalized.includes(term))
  if (found) {
    console.error(`[compliance] Banned term detected (${found}) in ${context}: ${text}`)
  }
}
