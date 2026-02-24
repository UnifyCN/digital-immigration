import type { BaselineBadge, CheckResult } from "../rules/pnp/bcHardChecks.ts"
import type { HardRequirementRule, RuleSignals, StreamRule } from "../rules/loadPNPRules.ts"
import { evaluateCondition } from "./ruleEngine.ts"

export type BaselineFromRulesResult = {
  baselineBadge: BaselineBadge
  checkResults: Record<string, CheckResult>
  hardBlockers: string[]
  missingRequired: Array<{ id: string; prompt: string; signalKeys?: string[] }>
}

function sortByPriorityDesc<T extends { priority: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
}

function evaluateRequirement(rule: HardRequirementRule, signals: RuleSignals): CheckResult {
  const passResult = evaluateCondition(rule.pass, signals)
  if (passResult === "true") return "PASS"

  const failResult = evaluateCondition(rule.fail, signals)
  if (failResult === "true") return "FAIL"

  return "UNKNOWN"
}

export function evaluateBaseline(
  stream: StreamRule,
  signals: RuleSignals,
): BaselineFromRulesResult {
  const checkResults: Record<string, CheckResult> = {}
  const checks = stream.hardRequirements

  for (const requirement of checks) {
    checkResults[requirement.id] = evaluateRequirement(requirement, signals)
  }

  const hasCriticalFail = checks.some((check) => check.critical && checkResults[check.id] === "FAIL")
  const criticalUnknownCount = checks.filter((check) => check.critical && checkResults[check.id] === "UNKNOWN").length

  const baselineBadge: BaselineBadge = hasCriticalFail ? "fail" : criticalUnknownCount >= 2 ? "unclear" : "pass"

  const hardBlockers = sortByPriorityDesc(
    checks.filter((check) => checkResults[check.id] === "FAIL" && Boolean(check.blockerText)),
  )
    .map((check) => check.blockerText as string)
    .slice(0, 3)

  const missingRequired = sortByPriorityDesc(
    checks.filter((check) => checkResults[check.id] === "UNKNOWN" && Boolean(check.missingPrompt)),
  )
    .map((check) => ({
      id: check.id,
      prompt: check.missingPrompt as string,
      signalKeys: check.signalKeys,
    }))
    .slice(0, 4)

  return {
    baselineBadge,
    checkResults,
    hardBlockers,
    missingRequired,
  }
}
