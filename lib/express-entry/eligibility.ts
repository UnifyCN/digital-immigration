import { addYears } from "date-fns"
import { isCanadaCountry } from "../canada-helpers.ts"
import type {
  AssessmentData,
  EducationCredential,
  EducationLevel,
  WorkRole,
} from "../types.ts"
import {
  CEC_MIN_HOURS,
  ECA_VALIDITY_YEARS,
  EXPRESS_ENTRY_RULES_VERSION,
  FST_MIN_HOURS,
  FSW_MIN_HOURS,
  FSW_PASS_MARK,
  WORK_WINDOW_YEARS,
} from "./rules.ts"
import { derivePrimaryClb } from "./clb.ts"
import { toMissingFieldRef, uniqueMissingFields } from "./missing-fields.ts"
import type {
  ExpressEntryEligibilityResult,
  MissingFieldRef,
  ProgramEligibilityResult,
  ProgramEligibilityStatus,
} from "./types.ts"
import {
  hasContinuousCountableYear,
  isCanadianRole,
  isSkilledTeer,
  normalizeWorkHours,
} from "./work-normalization.ts"

function parseDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function yearsFromHours(hours: number): number {
  return Math.floor(hours / 1560)
}

function levelRank(level: EducationLevel | ""): number {
  switch (level) {
    case "none":
      return 0
    case "high-school":
      return 1
    case "one-year-diploma":
      return 2
    case "two-year-diploma":
      return 3
    case "bachelors":
      return 4
    case "two-or-more-degrees":
      return 5
    case "masters":
      return 6
    case "phd":
      return 7
    default:
      return -1
  }
}

function fswEducationPoints(level: EducationLevel | ""): number {
  switch (level) {
    case "phd":
      return 25
    case "masters":
      return 23
    case "two-or-more-degrees":
      return 22
    case "bachelors":
      return 21
    case "two-year-diploma":
      return 19
    case "one-year-diploma":
      return 15
    case "high-school":
      return 5
    default:
      return 0
  }
}

function fswExperiencePoints(years: number): number {
  if (years >= 6) return 15
  if (years >= 4) return 13
  if (years >= 2) return 11
  if (years >= 1) return 9
  return 0
}

function fswLanguagePoints(minClb: number): number {
  if (minClb >= 9) return 24
  if (minClb === 8) return 20
  if (minClb === 7) return 16
  return 0
}

function fswAgePoints(dateOfBirth: string, asOfDate: Date): number {
  const birth = parseDate(dateOfBirth)
  if (!birth) return 0

  let age = asOfDate.getUTCFullYear() - birth.getUTCFullYear()
  const monthDiff = asOfDate.getUTCMonth() - birth.getUTCMonth()
  const dayDiff = asOfDate.getUTCDate() - birth.getUTCDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  if (age < 18) return 0
  if (age <= 35) return 12
  if (age === 36) return 11
  if (age === 37) return 10
  if (age === 38) return 9
  if (age === 39) return 8
  if (age === 40) return 7
  if (age === 41) return 6
  if (age === 42) return 5
  if (age === 43) return 4
  if (age === 44) return 3
  if (age === 45) return 2
  if (age === 46) return 1
  return 0
}

function spouseAccompanying(profile: AssessmentData): boolean {
  return profile.spouseAccompanying === "yes-accompanying"
}

function bestEducationLevel(profile: AssessmentData): EducationLevel | "" {
  const fromCredentials = (profile.educationCredentials ?? [])
    .map((credential) => credential.level)
    .filter((level): level is EducationLevel => Boolean(level && level !== ""))
    .sort((a, b) => levelRank(b) - levelRank(a))[0]

  if (fromCredentials) return fromCredentials
  return profile.educationLevel
}

function toLegacyRole(profile: AssessmentData): WorkRole | null {
  if (!profile.currentJobTitle.trim() && !profile.countryOfWork.trim()) return null

  return {
    id: "legacy-primary-role",
    noc2021Code: "",
    teer: "",
    title: profile.currentJobTitle,
    employerName: profile.jobOfferEmployerName,
    country: profile.countryOfWork,
    province: profile.currentJobProvinceTerritory,
    city: profile.jobOfferCity,
    startDate: profile.mostRecentJobStart ? `${profile.mostRecentJobStart}-01` : "",
    endDate: profile.mostRecentJobPresent ? "" : profile.mostRecentJobEnd ? `${profile.mostRecentJobEnd}-01` : "",
    present: profile.mostRecentJobPresent,
    hoursPerWeek: profile.hoursPerWeekRange === "30plus" ? 30 : profile.hoursPerWeekRange === "15-29" ? 20 : null,
    hoursVaried: profile.hoursPerWeekRange === "varies-not-sure",
    paid: profile.paidWorkStatus === "yes",
    employmentType:
      profile.employmentType === "employee"
        ? "employee"
        : profile.employmentType === "self-employed-contractor"
          ? "self-employed"
          : "",
    isSkilledTradeRole: profile.occupationCategory === "trades",
    wasAuthorizedInCanada:
      profile.canadianWorkAuthorizedAll === "yes"
        ? "yes"
        : profile.canadianWorkAuthorizedAll === "no"
          ? "no"
          : "",
    authorizationType: "",
    authorizationValidFrom: "",
    authorizationValidTo: "",
    wasFullTimeStudent: "",
    physicallyInCanada: isCanadaCountry(profile.countryOfWork) ? "yes" : "",
    hasOverlapWithOtherRoles:
      profile.hasOverlappingPeriods === "yes"
        ? "yes"
        : profile.hasOverlappingPeriods === "no"
          ? "no"
          : "",
  }
}

function getWorkRoles(profile: AssessmentData): WorkRole[] {
  if (profile.workRoles?.length) {
    return profile.workRoles
  }

  const legacy = toLegacyRole(profile)
  return legacy ? [legacy] : []
}

function hasCompleteRoleIdentity(role: WorkRole): boolean {
  return Boolean(role.noc2021Code && role.teer && role.startDate && (role.present || role.endDate) && role.hoursPerWeek !== null)
}

function hasValidEca(credential: EducationCredential, asOfDate: Date): boolean {
  if (credential.isCanadianCredential === "yes") return true
  const issueDate = parseDate(credential.ecaIssueDate)
  if (!issueDate || !credential.ecaEquivalency) return false
  return addYears(issueDate, ECA_VALIDITY_YEARS) > asOfDate
}

function fundsExempt(profile: AssessmentData): boolean {
  return profile.fundsExemptByValidJobOffer === "yes" || profile.currentlyWorkingInCanada === "yes"
}

function hasFunds(profile: AssessmentData): boolean {
  return (profile.settlementFundsCad ?? 0) > 0
}

function clbMinimum(clb: { listening: number | null; reading: number | null; writing: number | null; speaking: number | null }): number {
  if (Object.values(clb).some((value) => value === null)) return 0
  return Math.min(clb.listening as number, clb.reading as number, clb.writing as number, clb.speaking as number)
}

function programResult(status: ProgramEligibilityStatus, reasons: string[], missingKeys: string[]): ProgramEligibilityResult {
  return {
    status,
    reasons,
    missingFields: uniqueMissingFields(missingKeys),
  }
}

function checkLanguageForProfile(profile: AssessmentData, minimumByAbility: { listening: number; reading: number; writing: number; speaking: number }, asOfDate: Date): {
  ok: boolean
  reasons: string[]
  missingKeys: string[]
  minClb: number
} {
  const clbResult = derivePrimaryClb(profile, asOfDate)
  const reasons: string[] = []
  const missingKeys: string[] = []

  if (!clbResult.isValid) {
    const validityReason = clbResult.validityReason ?? "Language results are incomplete or invalid."
    const isExpired = validityReason.toLowerCase().includes("expired")
    const isWrongStream = validityReason.toLowerCase().includes("stream")
    if (isExpired || isWrongStream) {
      reasons.push(validityReason)
      return { ok: false, reasons, missingKeys, minClb: 0 }
    }

    const hasTestType = profile.languageTests?.[0]?.testType || profile.englishTestType
    const hasDate = profile.languageTests?.[0]?.testDate
    if (!hasTestType) missingKeys.push("language.primary.type")
    if (!hasDate) missingKeys.push("language.primary.date")
    if (!(profile.languageTests?.[0]?.stream || profile.englishTestType)) missingKeys.push("language.primary.stream")
    missingKeys.push("language.primary.scores")
    reasons.push(validityReason)
    return { ok: false, reasons, missingKeys, minClb: 0 }
  }

  const clb = clbResult.clb
  const listening = clb.listening ?? 0
  const reading = clb.reading ?? 0
  const writing = clb.writing ?? 0
  const speaking = clb.speaking ?? 0

  if (
    listening < minimumByAbility.listening ||
    reading < minimumByAbility.reading ||
    writing < minimumByAbility.writing ||
    speaking < minimumByAbility.speaking
  ) {
    reasons.push(
      `Language results are below required thresholds (L${minimumByAbility.listening}/R${minimumByAbility.reading}/W${minimumByAbility.writing}/S${minimumByAbility.speaking}).`,
    )
    return { ok: false, reasons, missingKeys, minClb: clbMinimum(clb) }
  }

  return { ok: true, reasons, missingKeys, minClb: clbMinimum(clb) }
}

export function checkCEC(profile: AssessmentData, asOfDate: Date = new Date()): ProgramEligibilityResult {
  const roles = getWorkRoles(profile)
  const reasons: string[] = []
  const missingKeys: string[] = []

  if (!roles.length) {
    missingKeys.push("work.roles")
    reasons.push("Detailed work role history is needed to assess CEC eligibility.")
    return programResult("needs_more_info", reasons, missingKeys)
  }

  for (const role of roles) {
    if (!role.noc2021Code) missingKeys.push("work.roles.noc")
    if (!role.teer) missingKeys.push("work.roles.teer")
    if (!role.startDate || (!role.present && !role.endDate)) missingKeys.push("work.roles.dates")
    if (role.hoursPerWeek === null) missingKeys.push("work.roles.hours")
    if (isCanadianRole(role) && (!role.wasAuthorizedInCanada || !role.wasFullTimeStudent || !role.physicallyInCanada)) {
      missingKeys.push("work.roles.authorization")
    }
  }

  if (missingKeys.length > 0) {
    reasons.push("Some Canadian work role details are missing for CEC assessment.")
    return programResult("needs_more_info", reasons, missingKeys)
  }

  const qualifyingRoles = roles.filter((role) => {
    if (!isCanadianRole(role)) return false
    if (!isSkilledTeer(role.teer)) return false
    if (!role.paid) return false
    if (role.employmentType !== "employee") return false
    if (role.wasAuthorizedInCanada !== "yes") return false
    if (role.wasFullTimeStudent === "yes") return false
    if (role.physicallyInCanada !== "yes") return false
    return true
  })

  if (!qualifyingRoles.length) {
    reasons.push("No qualifying Canadian skilled work periods were identified for CEC.")
    return programResult("ineligible", reasons, missingKeys)
  }

  const languageRequirement = qualifyingRoles.some((role) => role.teer === "0" || role.teer === "1")
    ? { listening: 7, reading: 7, writing: 7, speaking: 7 }
    : { listening: 5, reading: 5, writing: 5, speaking: 5 }

  const language = checkLanguageForProfile(profile, languageRequirement, asOfDate)
  reasons.push(...language.reasons)
  missingKeys.push(...language.missingKeys)
  if (!language.ok) {
    const status: ProgramEligibilityStatus = language.missingKeys.length > 0 ? "needs_more_info" : "ineligible"
    return programResult(status, reasons, missingKeys)
  }

  const normalized = normalizeWorkHours(qualifyingRoles, {
    asOfDate,
    windowYears: WORK_WINDOW_YEARS.cec,
  })

  if (normalized.totalHours < CEC_MIN_HOURS) {
    reasons.push(`CEC requires at least ${CEC_MIN_HOURS} countable hours in the last 3 years.`)
    return programResult("ineligible", reasons, missingKeys)
  }

  reasons.push("Meets Canadian Experience Class work and language minimums.")
  return programResult("eligible", reasons, missingKeys)
}

export function checkFSW(profile: AssessmentData, asOfDate: Date = new Date()): ProgramEligibilityResult & {
  fsw67Score?: number
  fsw67PassThreshold?: number
  fsw67Breakdown?: {
    language: number
    education: number
    experience: number
    age: number
    arrangedEmployment: number
    adaptability: number
  }
} {
  const roles = getWorkRoles(profile)
  const reasons: string[] = []
  const missingKeys: string[] = []

  if (!roles.length) {
    missingKeys.push("work.roles")
    reasons.push("Detailed work role history is needed to assess FSW eligibility.")
    return { ...programResult("needs_more_info", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  for (const role of roles) {
    if (!role.noc2021Code) missingKeys.push("work.roles.noc")
    if (!role.teer) missingKeys.push("work.roles.teer")
    if (!role.startDate || (!role.present && !role.endDate)) missingKeys.push("work.roles.dates")
    if (role.hoursPerWeek === null) missingKeys.push("work.roles.hours")
  }

  const language = checkLanguageForProfile(
    profile,
    { listening: 7, reading: 7, writing: 7, speaking: 7 },
    asOfDate,
  )
  reasons.push(...language.reasons)
  missingKeys.push(...language.missingKeys)

  const educationLevel = bestEducationLevel(profile)
  if (!educationLevel) {
    missingKeys.push("education.credentials")
  }

  const credentials = profile.educationCredentials ?? []
  const hasForeignCredential = credentials.some((credential) => credential.isCanadianCredential === "no")
  if (hasForeignCredential) {
    const hasValidForeignEca = credentials.some((credential) => hasValidEca(credential, asOfDate))
    if (!hasValidForeignEca) {
      missingKeys.push("education.eca.issueDate")
      missingKeys.push("education.eca.equivalency")
      reasons.push("Foreign education requires a valid ECA for FSW assessment.")
    }
  } else if (!credentials.length && !isCanadaCountry(profile.educationCountry)) {
    if (profile.ecaValid !== "yes") {
      missingKeys.push("education.eca.issueDate")
      missingKeys.push("education.eca.equivalency")
      reasons.push("Foreign education ECA details are missing.")
    }
  }

  const skilledRoles = roles.filter((role) => isSkilledTeer(role.teer) && role.paid)
  const normalizedSkilled = normalizeWorkHours(skilledRoles, {
    asOfDate,
    windowYears: WORK_WINDOW_YEARS.fsw,
  })
  const hasContinuousYear = hasContinuousCountableYear(normalizedSkilled)

  if (missingKeys.length > 0) {
    reasons.push("Some required data for FSW assessment is missing.")
    return { ...programResult("needs_more_info", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  if (!language.ok) {
    return { ...programResult("ineligible", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  if (!hasContinuousYear || normalizedSkilled.totalHours < FSW_MIN_HOURS) {
    reasons.push("FSW requires at least one continuous year of skilled paid work in the last 10 years.")
    return { ...programResult("ineligible", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  if (educationLevel === "none") {
    reasons.push("FSW requires at least secondary education.")
    return { ...programResult("ineligible", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  if (!fundsExempt(profile)) {
    if (profile.fundsFamilySize === null || profile.fundsFamilySize === undefined) {
      missingKeys.push("funds.familySize")
    }
    if (!hasFunds(profile)) {
      if (profile.settlementFundsCad === null || profile.settlementFundsCad === undefined) {
        missingKeys.push("funds.available")
      } else {
        reasons.push("Settlement funds appear insufficient or missing for FSW.")
      }
    }
  }

  if (missingKeys.length > 0) {
    reasons.push("Proof-of-funds details are incomplete for FSW.")
    return { ...programResult("needs_more_info", reasons, missingKeys), fsw67PassThreshold: FSW_PASS_MARK }
  }

  const languagePoints = fswLanguagePoints(language.minClb)
  const educationPoints = fswEducationPoints(educationLevel)
  const experiencePoints = fswExperiencePoints(yearsFromHours(normalizedSkilled.totalHours))
  const agePoints = fswAgePoints(profile.dateOfBirth, asOfDate)
  const arrangedEmployment = profile.jobOfferMeetsValidOfferDefinition === "yes" ? 10 : 0

  let adaptability = 0
  if (profile.hasEligibleSiblingInCanada === "yes" && profile.siblingAge18OrOlder === "yes" && profile.siblingLivesInCanada === "yes") {
    adaptability += 5
  }
  if (spouseAccompanying(profile)) {
    const spouseScores = profile.spouseLanguageScores
    if (!spouseScores.listening || !spouseScores.reading || !spouseScores.writing || !spouseScores.speaking) {
      missingKeys.push("spouse.language")
    } else {
      adaptability += 5
    }

    if (!profile.spouseEducationLevel) {
      missingKeys.push("spouse.education")
    }
  }

  adaptability = Math.min(10, adaptability)

  if (missingKeys.length > 0) {
    reasons.push("Spouse details are required to finalize FSW adaptability points.")
    return {
      ...programResult("needs_more_info", reasons, missingKeys),
      fsw67PassThreshold: FSW_PASS_MARK,
      fsw67Breakdown: {
        language: languagePoints,
        education: educationPoints,
        experience: experiencePoints,
        age: agePoints,
        arrangedEmployment,
        adaptability,
      },
    }
  }

  const score = languagePoints + educationPoints + experiencePoints + agePoints + arrangedEmployment + adaptability
  if (score < FSW_PASS_MARK) {
    reasons.push(`FSW 67-point grid score is ${score}, below the pass mark of ${FSW_PASS_MARK}.`)
    return {
      ...programResult("ineligible", reasons, missingKeys),
      fsw67Score: score,
      fsw67PassThreshold: FSW_PASS_MARK,
      fsw67Breakdown: {
        language: languagePoints,
        education: educationPoints,
        experience: experiencePoints,
        age: agePoints,
        arrangedEmployment,
        adaptability,
      },
    }
  }

  reasons.push(`Meets FSW minimum criteria and 67-point grid (${score}/${FSW_PASS_MARK}).`)
  return {
    ...programResult("eligible", reasons, missingKeys),
    fsw67Score: score,
    fsw67PassThreshold: FSW_PASS_MARK,
    fsw67Breakdown: {
      language: languagePoints,
      education: educationPoints,
      experience: experiencePoints,
      age: agePoints,
      arrangedEmployment,
      adaptability,
    },
  }
}

export function checkFST(profile: AssessmentData, asOfDate: Date = new Date()): ProgramEligibilityResult {
  const roles = getWorkRoles(profile)
  const reasons: string[] = []
  const missingKeys: string[] = []

  if (!roles.length) {
    missingKeys.push("work.roles")
    reasons.push("Detailed work role history is needed to assess FST eligibility.")
    return programResult("needs_more_info", reasons, missingKeys)
  }

  for (const role of roles) {
    if (!role.noc2021Code) missingKeys.push("work.roles.noc")
    if (!role.startDate || (!role.present && !role.endDate)) missingKeys.push("work.roles.dates")
    if (role.hoursPerWeek === null) missingKeys.push("work.roles.hours")
  }

  const skilledTradeRoles = roles.filter((role) => role.isSkilledTradeRole && (role.teer === "2" || role.teer === "3") && role.paid)

  if (!skilledTradeRoles.length) {
    if (profile.isSkilledTrade === "yes") {
      reasons.push("Skilled trade roles are not fully mapped yet.")
      missingKeys.push("work.roles")
      return programResult("needs_more_info", reasons, missingKeys)
    }

    reasons.push("No eligible skilled trade work periods identified for FST.")
    return programResult("ineligible", reasons, missingKeys)
  }

  const language = checkLanguageForProfile(
    profile,
    { listening: 5, reading: 4, writing: 4, speaking: 5 },
    asOfDate,
  )
  reasons.push(...language.reasons)
  missingKeys.push(...language.missingKeys)
  if (!language.ok) {
    const status: ProgramEligibilityStatus = language.missingKeys.length > 0 ? "needs_more_info" : "ineligible"
    return programResult(status, reasons, missingKeys)
  }

  const normalized = normalizeWorkHours(skilledTradeRoles, {
    asOfDate,
    windowYears: WORK_WINDOW_YEARS.fst,
  })

  if (normalized.totalHours < FST_MIN_HOURS) {
    reasons.push(`FST requires ${FST_MIN_HOURS} countable skilled-trade hours in the last 5 years.`)
    return programResult("ineligible", reasons, missingKeys)
  }

  const hasOffer = profile.jobOfferMeetsValidOfferDefinition === "yes"
  const hasCertificate = profile.hasCanadianTradeCertificate === "yes"
  if (!hasOffer && !hasCertificate) {
    if (profile.hasCanadianTradeCertificate === "" && profile.jobOfferMeetsValidOfferDefinition === "") {
      missingKeys.push("fst.offerOrCert")
      reasons.push("FST needs either a valid job offer or Canadian certificate of qualification.")
      return programResult("needs_more_info", reasons, missingKeys)
    }

    reasons.push("FST requires either a valid job offer or a Canadian certificate of qualification.")
    return programResult("ineligible", reasons, missingKeys)
  }

  if (hasOffer && profile.jobOfferMeetsValidOfferDefinition === "yes") {
    if (!profile.jobOfferSupportType || !profile.jobOfferNonSeasonal) {
      missingKeys.push("jobOffer.validity")
      reasons.push("Additional job offer validity details are required.")
      return programResult("needs_more_info", reasons, missingKeys)
    }
  }

  if (!fundsExempt(profile)) {
    if (profile.fundsFamilySize === null || profile.fundsFamilySize === undefined) {
      missingKeys.push("funds.familySize")
    }
    if (profile.settlementFundsCad === null || profile.settlementFundsCad === undefined) {
      missingKeys.push("funds.available")
    }
  }

  if (missingKeys.length > 0) {
    reasons.push("Some required details are missing for FST assessment.")
    return programResult("needs_more_info", reasons, missingKeys)
  }

  reasons.push("Meets Federal Skilled Trades minimum requirements.")
  return programResult("eligible", reasons, missingKeys)
}

function mergeReasons(
  cec: ProgramEligibilityResult,
  fsw: ProgramEligibilityResult,
  fst: ProgramEligibilityResult,
): string[] {
  const lines: string[] = []
  lines.push(`CEC: ${cec.status.replaceAll("_", " ")}`)
  lines.push(`FSW: ${fsw.status.replaceAll("_", " ")}`)
  lines.push(`FST: ${fst.status.replaceAll("_", " ")}`)
  return lines
}

function overallStatusForPrograms(statuses: ProgramEligibilityStatus[]): ProgramEligibilityStatus {
  if (statuses.includes("eligible")) return "eligible"
  if (statuses.includes("needs_more_info")) return "needs_more_info"
  return "ineligible"
}

export function computeExpressEntryEligibility(
  profile: AssessmentData,
  asOfDate: Date = new Date(),
): ExpressEntryEligibilityResult {
  const cec = checkCEC(profile, asOfDate)
  const fsw = checkFSW(profile, asOfDate)
  const fst = checkFST(profile, asOfDate)

  const statuses: ProgramEligibilityStatus[] = [cec.status, fsw.status, fst.status]
  const overallStatus = overallStatusForPrograms(statuses)

  const missingFields = uniqueMissingFields([
    ...cec.missingFields.map((field) => field.key),
    ...fsw.missingFields.map((field) => field.key),
    ...fst.missingFields.map((field) => field.key),
  ])

  return {
    rulesVersion: EXPRESS_ENTRY_RULES_VERSION,
    overallStatus,
    programs: {
      cec,
      fsw,
      fst,
    },
    missingFields,
    reasons: mergeReasons(cec, fsw, fst),
  }
}

export function getExpressEntryMissingFieldLinks(result: ExpressEntryEligibilityResult): MissingFieldRef[] {
  return result.missingFields.length
    ? result.missingFields
    : [toMissingFieldRef("work.roles")]
}
