export type ProvinceCode = "BC" | "AB" | "ON" | "SK" | "MB"

export type ProvinceFinderAnswers = {
  employerSupport: "yes" | "no" | "not_sure"
  employerEmployeesInProvince: "lt5" | "5to50" | "50plus" | "not_sure"
  monthsWithEmployer: "lt3" | "3to6" | "6to12" | "1plus"
  hourlyWage: number | null
  ruralJobLocation: "yes" | "no" | "not_sure"

  institutionType: "public" | "private" | "unsure"
  programAtLeast8Months: "yes" | "no" | "not_sure"
  graduatedWithin3Years: "yes" | "no"

  willingOutsideMajorCities: "yes" | "no" | "maybe"
  committedToResideProvince: "yes" | "no" | "unsure"

  occupationRegulated: "yes" | "no" | "not_sure"
  licensureStatus: "yes" | "no" | "in_progress"

  priorNomination: "yes" | "no"
  priorPNPRefusal: "yes" | "no"
  settlementFunds: "yes" | "no" | "not_sure"

  frenchIntermediatePlus: "yes" | "no"
  prioritySectorEmployer: "yes" | "no" | "not_sure"
}

export type ProvinceFinderDraftAnswers = Partial<Omit<ProvinceFinderAnswers, "hourlyWage">> & {
  hourlyWage: number | null
}

export type ProvinceRecommendation = {
  provinceCode: ProvinceCode
  provinceName: string
  alignmentScore: number
  alignmentLabel: "Strong alignment" | "Moderate alignment" | "Exploratory"
  whyBullets: string[]
  whatToConfirmNext: string[]
  riskFlags: string[]
}

export const demoProvinceFinderAnswers: ProvinceFinderAnswers = {
  employerSupport: "yes",
  employerEmployeesInProvince: "50plus",
  monthsWithEmployer: "6to12",
  hourlyWage: 36,
  ruralJobLocation: "no",
  institutionType: "public",
  programAtLeast8Months: "yes",
  graduatedWithin3Years: "yes",
  willingOutsideMajorCities: "maybe",
  committedToResideProvince: "yes",
  occupationRegulated: "no",
  licensureStatus: "yes",
  priorNomination: "no",
  priorPNPRefusal: "no",
  settlementFunds: "yes",
  frenchIntermediatePlus: "no",
  prioritySectorEmployer: "yes",
}

type ProvinceProfile = {
  code: ProvinceCode
  name: string
  ruralMultiplier: number
  outsideMajorMultiplier: number
  institutionMultiplier: number
  recentGradMultiplier: number
  frenchMultiplier: number
  settlementMultiplier: number
  prioritySectorMultiplier: number
}

const PROVINCE_PROFILES: ProvinceProfile[] = [
  {
    code: "BC",
    name: "British Columbia",
    ruralMultiplier: 0.7,
    outsideMajorMultiplier: 0.75,
    institutionMultiplier: 1.3,
    recentGradMultiplier: 1.25,
    frenchMultiplier: 0.8,
    settlementMultiplier: 0.95,
    prioritySectorMultiplier: 1.0,
  },
  {
    code: "AB",
    name: "Alberta",
    ruralMultiplier: 1.2,
    outsideMajorMultiplier: 1.15,
    institutionMultiplier: 0.95,
    recentGradMultiplier: 1.0,
    frenchMultiplier: 0.9,
    settlementMultiplier: 1.0,
    prioritySectorMultiplier: 1.2,
  },
  {
    code: "ON",
    name: "Ontario",
    ruralMultiplier: 0.75,
    outsideMajorMultiplier: 0.8,
    institutionMultiplier: 1.2,
    recentGradMultiplier: 1.15,
    frenchMultiplier: 1.4,
    settlementMultiplier: 1.0,
    prioritySectorMultiplier: 1.0,
  },
  {
    code: "SK",
    name: "Saskatchewan",
    ruralMultiplier: 1.45,
    outsideMajorMultiplier: 1.45,
    institutionMultiplier: 0.9,
    recentGradMultiplier: 0.95,
    frenchMultiplier: 0.95,
    settlementMultiplier: 1.15,
    prioritySectorMultiplier: 1.05,
  },
  {
    code: "MB",
    name: "Manitoba",
    ruralMultiplier: 1.45,
    outsideMajorMultiplier: 1.45,
    institutionMultiplier: 0.9,
    recentGradMultiplier: 0.95,
    frenchMultiplier: 1.1,
    settlementMultiplier: 1.15,
    prioritySectorMultiplier: 1.0,
  },
]

type ReasonCode =
  | "employer_support_yes"
  | "employer_support_no"
  | "employer_support_not_sure"
  | "employer_size_50plus"
  | "employer_size_5to50"
  | "tenure_1plus"
  | "tenure_6to12"
  | "tenure_3to6"
  | "wage_provided"
  | "rural_match"
  | "institution_public"
  | "institution_private_or_unsure"
  | "program_8_months"
  | "recent_graduate"
  | "outside_major_cities"
  | "committed_to_reside"
  | "occupation_not_regulated"
  | "licensure_ready"
  | "first_nomination"
  | "no_prior_refusal"
  | "prior_refusal_penalty"
  | "settlement_funds_ready"
  | "french_boost"
  | "priority_sector"

const REASON_BULLETS: Record<ReasonCode, string> = {
  employer_support_yes: "You reported clear employer support for a provincial nomination pathway.",
  employer_support_no: "Employer support is currently not confirmed for nomination-focused options.",
  employer_support_not_sure: "Employer support may be possible but still needs confirmation.",
  employer_size_50plus: "A larger provincial employer footprint can align with several employer-driven streams.",
  employer_size_5to50: "Employer size appears within ranges often seen in provincial employer-driven pathways.",
  tenure_1plus: "Longer tenure with your employer can support stream alignment narratives.",
  tenure_6to12: "Your current tenure can support early alignment in several streams.",
  tenure_3to6: "Your work duration is building toward stream expectations.",
  wage_provided: "You provided wage information, which is commonly requested during stream matching.",
  rural_match: "Your rural or non-major-city profile aligns with provinces that emphasize regional pathways.",
  institution_public: "Public-institution study history tends to align with graduate-focused pathways.",
  institution_private_or_unsure: "Your study background may still align, but stream-specific education rules need confirmation.",
  program_8_months: "Program length appears aligned with common minimum study-duration signals.",
  recent_graduate: "Recent graduation timing can align with graduate-targeted provincial pathways.",
  outside_major_cities: "Willingness to live outside major cities supports several region-focused options.",
  committed_to_reside: "You indicated intent to reside in-province, a core alignment signal.",
  occupation_not_regulated: "A non-regulated occupation can reduce licensure friction in some streams.",
  licensure_ready: "Licensure status appears supportive where regulated occupations apply.",
  first_nomination: "No prior nomination can simplify pathway history review.",
  no_prior_refusal: "No prior provincial refusal is a positive procedural signal.",
  prior_refusal_penalty: "A prior provincial refusal may reduce alignment until refusal issues are addressed.",
  settlement_funds_ready: "Settlement funds readiness can support streams that require financial proof.",
  french_boost: "French ability can open additional provincial and bilingual-friendly options.",
  priority_sector: "Employer activity in a priority sector can improve alignment in targeted streams.",
}

const REQUIRED_RADIO_KEYS: Array<keyof Omit<ProvinceFinderAnswers, "hourlyWage">> = [
  "employerSupport",
  "employerEmployeesInProvince",
  "monthsWithEmployer",
  "ruralJobLocation",
  "institutionType",
  "programAtLeast8Months",
  "graduatedWithin3Years",
  "willingOutsideMajorCities",
  "committedToResideProvince",
  "occupationRegulated",
  "licensureStatus",
  "priorNomination",
  "priorPNPRefusal",
  "settlementFunds",
  "frenchIntermediatePlus",
  "prioritySectorEmployer",
]

export function getProvinceFinderInitialDraft(): ProvinceFinderDraftAnswers {
  return {
    hourlyWage: null,
  }
}

export function getProvinceFinderRequiredRadioKeys() {
  return REQUIRED_RADIO_KEYS
}

export function isCompleteProvinceFinderAnswers(
  draft: ProvinceFinderDraftAnswers,
): draft is ProvinceFinderAnswers {
  return REQUIRED_RADIO_KEYS.every((key) => Boolean(draft[key]))
}

function roundPoints(value: number): number {
  return Math.round(value * 10) / 10
}

function scoreLabel(score: number): ProvinceRecommendation["alignmentLabel"] {
  if (score >= 70) return "Strong alignment"
  if (score >= 45) return "Moderate alignment"
  return "Exploratory"
}

function shortLabel(label: ProvinceRecommendation["alignmentLabel"]): string {
  if (label === "Strong alignment") return "Strong"
  if (label === "Moderate alignment") return "Moderate"
  return "Exploratory"
}

function wagePoints(hourlyWage: number | null): number {
  if (hourlyWage === null || Number.isNaN(hourlyWage)) return 0
  return hourlyWage > 0 ? 5 : 0
}

function addReason(reasonCodes: Set<ReasonCode>, reason: ReasonCode, points: number): void {
  if (points > 0) reasonCodes.add(reason)
}

function buildRiskFlags(answers: ProvinceFinderAnswers): string[] {
  const riskFlags: string[] = []

  if (answers.priorPNPRefusal === "yes") {
    riskFlags.push("Prior provincial refusal reported; review refusal reasons before reapplying.")
  }
  if (answers.occupationRegulated === "yes" && answers.licensureStatus !== "yes") {
    riskFlags.push("Regulated occupation may require confirmed provincial licensure.")
  }
  if (answers.employerSupport !== "yes") {
    riskFlags.push("Employer support is not confirmed yet for nomination-focused streams.")
  }
  if (answers.settlementFunds !== "yes") {
    riskFlags.push("Settlement funds status is not fully confirmed.")
  }
  if (answers.committedToResideProvince !== "yes") {
    riskFlags.push("Intent to reside long-term in the nominating province needs stronger evidence.")
  }

  return riskFlags
}

function buildWhatToConfirmNext(answers: ProvinceFinderAnswers, province: ProvinceProfile): string[] {
  const items: string[] = []

  if (answers.employerSupport !== "yes") {
    items.push("Confirm whether your employer will support nomination-related documentation.")
  }
  if (answers.employerEmployeesInProvince === "not_sure") {
    items.push("Confirm your employer's active employee footprint in the province.")
  }
  if (answers.occupationRegulated === "yes" && answers.licensureStatus !== "yes") {
    items.push("Verify licensing steps and whether provisional registration is accepted in this province.")
  }
  if (answers.priorPNPRefusal === "yes") {
    items.push("Review prior refusal notes and prepare a consistent explanation package.")
  }
  if (answers.settlementFunds !== "yes") {
    items.push("Check current settlement fund proof rules and acceptable evidence.")
  }
  if ((province.code === "BC" || province.code === "ON") && answers.institutionType !== "public") {
    items.push("Confirm this province's stream rules on institution type and credential recognition.")
  }
  if (answers.programAtLeast8Months !== "yes") {
    items.push("Confirm that your program duration aligns with stream minimums.")
  }
  if ((province.code === "BC" || province.code === "ON") && answers.graduatedWithin3Years === "no") {
    items.push("Confirm graduate stream recency windows for this province.")
  }
  if (answers.committedToResideProvince !== "yes") {
    items.push("Prepare evidence of long-term residence intent in the province.")
  }
  if (province.code === "ON" && answers.frenchIntermediatePlus === "no") {
    items.push("If exploring Francophone options, confirm required French test benchmarks.")
  }
  if (
    (province.code === "SK" || province.code === "MB" || province.code === "AB") &&
    answers.willingOutsideMajorCities !== "yes"
  ) {
    items.push("Confirm whether your target stream prefers regional or non-major-city settlement.")
  }

  return Array.from(new Set(items)).slice(0, 6)
}

const NORMALIZATION_DENOMINATOR = 140

export function computeProvinceRecommendations(
  answers: ProvinceFinderAnswers,
): ProvinceRecommendation[] {
  const recommendations = PROVINCE_PROFILES.map((profile) => {
    let rawScore = 0
    const reasonCodes = new Set<ReasonCode>()

    const employerSupportPoints = { yes: 15, not_sure: 8, no: 0 }[answers.employerSupport]
    rawScore += employerSupportPoints
    const employerSupportReasonCode =
      answers.employerSupport === "yes"
        ? "employer_support_yes"
        : answers.employerSupport === "not_sure"
          ? "employer_support_not_sure"
          : "employer_support_no"
    addReason(reasonCodes, employerSupportReasonCode, employerSupportPoints)

    const employerSizePoints = { "50plus": 10, "5to50": 6, lt5: 2, not_sure: 3 }[answers.employerEmployeesInProvince]
    rawScore += employerSizePoints
    if (answers.employerEmployeesInProvince === "50plus") addReason(reasonCodes, "employer_size_50plus", employerSizePoints)
    if (answers.employerEmployeesInProvince === "5to50") addReason(reasonCodes, "employer_size_5to50", employerSizePoints)

    const tenurePoints = { "1plus": 10, "6to12": 7, "3to6": 4, lt3: 1 }[answers.monthsWithEmployer]
    rawScore += tenurePoints
    if (answers.monthsWithEmployer === "1plus") addReason(reasonCodes, "tenure_1plus", tenurePoints)
    if (answers.monthsWithEmployer === "6to12") addReason(reasonCodes, "tenure_6to12", tenurePoints)
    if (answers.monthsWithEmployer === "3to6") addReason(reasonCodes, "tenure_3to6", tenurePoints)

    const providedWagePoints = wagePoints(answers.hourlyWage)
    rawScore += providedWagePoints
    addReason(reasonCodes, "wage_provided", providedWagePoints)

    const ruralBasePoints =
      answers.ruralJobLocation === "yes" ? 10 : answers.ruralJobLocation === "not_sure" ? 5 : 0
    const ruralPoints = roundPoints(ruralBasePoints * profile.ruralMultiplier)
    rawScore += ruralPoints
    addReason(reasonCodes, "rural_match", ruralPoints)

    const institutionBasePoints =
      answers.institutionType === "public" ? 10 : answers.institutionType === "private" ? 2 : 4
    const institutionPoints = roundPoints(institutionBasePoints * profile.institutionMultiplier)
    rawScore += institutionPoints
    if (answers.institutionType === "public") addReason(reasonCodes, "institution_public", institutionPoints)
    if (answers.institutionType !== "public") {
      addReason(reasonCodes, "institution_private_or_unsure", institutionPoints)
    }

    const programLengthPoints =
      answers.programAtLeast8Months === "yes" ? 8 : answers.programAtLeast8Months === "not_sure" ? 4 : 0
    rawScore += programLengthPoints
    addReason(reasonCodes, "program_8_months", programLengthPoints)

    const recentGradPoints =
      answers.graduatedWithin3Years === "yes" ? roundPoints(8 * profile.recentGradMultiplier) : 0
    rawScore += recentGradPoints
    addReason(reasonCodes, "recent_graduate", recentGradPoints)

    const outsideMajorBasePoints =
      answers.willingOutsideMajorCities === "yes"
        ? 10
        : answers.willingOutsideMajorCities === "maybe"
          ? 5
          : 0
    const outsideMajorPoints = roundPoints(outsideMajorBasePoints * profile.outsideMajorMultiplier)
    rawScore += outsideMajorPoints
    addReason(reasonCodes, "outside_major_cities", outsideMajorPoints)

    const committedPoints = { yes: 8, unsure: 4, no: 0 }[answers.committedToResideProvince]
    rawScore += committedPoints
    addReason(reasonCodes, "committed_to_reside", committedPoints)

    const occupationPoints = answers.occupationRegulated === "no" ? 5 : 0
    rawScore += occupationPoints
    addReason(reasonCodes, "occupation_not_regulated", occupationPoints)

    const licensurePoints =
      answers.occupationRegulated === "yes"
        ? answers.licensureStatus === "yes"
          ? 6
          : answers.licensureStatus === "in_progress"
            ? 3
            : 0
        : 0
    rawScore += licensurePoints
    addReason(reasonCodes, "licensure_ready", licensurePoints)

    const priorNominationPoints = answers.priorNomination === "no" ? 4 : 0
    rawScore += priorNominationPoints
    addReason(reasonCodes, "first_nomination", priorNominationPoints)

    if (answers.priorPNPRefusal === "yes") {
      rawScore += -5
      reasonCodes.add("prior_refusal_penalty")
    } else {
      rawScore += 3
      addReason(reasonCodes, "no_prior_refusal", 3)
    }

    const settlementBasePoints =
      answers.settlementFunds === "yes" ? 6 : answers.settlementFunds === "not_sure" ? 3 : 0
    const settlementPoints = roundPoints(settlementBasePoints * profile.settlementMultiplier)
    rawScore += settlementPoints
    addReason(reasonCodes, "settlement_funds_ready", settlementPoints)

    const frenchPoints =
      answers.frenchIntermediatePlus === "yes" ? roundPoints(10 * profile.frenchMultiplier) : 0
    rawScore += frenchPoints
    addReason(reasonCodes, "french_boost", frenchPoints)

    const prioritySectorBasePoints =
      answers.prioritySectorEmployer === "yes"
        ? 8
        : answers.prioritySectorEmployer === "not_sure"
          ? 4
          : 0
    const prioritySectorPoints = roundPoints(prioritySectorBasePoints * profile.prioritySectorMultiplier)
    rawScore += prioritySectorPoints
    addReason(reasonCodes, "priority_sector", prioritySectorPoints)

    const normalizedScore = Math.max(
      0,
      Math.min(100, Math.round((rawScore / NORMALIZATION_DENOMINATOR) * 100)),
    )
    const topReasons = Array.from(reasonCodes)
      .map((reason) => REASON_BULLETS[reason])
      .slice(0, 6)
    if (
      reasonCodes.has("prior_refusal_penalty") &&
      !topReasons.includes(REASON_BULLETS.prior_refusal_penalty)
    ) {
      topReasons[topReasons.length >= 6 ? 5 : topReasons.length] = REASON_BULLETS.prior_refusal_penalty
    }

    return {
      provinceCode: profile.code,
      provinceName: profile.name,
      alignmentScore: normalizedScore,
      alignmentLabel: scoreLabel(normalizedScore),
      whyBullets: topReasons,
      whatToConfirmNext: buildWhatToConfirmNext(answers, profile),
      riskFlags: buildRiskFlags(answers),
    } satisfies ProvinceRecommendation
  })

  return recommendations.sort((a, b) => {
    if (b.alignmentScore !== a.alignmentScore) return b.alignmentScore - a.alignmentScore
    return a.provinceCode.localeCompare(b.provinceCode)
  })
}

export function topProvinceRecommendations(
  answers: ProvinceFinderAnswers,
  count = 3,
): ProvinceRecommendation[] {
  return computeProvinceRecommendations(answers).slice(0, Math.max(1, count))
}

export function formatProvinceShortlistSummary(recommendations: ProvinceRecommendation[]): string {
  if (recommendations.length === 0) return ""
  const shortlist = recommendations.slice(0, 3)
  return shortlist
    .map((item) => `${item.provinceCode} (${shortLabel(item.alignmentLabel)})`)
    .join(", ")
}
