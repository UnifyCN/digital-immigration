import type { RuleSignals } from "../rules/loadPNPRules.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope.ts"

function teerFromGuess(teerGuess: string | null | undefined): number | null {
  if (!teerGuess) return null
  if (teerGuess.startsWith("teer_0")) return 0
  if (teerGuess.startsWith("teer_1")) return 1
  if (teerGuess.startsWith("teer_2")) return 2
  if (teerGuess.startsWith("teer_3")) return 3
  if (teerGuess.startsWith("teer_4")) return 4
  if (teerGuess.startsWith("teer_5")) return 5
  return null
}

function mapInstitutionType(signals: CombinedPNPSignals): "public" | "private" | "unknown" {
  if (signals.institutionType === "public" || signals.publicInstitutionInCanada === "yes") return "public"
  if (signals.institutionType === "private" || signals.publicInstitutionInCanada === "no") return "private"
  return "unknown"
}

function mapTriState(value: string | null | undefined): string | null {
  if (!value) return null
  if (value === "not_sure" || value === "not-sure" || value === "unsure") return "unknown"
  return value
}

function deriveTeer(signals: CombinedPNPSignals): number | null {
  const fromGuess = teerFromGuess(signals.provinceFinder?.teerLevelGuess ?? null)
  if (typeof fromGuess === "number") return fromGuess
  if (signals.teerSkillBand === "teer_0_3") return 2
  if (signals.teerSkillBand === "teer_4_5") return 4
  return null
}

export function buildRuleSignals(signals: CombinedPNPSignals): RuleSignals {
  return {
    hasJobOffer: mapTriState(signals.hasJobOfferRefined),
    jobProvinceCode: signals.jobProvinceCode,
    jobFullTime: mapTriState(signals.jobOfferFullTime),
    jobPermanent: mapTriState(signals.jobOfferPermanent),
    employerSupportPNP: mapTriState(signals.employerSupportRefined),
    teer: deriveTeer(signals),
    languageTestStatus: signals.languageReady,
    educationInCanada: mapTriState(signals.anyEducationInCanada),
    anyEducationInCanada: mapTriState(signals.anyEducationInCanada),
    educationProvinceCode: signals.educationProvinceCode,
    institutionType: mapInstitutionType(signals),
    programLength8mo: mapTriState(signals.programAtLeast8Months),
    graduatedWithin3Years: mapTriState(signals.completedWithin3Years),
    jobProvinceLabel: signals.jobProvince,
    nocCode: signals.provinceFinder.nocCode,
  }
}
