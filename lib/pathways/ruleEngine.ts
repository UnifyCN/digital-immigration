import type { RuleCondition, RuleSignals, RuleSignalValue } from "../rules/loadPNPRules"

export type ConditionEvalResult = "true" | "false" | "unknown"

export function isUnknownRuleValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "not_sure" ||
    value === "not-sure" ||
    value === "unsure" ||
    value === "unknown" ||
    Number.isNaN(value)
  )
}

function asEntries<T>(record: Record<string, T>): Array<[string, T]> {
  return Object.entries(record)
}

function valuesEqual(left: RuleSignalValue | undefined, right: RuleSignalValue): boolean {
  return left === right
}

function evalEquals(condition: Record<string, RuleSignalValue>, signals: RuleSignals): ConditionEvalResult {
  let hasUnknown = false
  for (const [key, expected] of asEntries(condition)) {
    const actual = signals[key]
    if (isUnknownRuleValue(actual)) {
      hasUnknown = true
      continue
    }
    if (!valuesEqual(actual, expected)) return "false"
  }
  if (hasUnknown) return "unknown"
  return "true"
}

function evalNotEquals(condition: Record<string, RuleSignalValue>, signals: RuleSignals): ConditionEvalResult {
  let hasUnknown = false
  for (const [key, expected] of asEntries(condition)) {
    const actual = signals[key]
    if (isUnknownRuleValue(actual)) {
      hasUnknown = true
      continue
    }
    if (valuesEqual(actual, expected)) return "false"
  }
  if (hasUnknown) return "unknown"
  return "true"
}

function evalIn(condition: Record<string, RuleSignalValue[]>, signals: RuleSignals): ConditionEvalResult {
  let hasUnknown = false
  for (const [key, allowed] of asEntries(condition)) {
    const actual = signals[key]
    if (isUnknownRuleValue(actual)) {
      hasUnknown = true
      continue
    }
    if (!allowed.some((value) => valuesEqual(actual, value))) return "false"
  }
  if (hasUnknown) return "unknown"
  return "true"
}

function evalAny(conditions: RuleCondition[], signals: RuleSignals): ConditionEvalResult {
  let hasUnknown = false
  for (const condition of conditions) {
    const result = evaluateCondition(condition, signals)
    if (result === "true") return "true"
    if (result === "unknown") hasUnknown = true
  }
  return hasUnknown ? "unknown" : "false"
}

function evalAllKnownNot(
  conditions: Array<Record<string, RuleSignalValue>>,
  signals: RuleSignals,
): ConditionEvalResult {
  let hasUnknown = false

  for (const pair of conditions) {
    for (const [key, disallowedValue] of asEntries(pair)) {
      const actual = signals[key]
      if (isUnknownRuleValue(actual)) {
        hasUnknown = true
        continue
      }
      if (valuesEqual(actual, disallowedValue)) return "false"
    }
  }

  if (hasUnknown) return "unknown"
  return "true"
}

export function evaluateCondition(condition: RuleCondition, signals: RuleSignals): ConditionEvalResult {
  if ("equals" in condition) return evalEquals(condition.equals, signals)
  if ("notEquals" in condition) return evalNotEquals(condition.notEquals, signals)
  if ("in" in condition) return evalIn(condition.in, signals)
  if ("any" in condition) return evalAny(condition.any, signals)
  if ("allKnownNot" in condition) return evalAllKnownNot(condition.allKnownNot, signals)
  return "unknown"
}

export function conditionIsTrue(condition: RuleCondition, signals: RuleSignals): boolean {
  return evaluateCondition(condition, signals) === "true"
}
