import { addYears } from "date-fns"
import type { AssessmentData, EducationCredential, EducationLevel } from "../../types"
import { deriveClbFromScores } from "../../express-entry/clb.ts"
import { buildFollowUpQuestions } from "./followUpQuestions.ts"
import { deriveTeerFromNocCode, isEligibleFstTradeNoc, isValidNocCode } from "./nocLookup.ts"
import { hasContinuousYearForRole, summarizeHours } from "./workHours.ts"
import type {
  CandidateProfile,
  ExpressEntryStreamsResult,
  FundsRequirementDecision,
  ProgramCheckResult,
  ProgramCheckStatus,
  StreamProgram,
} from "./types.ts"

const RULESET_DATE = "2026-02-24"
const CEC_MIN_HOURS = 1560
const FSW_MIN_HOURS = 1560
const FST_MIN_HOURS = 3120
const FSW_PASS_MARK = 67

const APPROVED_LANGUAGE_TEST_TYPES = new Set([
  "ielts-general-training",
  "celpip-general",
  "tef-canada",
  "tcf-canada",
  "pte-core",
])

function isCanada(country: string): boolean {
  const normalized = country.trim().toLowerCase()
  return normalized === "canada" || normalized === "ca" || normalized === "can"
}

function isUnknown(value: string): boolean {
  return !value || value === "not-sure" || value === "unsure"
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isSkilledTeer(teer: string): boolean {
  return teer === "0" || teer === "1" || teer === "2" || teer === "3"
}

function minClb(values: { listening: number | null; reading: number | null; writing: number | null; speaking: number | null }): number {
  if (Object.values(values).some((value) => value === null)) return 0
  return Math.min(values.listening as number, values.reading as number, values.writing as number, values.speaking as number)
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function toResult(status: ProgramCheckStatus, reasons: string[], missingFields: string[], evidence: Array<{ key: string; value: unknown }> = []): ProgramCheckResult {
  return {
    status,
    reasons: unique(reasons),
    missingFields: unique(missingFields),
    evidence,
  }
}

function resolveRoleTeer(role: CandidateProfile["workRoles"][number]): string {
  if (role.teer) return role.teer
  return deriveTeerFromNocCode(role.nocCode) ?? ""
}

function normalizeLanguageTest(raw: AssessmentData): CandidateProfile["language"] {
  const primary = (raw.languageTests ?? []).find((test) => test?.isPrimary) ?? raw.languageTests?.[0]
  if (primary) {
    return {
      testType: primary.testType ?? "",
      stream: primary.stream ?? "",
      testDate: primary.testDate ?? "",
      scores: {
        listening: primary.scores?.listening ?? "",
        reading: primary.scores?.reading ?? "",
        writing: primary.scores?.writing ?? "",
        speaking: primary.scores?.speaking ?? "",
      },
    }
  }

  return {
    testType: raw.englishTestType || raw.frenchTestType || "",
    stream: "",
    testDate: "",
    scores: {
      listening: raw.languageScores?.listening ?? "",
      reading: raw.languageScores?.reading ?? "",
      writing: raw.languageScores?.writing ?? "",
      speaking: raw.languageScores?.speaking ?? "",
    },
  }
}

export function buildProfileFromAnswers(rawAnswers: AssessmentData, asOfDate: Date = new Date()): CandidateProfile {
  const roles = (rawAnswers.workRoles ?? []).map((role) => ({
    id: role.id,
    nocCode: role.noc2021Code?.trim() ?? "",
    teer: role.teer ?? "",
    nocDutiesMatchConfirmed: role.nocDutiesMatchConfirmed === true,
    country: role.country?.trim() ?? "",
    startDate: role.startDate ?? "",
    endDate: role.endDate ?? "",
    present: role.present === true,
    hoursPerWeek: role.hoursPerWeek ?? null,
    paid: typeof role.paid === "boolean" ? role.paid : null,
    employmentType: role.employmentType ?? "",
    wasAuthorizedInCanada: role.wasAuthorizedInCanada ?? "",
    wasFullTimeStudent: role.wasFullTimeStudent ?? "",
    physicallyInCanada: role.physicallyInCanada ?? "",
    title: role.title ?? "",
    employerName: role.employerName ?? "",
    qualifiedToPracticeInCountry: role.qualifiedToPracticeInCountry ?? "",
  }))

  const offers = (rawAnswers.fstJobOfferEmployers ?? []).slice(0, 2).map((offer) => ({
    id: offer.id,
    employerName: offer.employerName ?? "",
    province: offer.province ?? "",
    noc2021Code: offer.noc2021Code ?? "",
    paid: offer.paid ?? "",
    fullTime: offer.fullTime ?? "",
    continuous: offer.continuous ?? "",
    nonSeasonal: offer.nonSeasonal ?? "",
    hoursPerWeek: offer.hoursPerWeek ?? null,
    durationMonths: offer.durationMonths ?? null,
  }))

  return {
    asOfDate,
    source: rawAnswers,
    intentOutsideQuebec: rawAnswers.expressEntryIntentOutsideQuebec ?? "",
    currentlyAuthorizedToWorkInCanada: rawAnswers.currentlyAuthorizedToWorkInCanada ?? "",
    fswPrimaryOccupationRoleId: rawAnswers.fswPrimaryOccupationRoleId ?? "",
    fundsFamilySize: rawAnswers.fundsFamilySize ?? null,
    settlementFundsCad: rawAnswers.settlementFundsCad ?? null,
    fundsExemptByValidJobOffer: rawAnswers.fundsExemptByValidJobOffer ?? "",
    hasCanadianTradeCertificate: rawAnswers.hasCanadianTradeCertificate ?? "",
    tradeCertificateIssuingAuthority: rawAnswers.tradeCertificateIssuingAuthority ?? "",
    tradeCertificateTrade: rawAnswers.tradeCertificateTrade ?? "",
    tradeCertificateIssueDate: rawAnswers.tradeCertificateIssueDate ?? "",
    jobOfferMeetsValidOfferDefinition: rawAnswers.jobOfferMeetsValidOfferDefinition ?? "",
    language: normalizeLanguageTest(rawAnswers),
    workRoles: roles,
    fstJobOfferEmployers: offers,
  }
}

function evaluateQuebecGate(profile: CandidateProfile): { status: "ok" | "needs_more_info" | "ineligible"; missingFields: string[]; reason?: string } {
  if (isUnknown(profile.intentOutsideQuebec)) {
    return {
      status: "needs_more_info",
      missingFields: ["shared.intentOutsideQuebec"],
      reason: "We need your intent to live outside Quebec to assess Express Entry streams.",
    }
  }

  if (profile.intentOutsideQuebec === "no") {
    return {
      status: "ineligible",
      missingFields: [],
      reason: "Express Entry requires intent to live outside Quebec.",
    }
  }

  return { status: "ok", missingFields: [] }
}

function evaluateLanguage(
  profile: CandidateProfile,
  minimum: { listening: number; reading: number; writing: number; speaking: number },
): {
  status: "ok" | "needs_more_info" | "ineligible"
  reason?: string
  missingFields: string[]
  minClb: number
} {
  const test = profile.language
  const missingFields: string[] = []

  if (!test.testType || !APPROVED_LANGUAGE_TEST_TYPES.has(test.testType)) {
    missingFields.push("language.primary.testType")
  }

  if (!test.testDate || !parseDate(test.testDate)) {
    missingFields.push("language.primary.testDate")
  }

  const streamRequired = test.testType === "ielts-general-training" ? "general" : "non-academic"
  if (!test.stream) {
    missingFields.push("language.primary.stream")
  } else if (test.testType === "ielts-general-training" && test.stream !== "general") {
    missingFields.push("language.primary.stream")
  } else if (streamRequired === "non-academic" && test.stream === "academic") {
    missingFields.push("language.primary.stream")
  }

  if (!test.scores.listening || !test.scores.reading || !test.scores.writing || !test.scores.speaking) {
    missingFields.push("language.primary.scores")
  }

  if (missingFields.length > 0) {
    return {
      status: "needs_more_info",
      reason: "Language test details must use an approved Express Entry test with valid stream, date, and scores.",
      missingFields,
      minClb: 0,
    }
  }

  const testDate = parseDate(test.testDate)
  if (!testDate) {
    return {
      status: "needs_more_info",
      reason: "Language test date is invalid.",
      missingFields: ["language.primary.testDate"],
      minClb: 0,
    }
  }

  if (addYears(testDate, 2) <= profile.asOfDate) {
    return {
      status: "ineligible",
      reason: "Language test results are older than 2 years and are not valid for Express Entry.",
      missingFields: [],
      minClb: 0,
    }
  }

  const clb = deriveClbFromScores(test.testType as never, test.scores)
  const min = minClb(clb)

  if (
    (clb.listening ?? 0) < minimum.listening ||
    (clb.reading ?? 0) < minimum.reading ||
    (clb.writing ?? 0) < minimum.writing ||
    (clb.speaking ?? 0) < minimum.speaking
  ) {
    return {
      status: "ineligible",
      reason: `Language results are below required minimums (L${minimum.listening}/R${minimum.reading}/W${minimum.writing}/S${minimum.speaking}).`,
      missingFields: [],
      minClb: min,
    }
  }

  return { status: "ok", missingFields: [], minClb: min }
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

function bestEducationLevel(raw: AssessmentData): EducationLevel | "" {
  const fromCredentials = (raw.educationCredentials ?? [])
    .map((credential) => credential.level)
    .filter((level): level is EducationLevel => Boolean(level && level !== ""))
    .sort((a, b) => levelRank(b) - levelRank(a))[0]

  if (fromCredentials) return fromCredentials
  return raw.educationLevel
}

function hasValidEca(credential: EducationCredential, asOfDate: Date): boolean {
  if (credential.isCanadianCredential === "yes") return true
  const issueDate = parseDate(credential.ecaIssueDate)
  if (!issueDate || !credential.ecaEquivalency) return false
  return addYears(issueDate, 5) > asOfDate
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

function fswLanguagePoints(minimum: number): number {
  if (minimum >= 9) return 24
  if (minimum === 8) return 20
  if (minimum === 7) return 16
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

function determineFundsRequirement(
  profile: CandidateProfile,
  hasValidOffer: boolean,
  offerMissingFieldKey: string,
): { decision: FundsRequirementDecision; missingFields: string[] } {
  if (profile.fundsExemptByValidJobOffer === "yes") {
    return { decision: "exempt", missingFields: [] }
  }

  if (profile.currentlyAuthorizedToWorkInCanada === "yes") {
    if (hasValidOffer) {
      return { decision: "exempt", missingFields: [] }
    }

    if (isUnknown(profile.jobOfferMeetsValidOfferDefinition)) {
      return {
        decision: "needs_more_info",
        missingFields: [offerMissingFieldKey],
      }
    }

    return { decision: "required", missingFields: [] }
  }

  if (isUnknown(profile.currentlyAuthorizedToWorkInCanada)) {
    return {
      decision: "needs_more_info",
      missingFields: ["auth.currentlyAuthorizedToWorkInCanada"],
    }
  }

  return { decision: "required", missingFields: [] }
}

function summarizeProgramMissing(status: ProgramCheckStatus, missingFields: string[]): ProgramCheckStatus {
  if (missingFields.length > 0) return "needs_more_info"
  return status
}

export function checkCEC(profile: CandidateProfile, asOfDate: Date = new Date()): ProgramCheckResult {
  const reasons: string[] = []
  const missingFields: string[] = []
  const evidence: Array<{ key: string; value: unknown }> = [{ key: "asOfDate", value: asOfDate.toISOString().slice(0, 10) }]

  const quebec = evaluateQuebecGate(profile)
  if (quebec.status === "needs_more_info") {
    if (quebec.reason) reasons.push(quebec.reason)
    return toResult("needs_more_info", reasons, quebec.missingFields, evidence)
  }
  if (quebec.status === "ineligible") {
    if (quebec.reason) reasons.push(quebec.reason)
    return toResult("ineligible", reasons, [], evidence)
  }

  const canadianRoles = profile.workRoles.filter((role) => isCanada(role.country))
  if (canadianRoles.length === 0) {
    const countryMissing = profile.workRoles.some((role) => !role.country)
    if (countryMissing) {
      const countryMissingFields = profile.workRoles
        .filter((role) => !role.country)
        .map((role) => `work.roles.${role.id}.country`)
      reasons.push("Complete country details for work roles to confirm Canadian experience for CEC.")
      return toResult("needs_more_info", reasons, countryMissingFields, evidence)
    }
    reasons.push("CEC requires qualifying Canadian work experience.")
    return toResult("ineligible", reasons, [], evidence)
  }

  for (const role of canadianRoles) {
    const teer = resolveRoleTeer(role)
    if (!role.country) missingFields.push(`work.roles.${role.id}.country`)
    if (!isValidNocCode(role.nocCode)) missingFields.push(`work.roles.${role.id}.nocCode`)
    if (!teer) missingFields.push(`work.roles.${role.id}.teer`)
    if (!role.nocDutiesMatchConfirmed) missingFields.push(`work.roles.${role.id}.nocDutiesMatchConfirmed`)
    if (!role.startDate) missingFields.push(`work.roles.${role.id}.startDate`)
    if (!role.present && !role.endDate) missingFields.push(`work.roles.${role.id}.endDate`)
    if (role.hoursPerWeek === null || role.hoursPerWeek === undefined) missingFields.push(`work.roles.${role.id}.hoursPerWeek`)
    if (role.paid === null) missingFields.push(`work.roles.${role.id}.paid`)
    if (!role.employmentType) missingFields.push(`work.roles.${role.id}.employmentType`)
    if (isUnknown(role.wasAuthorizedInCanada)) missingFields.push(`work.roles.${role.id}.wasAuthorizedInCanada`)
    if (isUnknown(role.wasFullTimeStudent)) missingFields.push(`work.roles.${role.id}.wasFullTimeStudent`)
    if (isUnknown(role.physicallyInCanada)) missingFields.push(`work.roles.${role.id}.physicallyInCanada`)
  }

  if (missingFields.length > 0) {
    reasons.push("Complete missing Canadian job details to confirm CEC eligibility.")
    return toResult("needs_more_info", reasons, missingFields, evidence)
  }

  const qualifying = canadianRoles.filter((role) => {
    const teer = resolveRoleTeer(role)
    return (
      isSkilledTeer(teer) &&
      role.paid &&
      role.employmentType === "employee" &&
      role.wasAuthorizedInCanada === "yes" &&
      role.wasFullTimeStudent === "no" &&
      role.physicallyInCanada === "yes"
    )
  })

  if (qualifying.length === 0) {
    reasons.push("No qualifying CEC work periods remain after authorization/student/self-employment checks.")
    return toResult("ineligible", reasons, [], evidence)
  }

  const languageMinimum = qualifying.some((role) => {
    const teer = resolveRoleTeer(role)
    return teer === "0" || teer === "1"
  })
    ? { listening: 7, reading: 7, writing: 7, speaking: 7 }
    : { listening: 5, reading: 5, writing: 5, speaking: 5 }

  const language = evaluateLanguage(profile, languageMinimum)
  if (language.status === "needs_more_info") {
    return toResult("needs_more_info", [language.reason ?? "Language details are required."], language.missingFields, evidence)
  }
  if (language.status === "ineligible") {
    return toResult("ineligible", [language.reason ?? "Language minimums are not met for CEC."], [], evidence)
  }

  const hours = summarizeHours(qualifying, asOfDate, 3)
  evidence.push({ key: "cec.countableHours", value: Math.round(hours.totalHours) })

  if (hours.totalHours < CEC_MIN_HOURS) {
    reasons.push("CEC requires at least 1,560 countable hours in the last 3 years.")
    return toResult("ineligible", reasons, [], evidence)
  }

  reasons.push("Meets CEC work and language minimum requirements.")
  return toResult("eligible", reasons, [], evidence)
}

export function checkFSW(profile: CandidateProfile, asOfDate: Date = new Date()): ProgramCheckResult {
  const reasons: string[] = []
  const missingFields: string[] = []
  const evidence: Array<{ key: string; value: unknown }> = [{ key: "asOfDate", value: asOfDate.toISOString().slice(0, 10) }]

  const quebec = evaluateQuebecGate(profile)
  if (quebec.status === "needs_more_info") {
    return toResult("needs_more_info", [quebec.reason ?? ""], quebec.missingFields, evidence)
  }
  if (quebec.status === "ineligible") {
    return toResult("ineligible", [quebec.reason ?? ""], [], evidence)
  }

  if (profile.workRoles.length === 0) {
    return toResult("needs_more_info", ["FSW requires detailed work history."], ["work.roles"], evidence)
  }

  for (const role of profile.workRoles) {
    const teer = resolveRoleTeer(role)
    if (!role.country) missingFields.push(`work.roles.${role.id}.country`)
    if (!isValidNocCode(role.nocCode)) missingFields.push(`work.roles.${role.id}.nocCode`)
    if (!teer) missingFields.push(`work.roles.${role.id}.teer`)
    if (!role.nocDutiesMatchConfirmed) missingFields.push(`work.roles.${role.id}.nocDutiesMatchConfirmed`)
    if (!role.startDate) missingFields.push(`work.roles.${role.id}.startDate`)
    if (!role.present && !role.endDate) missingFields.push(`work.roles.${role.id}.endDate`)
    if (role.hoursPerWeek === null || role.hoursPerWeek === undefined) missingFields.push(`work.roles.${role.id}.hoursPerWeek`)
    if (role.paid === null) missingFields.push(`work.roles.${role.id}.paid`)
    if (!role.employmentType) missingFields.push(`work.roles.${role.id}.employmentType`)
  }

  const language = evaluateLanguage(profile, { listening: 7, reading: 7, writing: 7, speaking: 7 })
  if (language.status === "needs_more_info") {
    missingFields.push(...language.missingFields)
  }

  const educationLevel = bestEducationLevel(profile.source)
  if (!educationLevel) {
    missingFields.push("education.credentials")
  }

  const credentials = profile.source.educationCredentials ?? []
  const hasForeignCredential = credentials.some((credential) => credential.isCanadianCredential === "no")
  if (hasForeignCredential) {
    const hasValidForeignEca = credentials.some((credential) => hasValidEca(credential, asOfDate))
    if (!hasValidForeignEca) {
      missingFields.push("education.eca.issueDate", "education.eca.equivalency")
    }
  }

  const skilledRoles = profile.workRoles.filter((role) => isSkilledTeer(resolveRoleTeer(role)) && role.paid)
  if (skilledRoles.length === 0) {
    if (missingFields.length > 0) {
      return toResult("needs_more_info", ["Complete missing skilled-work data for FSW."], missingFields, evidence)
    }
    return toResult("ineligible", ["FSW requires at least one skilled paid work role."], [], evidence)
  }

  if (skilledRoles.length > 1 && !profile.fswPrimaryOccupationRoleId) {
    missingFields.push("fsw.primaryOccupationRoleId")
  }

  const primaryRole = skilledRoles.find((role) => role.id === profile.fswPrimaryOccupationRoleId) ?? (skilledRoles.length === 1 ? skilledRoles[0] : null)
  if (!primaryRole) {
    missingFields.push("fsw.primaryOccupationRoleId")
  }

  if (missingFields.length > 0) {
    return toResult("needs_more_info", ["Additional details are required to finalize FSW checks."], missingFields, evidence)
  }

  if (language.status === "ineligible") {
    return toResult("ineligible", [language.reason ?? "FSW language minimums are not met."], [], evidence)
  }

  if (!primaryRole) {
    return toResult("needs_more_info", ["Select a primary occupation for FSW."], ["fsw.primaryOccupationRoleId"], evidence)
  }

  const primaryHours = summarizeHours([primaryRole], asOfDate, 10)
  evidence.push({ key: "fsw.primaryRoleId", value: primaryRole.id })
  evidence.push({ key: "fsw.primaryRoleHours", value: Math.round(primaryHours.totalHours) })

  if (!hasContinuousYearForRole(primaryRole, asOfDate) || primaryHours.totalHours < FSW_MIN_HOURS) {
    return toResult(
      "ineligible",
      ["FSW requires at least 1 continuous year of paid skilled work in one primary occupation."],
      [],
      evidence,
    )
  }

  if (educationLevel === "none") {
    return toResult("ineligible", ["FSW requires at least secondary education."], [], evidence)
  }

  const hasValidOffer = profile.jobOfferMeetsValidOfferDefinition === "yes"
  const fundsDecision = determineFundsRequirement(profile, hasValidOffer, "jobOffer.validity")
  evidence.push({ key: "fsw.fundsRequirement", value: fundsDecision.decision })

  if (fundsDecision.decision === "needs_more_info") {
    return toResult("needs_more_info", ["Need enough details to determine FSW funds exemption."], fundsDecision.missingFields, evidence)
  }

  if (fundsDecision.decision === "required") {
    if (profile.fundsFamilySize === null || profile.fundsFamilySize === undefined) {
      missingFields.push("funds.familySize")
    }
    if (profile.settlementFundsCad === null || profile.settlementFundsCad === undefined) {
      missingFields.push("funds.available")
    }
  }

  const languagePoints = fswLanguagePoints(language.minClb)
  const educationPoints = fswEducationPoints(educationLevel)
  const experienceYears = Math.floor(summarizeHours(skilledRoles, asOfDate, 10).totalHours / 1560)
  const experiencePoints = fswExperiencePoints(experienceYears)
  const agePoints = fswAgePoints(profile.source.dateOfBirth, asOfDate)
  const arrangedEmployment = hasValidOffer ? 10 : 0

  let adaptability = 0
  if (profile.source.hasEligibleSiblingInCanada === "yes" && profile.source.siblingAge18OrOlder === "yes" && profile.source.siblingLivesInCanada === "yes") {
    adaptability += 5
  }

  if (profile.source.spouseAccompanying === "yes-accompanying") {
    const spouseScores = profile.source.spouseLanguageScores
    if (!spouseScores.listening || !spouseScores.reading || !spouseScores.writing || !spouseScores.speaking) {
      missingFields.push("spouse.language")
    } else {
      adaptability += 5
    }

    if (!profile.source.spouseEducationLevel) {
      missingFields.push("spouse.education")
    }
  }

  adaptability = Math.min(10, adaptability)

  if (missingFields.length > 0) {
    return toResult("needs_more_info", ["Additional details are required to finalize FSW score factors."], missingFields, evidence)
  }

  const score = languagePoints + educationPoints + experiencePoints + agePoints + arrangedEmployment + adaptability
  evidence.push({ key: "fsw.score67", value: score })

  if (score < FSW_PASS_MARK) {
    return toResult("ineligible", [`FSW 67-point score is ${score}, below the pass mark of ${FSW_PASS_MARK}.`], [], evidence)
  }

  return toResult("eligible", [`Meets FSW minimum requirements and passes 67-point grid (${score}/${FSW_PASS_MARK}).`], [], evidence)
}

function evaluateFstOffer(profile: CandidateProfile): {
  hasValidOffer: boolean
  missingFields: string[]
  reasons: string[]
} {
  const missingFields: string[] = []
  const reasons: string[] = []

  const offers = profile.fstJobOfferEmployers.slice(0, 2)
  if (offers.length === 0) {
    missingFields.push("fst.offer.path")
    return { hasValidOffer: false, missingFields, reasons }
  }

  let hasValid = false

  for (let index = 0; index < offers.length; index++) {
    const offer = offers[index]
    const prefix = `fst.offer.employer.${offer.id || index}`

    if (!offer.employerName) missingFields.push(`${prefix}.employerName`)
    if (!offer.noc2021Code || !isValidNocCode(offer.noc2021Code)) missingFields.push(`${prefix}.noc2021Code`)
    if (!offer.paid) missingFields.push(`${prefix}.paid`)
    if (!offer.fullTime) missingFields.push(`${prefix}.fullTime`)
    if (!offer.continuous) missingFields.push(`${prefix}.continuous`)
    if (offer.hoursPerWeek === null || offer.hoursPerWeek === undefined) missingFields.push(`${prefix}.hoursPerWeek`)
    if (offer.durationMonths === null || offer.durationMonths === undefined) missingFields.push(`${prefix}.durationMonths`)

    const complete =
      offer.paid &&
      offer.fullTime &&
      offer.continuous &&
      offer.hoursPerWeek !== null &&
      offer.durationMonths !== null &&
      offer.durationMonths !== undefined

    if (!complete) continue

    const valid =
      offer.paid === "yes" &&
      offer.fullTime === "yes" &&
      offer.continuous === "yes" &&
      (offer.hoursPerWeek ?? 0) >= 30 &&
      (offer.durationMonths ?? 0) >= 12

    if (valid) {
      hasValid = true
    }
  }

  if (!hasValid && missingFields.length === 0) {
    reasons.push("FST job offer must be paid, continuous, full-time (30+ hrs/week), and at least 1 year.")
  }

  return {
    hasValidOffer: hasValid,
    missingFields,
    reasons,
  }
}

export function checkFST(profile: CandidateProfile, asOfDate: Date = new Date()): ProgramCheckResult {
  const reasons: string[] = []
  const missingFields: string[] = []
  const evidence: Array<{ key: string; value: unknown }> = [{ key: "asOfDate", value: asOfDate.toISOString().slice(0, 10) }]

  const quebec = evaluateQuebecGate(profile)
  if (quebec.status === "needs_more_info") {
    return toResult("needs_more_info", [quebec.reason ?? ""], quebec.missingFields, evidence)
  }
  if (quebec.status === "ineligible") {
    return toResult("ineligible", [quebec.reason ?? ""], [], evidence)
  }

  if (profile.workRoles.length === 0) {
    return toResult("needs_more_info", ["FST requires detailed trade work history."], ["work.roles"], evidence)
  }

  for (const role of profile.workRoles) {
    const teer = resolveRoleTeer(role)
    if (!role.country) missingFields.push(`work.roles.${role.id}.country`)
    if (!isValidNocCode(role.nocCode)) missingFields.push(`work.roles.${role.id}.nocCode`)
    if (!teer) missingFields.push(`work.roles.${role.id}.teer`)
    if (!role.nocDutiesMatchConfirmed) missingFields.push(`work.roles.${role.id}.nocDutiesMatchConfirmed`)
    if (!role.startDate) missingFields.push(`work.roles.${role.id}.startDate`)
    if (!role.present && !role.endDate) missingFields.push(`work.roles.${role.id}.endDate`)
    if (role.hoursPerWeek === null || role.hoursPerWeek === undefined) missingFields.push(`work.roles.${role.id}.hoursPerWeek`)
    if (role.paid === null) missingFields.push(`work.roles.${role.id}.paid`)
    if (!role.employmentType) missingFields.push(`work.roles.${role.id}.employmentType`)
    if (isUnknown(role.wasFullTimeStudent)) missingFields.push(`work.roles.${role.id}.wasFullTimeStudent`)
    if (isUnknown(role.qualifiedToPracticeInCountry ?? "")) missingFields.push(`work.roles.${role.id}.qualifiedToPracticeInCountry`)
  }

  if (missingFields.length > 0) {
    return toResult("needs_more_info", ["Complete missing trade work details for FST."], missingFields, evidence)
  }

  const tradeRoles = profile.workRoles.filter((role) => {
    const teer = resolveRoleTeer(role)
    return (
      role.paid &&
      (teer === "2" || teer === "3") &&
      isEligibleFstTradeNoc(role.nocCode) &&
      role.wasFullTimeStudent === "no" &&
      role.qualifiedToPracticeInCountry === "yes"
    )
  })

  if (tradeRoles.length === 0) {
    return toResult("ineligible", ["No eligible skilled-trade work roles identified for FST."], [], evidence)
  }

  const language = evaluateLanguage(profile, { listening: 5, reading: 4, writing: 4, speaking: 5 })
  if (language.status === "needs_more_info") {
    return toResult("needs_more_info", [language.reason ?? "Language details are required."], language.missingFields, evidence)
  }
  if (language.status === "ineligible") {
    return toResult("ineligible", [language.reason ?? "FST language minimums are not met."], [], evidence)
  }

  const nocGroups = new Map<string, typeof tradeRoles>()
  for (const role of tradeRoles) {
    const list = nocGroups.get(role.nocCode) ?? []
    list.push(role)
    nocGroups.set(role.nocCode, list)
  }

  let bestNoc = ""
  let bestHours = 0
  for (const [noc, roles] of nocGroups.entries()) {
    const summary = summarizeHours(roles, asOfDate, 5)
    if (summary.totalHours > bestHours) {
      bestHours = summary.totalHours
      bestNoc = noc
    }
  }

  evidence.push({ key: "fst.selectedNoc", value: bestNoc })
  evidence.push({ key: "fst.countableHours", value: Math.round(bestHours) })

  if (bestHours < FST_MIN_HOURS) {
    return toResult("ineligible", ["FST requires at least 3,120 countable hours in one eligible trade NOC over the last 5 years."], [], evidence)
  }

  const hasCertificate = profile.hasCanadianTradeCertificate === "yes"
  if (hasCertificate) {
    if (!profile.tradeCertificateIssuingAuthority || !profile.tradeCertificateTrade || !profile.tradeCertificateIssueDate) {
      missingFields.push("fst.certificate.details")
    }
  }

  const offer = evaluateFstOffer(profile)
  if (!hasCertificate && !offer.hasValidOffer) {
    if (offer.missingFields.length > 0) {
      return toResult("needs_more_info", ["Need job-offer details or certificate details to assess FST."], offer.missingFields, evidence)
    }
    return toResult("ineligible", ["FST requires a valid 1-year trade job offer or Canadian certificate of qualification."], [], evidence)
  }

  if (missingFields.length > 0) {
    return toResult("needs_more_info", ["Need complete certificate details for FST."], missingFields, evidence)
  }

  const fundsDecision = determineFundsRequirement(profile, offer.hasValidOffer, "fst.offer.path")
  evidence.push({ key: "fst.fundsRequirement", value: fundsDecision.decision })

  if (fundsDecision.decision === "needs_more_info") {
    return toResult("needs_more_info", ["Need enough details to determine FST funds exemption."], fundsDecision.missingFields, evidence)
  }

  if (fundsDecision.decision === "required") {
    if (profile.fundsFamilySize === null || profile.fundsFamilySize === undefined) missingFields.push("funds.familySize")
    if (profile.settlementFundsCad === null || profile.settlementFundsCad === undefined) missingFields.push("funds.available")
  }

  if (missingFields.length > 0) {
    return toResult("needs_more_info", ["Provide settlement funds details for FST."], missingFields, evidence)
  }

  return toResult("eligible", ["Meets Federal Skilled Trades minimum requirements."], [], evidence)
}

export function classifyExpressEntryStreams(profile: CandidateProfile | AssessmentData, asOfDate: Date = new Date()): ExpressEntryStreamsResult {
  const normalizedProfile = "workRoles" in profile && "source" in profile
    ? profile
    : buildProfileFromAnswers(profile as AssessmentData, asOfDate)

  const cec = checkCEC(normalizedProfile, asOfDate)
  const fsw = checkFSW(normalizedProfile, asOfDate)
  const fst = checkFST(normalizedProfile, asOfDate)

  const eligiblePrograms: StreamProgram[] = []
  if (cec.status === "eligible") eligiblePrograms.push("CEC")
  if (fsw.status === "eligible") eligiblePrograms.push("FSW")
  if (fst.status === "eligible") eligiblePrograms.push("FST")

  const missing = unique([
    ...cec.missingFields,
    ...fsw.missingFields,
    ...fst.missingFields,
  ])

  return {
    eligiblePrograms,
    programResults: {
      CEC: cec,
      FSW: fsw,
      FST: fst,
    },
    nextQuestions: buildFollowUpQuestions(missing, normalizedProfile),
    rulesetDate: RULESET_DATE,
    asOfDate: asOfDate.toISOString().slice(0, 10),
  }
}
