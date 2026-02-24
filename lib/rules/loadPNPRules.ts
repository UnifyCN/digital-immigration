import streamsData from "../../rules/pnp/bc/streams.json" with { type: "json" }
import type { StreamFamilyId } from "./pnp/bcFamilies.ts"

export type RuleSignalValue = string | number | boolean | null
export type RuleSignals = Record<string, RuleSignalValue | undefined>

export type RuleCondition =
  | { equals: Record<string, RuleSignalValue> }
  | { notEquals: Record<string, RuleSignalValue> }
  | { in: Record<string, RuleSignalValue[]> }
  | { any: RuleCondition[] }
  | { allKnownNot: Array<Record<string, RuleSignalValue>> }

export type HardRequirementRule = {
  id: string
  label: string
  signalKeys: string[]
  critical: boolean
  priority: number
  pass: RuleCondition
  fail: RuleCondition
  blockerText?: string
  missingPrompt?: string
}

export type SoftSignalRule = {
  signalKey: string
  pointsYes?: number
  pointsNo?: number
  pointsUnknown?: number
  pointsYesIfEquals?: Record<string, number>
  pointsNoDefault?: number
  pointsIfIn?: Record<string, number>
}

export type WhyRule = {
  id?: string
  when: RuleCondition
  text: string
}

export type MissingPromptRule = {
  signalKey: string
  id: string
  prompt: string
}

export type StreamRule = {
  id: StreamFamilyId
  displayName: string
  shortDescription: string
  hardRequirements: HardRequirementRule[]
  softSignals: SoftSignalRule[]
  whyRules: WhyRule[]
  missingPrompts: MissingPromptRule[]
}

export type BCPNPRules = {
  rulesVersion: string
  lastUpdated: string
  streams: StreamRule[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isRuleCondition(value: unknown): value is RuleCondition {
  if (!isObject(value)) return false
  if ("equals" in value || "notEquals" in value || "in" in value) return true
  if ("any" in value && Array.isArray(value.any)) return true
  if ("allKnownNot" in value && Array.isArray(value.allKnownNot)) return true
  return false
}

function isHardRequirementRule(value: unknown): value is HardRequirementRule {
  if (!isObject(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    Array.isArray(value.signalKeys) &&
    typeof value.critical === "boolean" &&
    typeof value.priority === "number" &&
    isRuleCondition(value.pass) &&
    isRuleCondition(value.fail)
  )
}

function isSoftSignalRule(value: unknown): value is SoftSignalRule {
  if (!isObject(value)) return false
  return typeof value.signalKey === "string"
}

function isWhyRule(value: unknown): value is WhyRule {
  if (!isObject(value)) return false
  return typeof value.text === "string" && isRuleCondition(value.when)
}

function isMissingPromptRule(value: unknown): value is MissingPromptRule {
  if (!isObject(value)) return false
  return typeof value.id === "string" && typeof value.signalKey === "string" && typeof value.prompt === "string"
}

function isStreamRule(value: unknown): value is StreamRule {
  if (!isObject(value)) return false
  if (value.id !== "BC_EMPLOYER_SKILLED" && value.id !== "BC_INTL_GRAD") return false
  return (
    typeof value.displayName === "string" &&
    typeof value.shortDescription === "string" &&
    Array.isArray(value.hardRequirements) &&
    value.hardRequirements.every(isHardRequirementRule) &&
    Array.isArray(value.softSignals) &&
    value.softSignals.every(isSoftSignalRule) &&
    Array.isArray(value.whyRules) &&
    value.whyRules.every(isWhyRule) &&
    Array.isArray(value.missingPrompts) &&
    value.missingPrompts.every(isMissingPromptRule)
  )
}

function validateBCRules(input: unknown): BCPNPRules {
  if (!isObject(input)) throw new Error("BC rules: expected object")
  if (typeof input.rulesVersion !== "string") throw new Error("BC rules: rulesVersion missing")
  if (typeof input.lastUpdated !== "string") throw new Error("BC rules: lastUpdated missing")
  if (!Array.isArray(input.streams)) throw new Error("BC rules: streams missing")

  const streams = input.streams.filter(isStreamRule)
  if (streams.length !== input.streams.length) {
    throw new Error("BC rules: invalid stream entry")
  }

  return {
    rulesVersion: input.rulesVersion,
    lastUpdated: input.lastUpdated,
    streams,
  }
}

let cachedRules: BCPNPRules | null = null

export function loadBCPNPStreams(): BCPNPRules {
  if (cachedRules) return cachedRules

  try {
    cachedRules = validateBCRules(streamsData)
    return cachedRules
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      throw error
    }

    return {
      rulesVersion: "bc-pnp-invalid",
      lastUpdated: "",
      streams: [],
    }
  }
}
