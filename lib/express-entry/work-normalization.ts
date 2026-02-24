import { subYears } from "date-fns"
import { isCanadaCountry } from "../canada-helpers.ts"
import type { WorkRole } from "../types.ts"
import { COUNTABLE_HOURS_PER_YEAR, HOURS_PER_WEEK_CAP } from "./rules.ts"

const DAY_MS = 24 * 60 * 60 * 1000
const DAILY_HOURS_CAP = HOURS_PER_WEEK_CAP / 7

type WorkRolePredicate = (role: WorkRole) => boolean

function parseDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function clampDateRange(start: Date, end: Date, windowStart: Date, windowEnd: Date): [Date, Date] | null {
  const clampedStart = start < windowStart ? windowStart : start
  const clampedEnd = end > windowEnd ? windowEnd : end
  return clampedEnd < clampedStart ? null : [clampedStart, clampedEnd]
}

function roleDates(role: WorkRole, asOfDate: Date): [Date, Date] | null {
  const start = parseDate(role.startDate)
  const end = role.present ? startOfUtcDay(asOfDate) : parseDate(role.endDate)
  if (!start || !end || end < start) return null
  return [startOfUtcDay(start), startOfUtcDay(end)]
}

function roleDailyHours(role: WorkRole): number {
  const weekly = role.hoursPerWeek ?? 0
  if (!Number.isFinite(weekly) || weekly <= 0) return 0
  return Math.min(weekly, HOURS_PER_WEEK_CAP) / 7
}

export interface NormalizedWorkSummary {
  totalHours: number
  countableDays: number
  dailyHoursMap: Map<string, number>
}

export function normalizeWorkHours(
  roles: WorkRole[],
  options: {
    asOfDate: Date
    windowYears: number
    predicate?: WorkRolePredicate
  },
): NormalizedWorkSummary {
  const windowEnd = startOfUtcDay(options.asOfDate)
  const windowStart = startOfUtcDay(subYears(windowEnd, options.windowYears))
  const predicate = options.predicate ?? (() => true)

  const dayHours = new Map<string, number>()

  for (const role of roles) {
    if (!predicate(role)) continue

    const dates = roleDates(role, options.asOfDate)
    if (!dates) continue

    const [start, end] = dates
    const clamped = clampDateRange(start, end, windowStart, windowEnd)
    if (!clamped) continue

    const [windowedStart, windowedEnd] = clamped
    const hours = roleDailyHours(role)
    if (hours <= 0) continue

    for (let time = windowedStart.getTime(); time <= windowedEnd.getTime(); time += DAY_MS) {
      const day = new Date(time)
      const key = formatDateKey(day)
      const nextHours = (dayHours.get(key) ?? 0) + hours
      dayHours.set(key, Math.min(DAILY_HOURS_CAP, nextHours))
    }
  }

  let totalHours = 0
  for (const hours of dayHours.values()) {
    totalHours += hours
  }

  return {
    totalHours,
    countableDays: dayHours.size,
    dailyHoursMap: dayHours,
  }
}

export function hasContinuousCountableYear(summary: NormalizedWorkSummary): boolean {
  if (summary.dailyHoursMap.size === 0) return false

  const dayKeys = Array.from(summary.dailyHoursMap.keys()).sort()
  let streakDays = 1
  let streakHours = summary.dailyHoursMap.get(dayKeys[0]) ?? 0

  for (let index = 1; index < dayKeys.length; index++) {
    const previous = new Date(`${dayKeys[index - 1]}T00:00:00Z`).getTime()
    const current = new Date(`${dayKeys[index]}T00:00:00Z`).getTime()

    if (current - previous === DAY_MS) {
      streakDays += 1
      streakHours += summary.dailyHoursMap.get(dayKeys[index]) ?? 0
    } else {
      streakDays = 1
      streakHours = summary.dailyHoursMap.get(dayKeys[index]) ?? 0
    }

    if (streakDays >= 365 && streakHours >= COUNTABLE_HOURS_PER_YEAR) {
      return true
    }
  }

  return false
}

export function isSkilledTeer(teer: string): boolean {
  return teer === "0" || teer === "1" || teer === "2" || teer === "3"
}

export function isCanadianRole(role: WorkRole): boolean {
  return isCanadaCountry(role.country)
}
