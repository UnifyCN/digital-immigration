import { subYears } from "date-fns"
import type { CandidateWorkRole } from "./types.ts"
import { HOURS_PER_WEEK_CAP } from "../../express-entry/rules.ts"

const DAY_MS = 24 * 60 * 60 * 1000
const DAILY_CAP = HOURS_PER_WEEK_CAP / 7

function toDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function dayKey(date: Date): string {
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${date.getUTCFullYear()}-${month}-${day}`
}

function clampRange(start: Date, end: Date, windowStart: Date, windowEnd: Date): [Date, Date] | null {
  const clampedStart = start < windowStart ? windowStart : start
  const clampedEnd = end > windowEnd ? windowEnd : end
  if (clampedEnd < clampedStart) return null
  return [clampedStart, clampedEnd]
}

function roleRange(role: CandidateWorkRole, asOfDate: Date): [Date, Date] | null {
  const start = toDate(role.startDate)
  const end = role.present ? toDay(asOfDate) : toDate(role.endDate)
  if (!start || !end || end < start) return null
  return [toDay(start), toDay(end)]
}

function roleDailyHours(role: CandidateWorkRole): number {
  const hours = role.hoursPerWeek ?? 0
  if (!Number.isFinite(hours) || hours <= 0) return 0
  return Math.min(hours, HOURS_PER_WEEK_CAP) / 7
}

export interface HoursSummary {
  totalHours: number
  dayHoursMap: Map<string, number>
}

export function summarizeHours(
  roles: CandidateWorkRole[],
  asOfDate: Date,
  windowYears: number,
  predicate?: (role: CandidateWorkRole) => boolean,
): HoursSummary {
  const windowEnd = toDay(asOfDate)
  const windowStart = toDay(subYears(windowEnd, windowYears))
  const accepted = predicate ?? (() => true)

  const dayHours = new Map<string, number>()

  for (const role of roles) {
    if (!accepted(role)) continue
    const range = roleRange(role, asOfDate)
    if (!range) continue

    const clamped = clampRange(range[0], range[1], windowStart, windowEnd)
    if (!clamped) continue

    const hoursPerDay = roleDailyHours(role)
    if (hoursPerDay <= 0) continue

    for (let t = clamped[0].getTime(); t <= clamped[1].getTime(); t += DAY_MS) {
      const key = dayKey(new Date(t))
      const next = (dayHours.get(key) ?? 0) + hoursPerDay
      dayHours.set(key, Math.min(DAILY_CAP, next))
    }
  }

  let totalHours = 0
  for (const value of dayHours.values()) {
    totalHours += value
  }

  return { totalHours, dayHoursMap: dayHours }
}

export function hasContinuousYearForRole(role: CandidateWorkRole, asOfDate: Date): boolean {
  const range = roleRange(role, asOfDate)
  if (!range) return false

  const [start, end] = range
  const daySpan = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1
  if (daySpan < 365) return false

  const summary = summarizeHours([role], asOfDate, 10)
  return summary.totalHours >= 1560
}

export function hasMissingDatePrecision(role: CandidateWorkRole): boolean {
  return !/^\d{4}-\d{2}-\d{2}$/.test(role.startDate) || (!role.present && !/^\d{4}-\d{2}-\d{2}$/.test(role.endDate))
}
