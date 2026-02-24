import type { BaselineEvaluation } from "../rules/pnp/bcHardChecks.ts"
import { loadBCPNPStreams } from "../rules/loadPNPRules.ts"
import type { StreamFamilyId } from "../rules/pnp/bcFamilies.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope"
import { evaluateBaseline } from "./evaluateBaselineFromRules.ts"
import { buildRuleSignals } from "./pnpRuleSignals.ts"
import type { PNPBuildMeta } from "./pnpSignals"
import { isUnknownRuleValue } from "./ruleEngine.ts"

export function evaluateFamilyBaseline(
  familyId: StreamFamilyId,
  signals: CombinedPNPSignals,
  _meta?: PNPBuildMeta,
): BaselineEvaluation {
  const stream = loadBCPNPStreams().streams.find((item) => item.id === familyId)
  if (!stream) {
    return {
      familyId,
      badge: "unclear",
      checkResults: {},
      hardBlockers: [],
      missingRequired: [],
    }
  }

  const ruleSignals = buildRuleSignals(signals)
  const baseline = evaluateBaseline(stream, ruleSignals)
  const hardBlockers = [...baseline.hardBlockers]
  const missingRequired = [...baseline.missingRequired]

  if (familyId === "BC_EMPLOYER_SKILLED" && ruleSignals.employerSupportPNP === "no" && hardBlockers.length < 3) {
    hardBlockers.push(
      "Employer support for nomination was marked as 'No', which can limit employer-supported options.",
    )
  }

  if (
    familyId === "BC_EMPLOYER_SKILLED" &&
    isUnknownRuleValue(ruleSignals.employerSupportPNP) &&
    missingRequired.length < 4 &&
    !missingRequired.some((item) => item.id === "employer_support")
  ) {
    missingRequired.push({
      id: "employer_support",
      prompt: "Can your employer support a nomination application?",
      signalKeys: ["employerSupportPNP"],
    })
  }

  return {
    familyId,
    badge: baseline.baselineBadge,
    checkResults: baseline.checkResults,
    hardBlockers,
    missingRequired,
  }
}
