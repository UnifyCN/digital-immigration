import type { RuleSignalValue, RuleSignals, SoftSignalRule, StreamRule } from "../rules/loadPNPRules.ts"
import { isUnknownRuleValue } from "./ruleEngine.ts"

function clampScore(score: number): number {
  if (score < 0) return 0
  if (score > 100) return 100
  return Math.round(score)
}

function normalizedValue(value: RuleSignalValue | undefined): string {
  return `${value}`
}

function pointsFromInMapping(value: RuleSignalValue | undefined, map: Record<string, number>): number | null {
  if (isUnknownRuleValue(value)) return null
  const actual = normalizedValue(value)
  for (const [rawSet, points] of Object.entries(map)) {
    const values = rawSet.split(",").map((entry) => entry.trim())
    if (values.includes(actual)) return points
  }
  return null
}

function scoreSoftSignal(rule: SoftSignalRule, signals: RuleSignals): number {
  const value = signals[rule.signalKey]
  const unknown = isUnknownRuleValue(value)

  if (rule.pointsYesIfEquals) {
    if (unknown) return rule.pointsUnknown ?? 0
    const mapped = rule.pointsYesIfEquals[normalizedValue(value)]
    if (typeof mapped === "number") return mapped
    return rule.pointsNoDefault ?? 0
  }

  if (rule.pointsIfIn) {
    if (unknown) return rule.pointsUnknown ?? 0
    const mapped = pointsFromInMapping(value, rule.pointsIfIn)
    if (typeof mapped === "number") return mapped
    return rule.pointsNoDefault ?? 0
  }

  if (
    typeof rule.pointsYes === "number" ||
    typeof rule.pointsNo === "number" ||
    typeof rule.pointsUnknown === "number"
  ) {
    if (value === "yes") return rule.pointsYes ?? 0
    if (value === "no") return rule.pointsNo ?? 0
    return rule.pointsUnknown ?? 0
  }

  return 0
}

export function scoreStream(stream: StreamRule, signals: RuleSignals): number {
  const total = stream.softSignals.reduce((sum, rule) => sum + scoreSoftSignal(rule, signals), 0)
  return clampScore(total)
}
