import { PNP_MVP_DEFAULT_PROVINCE } from "../config/pnpScope.ts"
import type { PNPSignals, TriState } from "./pnpSignals"
import type {
  ProvinceFinderDraftAnswers,
  ProvinceFinderEeCrsKnown,
  ProvinceFinderEeCrsRange,
  ProvinceFinderEeProfileActive,
  ProvinceFinderEmployerAnnualRevenueRange,
  ProvinceFinderEmployerOperationYearsInProvince,
  ProvinceFinderNocKnown,
  ProvinceFinderAnswers,
  ProvinceFinderSettlementFundsAmountRange,
  ProvinceFinderTeerLevelGuess,
} from "./provinceFinder"
import { detectProvinceCode, normalizeProvince, type MVPProvinceCode } from "./pnpProvinceNormalization.ts"

export type PNPProvinceFinderSignals = {
  targetProvince: string | null
  employerSupport: ProvinceFinderAnswers["employerSupport"] | null
  employerEmployeesInProvince: ProvinceFinderAnswers["employerEmployeesInProvince"] | null
  monthsWithEmployer: ProvinceFinderAnswers["monthsWithEmployer"] | null
  ruralJobLocation: ProvinceFinderAnswers["ruralJobLocation"] | null
  institutionType: ProvinceFinderAnswers["institutionType"] | null
  programAtLeast8Months: ProvinceFinderAnswers["programAtLeast8Months"] | null
  graduatedWithin3Years: ProvinceFinderAnswers["graduatedWithin3Years"] | null
  willingOutsideMajorCities: ProvinceFinderAnswers["willingOutsideMajorCities"] | null
  committedToResideProvince: ProvinceFinderAnswers["committedToResideProvince"] | null
  occupationRegulated: ProvinceFinderAnswers["occupationRegulated"] | null
  licensureStatus: ProvinceFinderAnswers["licensureStatus"] | null
  priorNomination: ProvinceFinderAnswers["priorNomination"] | null
  priorPNPRefusal: ProvinceFinderAnswers["priorPNPRefusal"] | null
  settlementFunds: ProvinceFinderAnswers["settlementFunds"] | null
  frenchIntermediatePlus: ProvinceFinderAnswers["frenchIntermediatePlus"] | null
  prioritySectorEmployer: ProvinceFinderAnswers["prioritySectorEmployer"] | null
  nocKnown: ProvinceFinderNocKnown | null
  nocCode: string | null
  teerLevelGuess: ProvinceFinderTeerLevelGuess | null
  eeProfileActive: ProvinceFinderEeProfileActive | null
  eeCrsKnown: ProvinceFinderEeCrsKnown | null
  eeCrsScore: number | null
  eeCrsRange: ProvinceFinderEeCrsRange | null
  employerOperationYearsInProvince: ProvinceFinderEmployerOperationYearsInProvince | null
  employerAnnualRevenueRange: ProvinceFinderEmployerAnnualRevenueRange | null
  jobLocationPostalCode: string | null
  settlementFundsAmountRange: ProvinceFinderSettlementFundsAmountRange | null
}

export type CombinedPNPSignals = PNPSignals & {
  targetProvince: string | null
  jobProvince: string | null
  jobProvinceCode: string | null
  educationProvince: string | null
  educationProvinceCode: string | null
  teerSkillBand: "teer_0_3" | "teer_4_5" | null
  programAtLeast8Months: "yes" | "no" | "not_sure" | null
  completedWithin3Years: "yes" | "no" | "not_sure" | null
  institutionType: "public" | "private" | "unsure" | null
  employerSupportRefined: TriState | null
  hasJobOfferRefined: TriState | null
  provinceFinder: PNPProvinceFinderSignals
}

export type MVPProvinceResolution = {
  provinceCode: MVPProvinceCode
  mvpProvinceNotice: boolean
  requestedProvinceCode: string | null
  requestedProvinceInput: string | null
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return value
}

function normalizeTriState(value: unknown): TriState | null {
  if (value === "yes" || value === "no") return value
  if (value === "not_sure" || value === "not-sure" || value === "unsure") return "not_sure"
  return null
}

function preferNonEmpty<T extends string | null | undefined>(preferred: T, fallback: T): string | null {
  const preferredTrimmed = typeof preferred === "string" ? preferred.trim() : ""
  if (preferredTrimmed.length > 0) return preferredTrimmed
  const fallbackTrimmed = typeof fallback === "string" ? fallback.trim() : ""
  return fallbackTrimmed.length > 0 ? fallbackTrimmed : null
}

function deriveProgramAtLeast8MonthsFromMain(programLength: string | null): "yes" | "no" | "not_sure" | null {
  if (!programLength) return null
  const normalized = programLength.trim().toLowerCase()
  if (normalized === "not-sure" || normalized === "not_sure") return "not_sure"
  if (normalized === "1-year" || normalized === "2-years" || normalized === "3-plus-years") return "yes"
  if (normalized === "less-than-1-year") return "not_sure"
  return null
}

function deriveGraduatedWithin3Years(mainSignals: PNPSignals): "yes" | "no" | "not_sure" | null {
  if (mainSignals.graduationYear) {
    const graduationYearNumber = Number(mainSignals.graduationYear)
    if (!Number.isNaN(graduationYearNumber)) {
      const currentYear = new Date().getFullYear()
      return currentYear - graduationYearNumber <= 3 ? "yes" : "no"
    }
  }
  return null
}

function getTeerSkillBand(
  teerLevelGuess: ProvinceFinderTeerLevelGuess | null,
): "teer_0_3" | "teer_4_5" | null {
  if (!teerLevelGuess) return null
  if (
    teerLevelGuess === "teer_0_management" ||
    teerLevelGuess === "teer_1_professional_roles" ||
    teerLevelGuess === "teer_2_technical_skilled_trades" ||
    teerLevelGuess === "teer_3_intermediate_skilled"
  ) {
    return "teer_0_3"
  }
  if (teerLevelGuess === "teer_4_support_roles" || teerLevelGuess === "teer_5_labour_roles") {
    return "teer_4_5"
  }
  return null
}

export function buildPNPProvinceFinderSignals(
  answers: ProvinceFinderDraftAnswers | null | undefined,
): PNPProvinceFinderSignals {
  const data = (answers ?? {}) as Record<string, unknown> & ProvinceFinderDraftAnswers
  const targetProvince =
    asString(data.targetProvince as unknown) ??
    asString(data.preferredProvince as unknown) ??
    null

  return {
    targetProvince,
    employerSupport: data.employerSupport ?? null,
    employerEmployeesInProvince: data.employerEmployeesInProvince ?? null,
    monthsWithEmployer: data.monthsWithEmployer ?? null,
    ruralJobLocation: data.ruralJobLocation ?? null,
    institutionType: data.institutionType ?? null,
    programAtLeast8Months: data.programAtLeast8Months ?? null,
    graduatedWithin3Years: data.graduatedWithin3Years ?? null,
    willingOutsideMajorCities: data.willingOutsideMajorCities ?? null,
    committedToResideProvince: data.committedToResideProvince ?? null,
    occupationRegulated: data.occupationRegulated ?? null,
    licensureStatus: data.licensureStatus ?? null,
    priorNomination: data.priorNomination ?? null,
    priorPNPRefusal: data.priorPNPRefusal ?? null,
    settlementFunds: data.settlementFunds ?? null,
    frenchIntermediatePlus: data.frenchIntermediatePlus ?? null,
    prioritySectorEmployer: data.prioritySectorEmployer ?? null,
    nocKnown: data.noc_known ?? null,
    nocCode: asString(data.noc_code),
    teerLevelGuess: data.teer_level_guess ?? null,
    eeProfileActive: data.ee_profile_active ?? null,
    eeCrsKnown: data.ee_crs_known ?? null,
    eeCrsScore: asNullableNumber(data.ee_crs_score),
    eeCrsRange: data.ee_crs_range ?? null,
    employerOperationYearsInProvince: data.employer_operation_years_in_province ?? null,
    employerAnnualRevenueRange: data.employer_annual_revenue_range ?? null,
    jobLocationPostalCode: asString(data.job_location_postal_code),
    settlementFundsAmountRange: data.settlement_funds_amount_range ?? null,
  }
}

export function mergeSignals(
  mainSignals: PNPSignals,
  finderSignals: PNPProvinceFinderSignals,
): CombinedPNPSignals {
  const preferredProvince = preferNonEmpty(finderSignals.targetProvince, mainSignals.preferredProvince)
  const jobOfferProvince = preferNonEmpty(null, mainSignals.jobOfferProvince)
  const currentJobProvince = preferNonEmpty(null, mainSignals.currentJobProvince)
  const programAtLeast8Months =
    finderSignals.programAtLeast8Months ??
    deriveProgramAtLeast8MonthsFromMain(mainSignals.programLength)
  const completedWithin3Years =
    finderSignals.graduatedWithin3Years ??
    deriveGraduatedWithin3Years(mainSignals)
  const institutionType = finderSignals.institutionType
  const employerSupportRefined =
    normalizeTriState(finderSignals.employerSupport) ?? mainSignals.employerSupportPNP

  return {
    ...mainSignals,
    preferredProvince,
    hasProvincePreference: Boolean(preferredProvince),
    jobOfferProvince,
    currentJobProvince,
    targetProvince: preferredProvince,
    jobProvince: jobOfferProvince,
    jobProvinceCode: detectProvinceCode(jobOfferProvince),
    educationProvince: mainSignals.educationProvinceInCanada,
    educationProvinceCode: detectProvinceCode(mainSignals.educationProvinceInCanada),
    teerSkillBand: getTeerSkillBand(finderSignals.teerLevelGuess),
    programAtLeast8Months,
    completedWithin3Years,
    institutionType,
    employerSupportRefined,
    hasJobOfferRefined: mainSignals.hasJobOffer,
    employerSupportPNP: employerSupportRefined,
    provinceFinder: finderSignals,
  }
}

export function resolveMVPProvinceCode(params: {
  mainSignals: PNPSignals
  finderSignals: PNPProvinceFinderSignals
}): MVPProvinceCode {
  return resolveMVPProvince(params).provinceCode
}

export function resolveMVPProvince(params: {
  mainSignals: PNPSignals
  finderSignals: PNPProvinceFinderSignals
}): MVPProvinceResolution {
  const { mainSignals, finderSignals } = params
  const requestedProvinceInput = preferNonEmpty(
    finderSignals.targetProvince,
    mainSignals.preferredProvince,
  )
  const requestedProvinceCode = detectProvinceCode(requestedProvinceInput)
  const normalizedProvince = normalizeProvince(requestedProvinceInput)

  return {
    provinceCode: PNP_MVP_DEFAULT_PROVINCE,
    mvpProvinceNotice: Boolean(requestedProvinceCode && normalizedProvince !== PNP_MVP_DEFAULT_PROVINCE),
    requestedProvinceCode,
    requestedProvinceInput,
  }
}
