export function normalizeNocCode(input: string): string {
  return input.trim().replace(/\D/g, "")
}

export function isValidNocCode(code: string): boolean {
  return /^\d{5}$/.test(code)
}

export function deriveTeerFromNocCode(code: string): string | null {
  const normalized = normalizeNocCode(code)
  if (!isValidNocCode(normalized)) return null
  const teer = normalized.charAt(1)
  return /^[0-5]$/.test(teer) ? teer : null
}

export function isEligibleFstTradeNoc(code: string): boolean {
  const normalized = normalizeNocCode(code)
  if (!isValidNocCode(normalized)) return false

  if (normalized === "62200") return true
  if (normalized.startsWith("6320")) return true

  const majorGroup = normalized.slice(0, 2)
  if (!["72", "73", "82", "83", "92", "93"].includes(majorGroup)) {
    return false
  }

  if (normalized.startsWith("726")) return false
  if (normalized.startsWith("932")) return false

  return true
}
