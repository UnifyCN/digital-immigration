import {
  BC_EMPLOYER_SKILLED_HARD_CHECKS,
  BC_INTL_GRAD_HARD_CHECKS,
  type BaselineEvaluation,
  type CheckResult,
  type HardCheck,
} from "../rules/pnp/bcHardChecks.ts"
import type { StreamFamilyId } from "../rules/pnp/bcFamilies.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope"
import type { PNPBuildMeta } from "./pnpSignals"

const EMPLOYER_CRITICAL_FAIL_IDS = new Set([
  "A1_job_offer_exists",
  "A2_job_in_bc",
  "A3_full_time",
  "A4_permanent_or_ongoing",
  "A5_skilled_teer",
])

const GRAD_CRITICAL_FAIL_IDS = new Set([
  "B1_canadian_education",
  "B2_public_institution",
  "B3_program_8_months",
  "B5_bc_anchor",
])

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined || value === "not_sure" || value === "not-sure" || value === "unsure"
}

function checksForFamily(familyId: StreamFamilyId): HardCheck[] {
  return familyId === "BC_EMPLOYER_SKILLED" ? BC_EMPLOYER_SKILLED_HARD_CHECKS : BC_INTL_GRAD_HARD_CHECKS
}

function isCriticalFail(familyId: StreamFamilyId, checkId: string, result: CheckResult): boolean {
  if (result !== "FAIL") return false
  if (familyId === "BC_EMPLOYER_SKILLED") return EMPLOYER_CRITICAL_FAIL_IDS.has(checkId)
  return GRAD_CRITICAL_FAIL_IDS.has(checkId)
}

export function evaluateFamilyBaseline(
  familyId: StreamFamilyId,
  signals: CombinedPNPSignals,
  _meta?: PNPBuildMeta,
): BaselineEvaluation {
  const checks = checksForFamily(familyId)
  const checkResults: Record<string, CheckResult> = {}

  for (const check of checks) {
    checkResults[check.id] = check.evaluate({ signals })
  }

  const unknownCount = checks.filter((check) => checkResults[check.id] === "UNKNOWN").length
  const hasCriticalFail = checks.some((check) => isCriticalFail(familyId, check.id, checkResults[check.id]))
  const badge = hasCriticalFail ? "fail" : unknownCount >= 2 ? "unclear" : "pass"

  const hardBlockers = checks
    .filter((check) => checkResults[check.id] === "FAIL" && check.blockerText)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .map((check) => check.blockerText as string)
    .slice(0, 3)

  if (
    familyId === "BC_EMPLOYER_SKILLED" &&
    signals.employerSupportRefined === "no" &&
    hardBlockers.length < 3
  ) {
    hardBlockers.push(
      "Employer support for nomination was marked as 'No', which can limit employer-supported options.",
    )
  }

  const missingRequired = checks
    .filter((check) => checkResults[check.id] === "UNKNOWN" && check.missingPrompt)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .map((check) => ({
      id: check.id,
      prompt: check.missingPrompt as string,
      signalKeys: check.signalKeys,
    }))
    .slice(0, 4)

  if (
    familyId === "BC_EMPLOYER_SKILLED" &&
    (isUnknown(signals.employerSupportRefined) || signals.employerSupportRefined === "not_sure") &&
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
    badge,
    checkResults,
    hardBlockers,
    missingRequired,
  }
}
