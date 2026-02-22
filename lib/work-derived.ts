import type { AssessmentData } from "./types"

type WorkDerivationInput = Pick<
  AssessmentData,
  | "countryOfWork"
  | "mostRecentJobStart"
  | "mostRecentJobEnd"
  | "mostRecentJobPresent"
  | "jobs"
  | "paidWorkStatus"
  | "hoursPerWeekRange"
>

function isCanadaCountry(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return false
  return normalized === "canada" || normalized === "ca" || normalized === "can"
}

function parseMonthToIndex(value: string): number | null {
  if (!/^\d{4}-\d{2}$/.test(value)) return null
  const [yearPart, monthPart] = value.split("-")
  const year = Number.parseInt(yearPart, 10)
  const month = Number.parseInt(monthPart, 10)
  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) return null
  return year * 12 + (month - 1)
}

function getCurrentMonthIndex(): number {
  const now = new Date()
  return now.getUTCFullYear() * 12 + now.getUTCMonth()
}

function inclusiveMonthsBetween(startIndex: number, endIndex: number): number {
  if (endIndex < startIndex) return 0
  return endIndex - startIndex + 1
}

export function getCurrentCanadianRoleMonths(input: WorkDerivationInput): number {
  if (!isCanadaCountry(input.countryOfWork)) return 0
  const startIndex = parseMonthToIndex(input.mostRecentJobStart)
  if (startIndex === null) return 0
  const endIndex = input.mostRecentJobPresent
    ? getCurrentMonthIndex()
    : parseMonthToIndex(input.mostRecentJobEnd) ?? getCurrentMonthIndex()
  return inclusiveMonthsBetween(startIndex, endIndex)
}

export function getQuickAddCanadianRoleCount(input: WorkDerivationInput): number {
  return (input.jobs ?? []).filter((job) => isCanadaCountry(job.country ?? "")).length
}

export function hasAnyCanadianWorkEntry(input: WorkDerivationInput): boolean {
  if (isCanadaCountry(input.countryOfWork)) return true
  return (input.jobs ?? []).some((job) => isCanadaCountry(job.country ?? ""))
}

export function deriveCanadianSkilledYearsBand(input: WorkDerivationInput): "0" | "1" | "2" | "3" | "4" | "5+" {
  if (input.paidWorkStatus !== "yes") return "0"

  const hoursFactor =
    input.hoursPerWeekRange === "30plus" ? 1 : input.hoursPerWeekRange === "15-29" ? 0.5 : 0

  if (hoursFactor === 0) return "0"

  let totalCanadianMonths = 0

  totalCanadianMonths += getCurrentCanadianRoleMonths(input)

  for (const job of input.jobs ?? []) {
    if (!isCanadaCountry(job.country ?? "")) continue
    const startIndex = parseMonthToIndex(job.startMonth ?? "")
    if (startIndex === null) continue
    const endIndex = job.present
      ? getCurrentMonthIndex()
      : parseMonthToIndex(job.endMonth ?? "") ?? getCurrentMonthIndex()
    totalCanadianMonths += inclusiveMonthsBetween(startIndex, endIndex)
  }

  const equivalentYears = Math.floor((totalCanadianMonths * hoursFactor) / 12)

  if (equivalentYears <= 0) return "0"
  if (equivalentYears >= 5) return "5+"
  return String(equivalentYears) as "1" | "2" | "3" | "4"
}
