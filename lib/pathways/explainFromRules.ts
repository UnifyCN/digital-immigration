import type { RuleSignals, StreamRule } from "../rules/loadPNPRules.ts"
import { conditionIsTrue, isUnknownRuleValue } from "./ruleEngine.ts"

export type RuleMissingPrompt = {
  id: string
  prompt: string
  reason?: string
  signalKeys?: string[]
}

export function generateWhyBullets(stream: StreamRule, signals: RuleSignals): {
  whyBullets: string[]
  whyBulletIds: string[]
} {
  const matched = stream.whyRules
    .filter((rule) => conditionIsTrue(rule.when, signals))
    .map((rule, index) => ({
      id: rule.id ?? `why_${stream.id}_${index + 1}`,
      text: rule.text,
    }))

  const deduped = matched.filter((item, index) => matched.findIndex((x) => x.text === item.text) === index)

  const whyBullets = deduped.map((item) => item.text).slice(0, 4)
  const whyBulletIds = deduped.map((item) => item.id).slice(0, 4)

  while (whyBullets.length < 2) {
    whyBullets.push("We can refine this recommendation with a few more details.")
    whyBulletIds.push(`fallback_why_${whyBullets.length}`)
  }

  return {
    whyBullets,
    whyBulletIds,
  }
}

export function generateMissingInfo(stream: StreamRule, signals: RuleSignals): RuleMissingPrompt[] {
  const missing = stream.missingPrompts
    .filter((item) => isUnknownRuleValue(signals[item.signalKey]))
    .map((item) => ({
      id: item.id,
      prompt: item.prompt,
      signalKeys: [item.signalKey],
    }))

  const deduped = missing.filter((item, index) => missing.findIndex((x) => x.id === item.id) === index)
  return deduped.slice(0, 4)
}
