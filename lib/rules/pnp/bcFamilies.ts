import type { CombinedPNPSignals } from "../../pathways/pnpProvinceScope"

export type StreamFamilyId = "BC_EMPLOYER_SKILLED" | "BC_INTL_GRAD"
export type FamilyConfidence = "high" | "medium" | "low"

export type FamilyOpenQuestion = {
  id: string
  prompt: string
  reason?: string
  signalKeys?: string[]
}

export type FamilyRecommendation = {
  familyId: StreamFamilyId
  title: string
  shortDescription: string
  fitScore: number
  confidence: FamilyConfidence
  baselineBadge: "pass" | "unclear" | "fail"
  hardBlockers: string[]
  missingRequired: Array<{ id: string; prompt: string; signalKeys?: string[] }>
  whyBullets: string[]
  whyBulletIds: string[]
  openQuestions: FamilyOpenQuestion[]
}

export type ProvinceFinderResult = {
  provinceCode: "BC"
  recommendations: FamilyRecommendation[]
  generatedAt: string
}

export type FamilyRuleContext = {
  combinedSignals: CombinedPNPSignals
  confidence: FamilyConfidence
}

export type FamilyWhyRule = {
  id: string
  priority: number
  when: (ctx: FamilyRuleContext) => boolean
  text: (ctx: FamilyRuleContext) => string
}

export type FamilyOpenQuestionRule = {
  id: string
  priority: number
  when: (ctx: FamilyRuleContext) => boolean
  prompt: string
  reason?: string
  signalKeys?: string[]
}

export const BC_STREAM_FAMILIES: Array<{
  familyId: StreamFamilyId
  title: string
  shortDescription: string
}> = [
  {
    familyId: "BC_EMPLOYER_SKILLED",
    title: "BC Employer-Driven Skilled Worker",
    shortDescription: "Best for people with a full-time job offer in BC and employer participation.",
  },
  {
    familyId: "BC_INTL_GRAD",
    title: "BC International Graduate",
    shortDescription:
      "Best for people with recent Canadian education (especially BC) and a BC job connection.",
  },
]

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined || value === "not_sure" || value === "not-sure" || value === "unsure"
}

export const BC_EMPLOYER_SKILLED_WHY_RULES: FamilyWhyRule[] = [
  {
    id: "A_job_offer_bc",
    priority: 100,
    when: ({ combinedSignals }) =>
      combinedSignals.hasJobOfferRefined === "yes" && combinedSignals.jobProvinceCode === "BC",
    text: () =>
      "You reported a job offer in British Columbia, which can support employer-driven provincial pathways.",
  },
  {
    id: "A_fulltime_permanent",
    priority: 92,
    when: ({ combinedSignals }) =>
      combinedSignals.jobOfferFullTime === "yes" || combinedSignals.jobOfferPermanent === "yes",
    text: () =>
      "You indicated the role is full-time and/or permanent, which is commonly expected in employer-supported pathways.",
  },
  {
    id: "A_employer_support",
    priority: 88,
    when: ({ combinedSignals }) => combinedSignals.employerSupportRefined === "yes",
    text: () =>
      "Employer support for nomination appears possible, which can matter for employer-driven options.",
  },
  {
    id: "A_teer_skilled",
    priority: 84,
    when: ({ combinedSignals }) => combinedSignals.teerSkillBand === "teer_0_3",
    text: () =>
      "Your occupation appears to fall in a skilled TEER category, which often aligns with skilled worker pathways.",
  },
  {
    id: "A_canadian_work_12mo",
    priority: 78,
    when: ({ combinedSignals }) => combinedSignals.canadianSkilledWork12mo === "yes",
    text: () =>
      "You reported at least 12 months of skilled Canadian work experience, which can strengthen employer-driven options.",
  },
]

export const BC_INTL_GRAD_WHY_RULES: FamilyWhyRule[] = [
  {
    id: "B_canadian_education",
    priority: 100,
    when: ({ combinedSignals }) => combinedSignals.anyEducationInCanada === "yes",
    text: () =>
      "You reported completing education in Canada, which can align with international graduate pathways.",
  },
  {
    id: "B_bc_education",
    priority: 92,
    when: ({ combinedSignals }) => combinedSignals.educationProvinceCode === "BC",
    text: () =>
      "Your education appears connected to British Columbia, which can strengthen BC graduate options.",
  },
  {
    id: "B_program_recency",
    priority: 88,
    when: ({ combinedSignals }) =>
      combinedSignals.programAtLeast8Months === "yes" || combinedSignals.completedWithin3Years === "yes",
    text: () =>
      "Your program length and graduation timing may align with graduate pathway requirements.",
  },
  {
    id: "B_job_connection_bc",
    priority: 84,
    when: ({ combinedSignals }) =>
      combinedSignals.hasJobOfferRefined === "yes" && combinedSignals.jobProvinceCode === "BC",
    text: () =>
      "A BC job connection can further strengthen graduate pathways.",
  },
]

export const BC_EMPLOYER_SKILLED_OPENQ_RULES: FamilyOpenQuestionRule[] = [
  {
    id: "A_q_job_offer",
    priority: 100,
    when: ({ combinedSignals }) => isUnknown(combinedSignals.hasJobOfferRefined),
    prompt: "Do you currently have a job offer from a BC employer?",
    reason: "Many employer-driven pathways require a job offer.",
    signalKeys: ["hasJobOffer"],
  },
  {
    id: "A_q_employer_support",
    priority: 95,
    when: ({ combinedSignals }) => isUnknown(combinedSignals.employerSupportRefined),
    prompt: "Can your employer support a nomination application?",
    reason: "Employer participation may be required.",
    signalKeys: ["employerSupportPNP", "employerSupport"],
  },
  {
    id: "A_q_job_permanent",
    priority: 90,
    when: ({ combinedSignals }) => isUnknown(combinedSignals.jobOfferPermanent),
    prompt: "Is your job offer permanent/indeterminate (no end date)?",
    reason: "This can affect pathway fit.",
    signalKeys: ["jobOfferPermanent"],
  },
  {
    id: "A_q_teer",
    priority: 88,
    when: ({ combinedSignals }) =>
      !combinedSignals.teerSkillBand &&
      !(combinedSignals.provinceFinder.nocCode && combinedSignals.provinceFinder.nocCode.length > 0),
    prompt: "Do you know your NOC code or TEER level?",
    reason: "Skill level affects which pathways may apply.",
    signalKeys: ["noc_code", "teer_level_guess"],
  },
  {
    id: "A_q_job_province",
    priority: 86,
    when: ({ combinedSignals }) => combinedSignals.hasJobOfferRefined === "yes" && !combinedSignals.jobProvinceCode,
    prompt: "Which province is your job offer based in?",
    reason: "Province location is needed for BC pathway fit.",
    signalKeys: ["jobOfferProvince"],
  },
]

export const BC_INTL_GRAD_OPENQ_RULES: FamilyOpenQuestionRule[] = [
  {
    id: "B_q_institution_type",
    priority: 98,
    when: ({ combinedSignals }) =>
      !combinedSignals.institutionType || combinedSignals.institutionType === "unsure",
    prompt: "Was your Canadian institution public or private?",
    reason: "Some pathways distinguish institution type.",
    signalKeys: ["institutionType", "publicInstitutionInCanada"],
  },
  {
    id: "B_q_program_length",
    priority: 95,
    when: ({ combinedSignals }) => !combinedSignals.programAtLeast8Months || combinedSignals.programAtLeast8Months === "not_sure",
    prompt: "Was your program at least 8 months long?",
    reason: "Program length can be a requirement.",
    signalKeys: ["programAtLeast8Months", "programLength"],
  },
  {
    id: "B_q_recency",
    priority: 92,
    when: ({ combinedSignals }) => !combinedSignals.completedWithin3Years || combinedSignals.completedWithin3Years === "not_sure",
    prompt: "Did you graduate within the last 3 years?",
    reason: "Recency can matter for graduate pathways.",
    signalKeys: ["graduatedWithin3Years", "graduationYear"],
  },
  {
    id: "B_q_education_province",
    priority: 90,
    when: ({ combinedSignals }) =>
      combinedSignals.anyEducationInCanada === "yes" && !combinedSignals.educationProvinceCode,
    prompt: "Which province did you study in?",
    reason: "Province of study helps identify the best provincial options.",
    signalKeys: ["educationProvinceInCanada"],
  },
  {
    id: "B_q_canadian_education",
    priority: 88,
    when: ({ combinedSignals }) => isUnknown(combinedSignals.anyEducationInCanada),
    prompt: "Have you completed any education in Canada?",
    reason: "Canadian education is a major graduate-pathway signal.",
    signalKeys: ["anyEducationInCanada"],
  },
]

export function fallbackOpenQuestion(familyId: StreamFamilyId): FamilyOpenQuestion {
  if (familyId === "BC_EMPLOYER_SKILLED") {
    return {
      id: "A_q_fallback",
      prompt: "Share any missing BC job-offer details so we can improve this fit assessment.",
      reason: "More complete employer and role details improve confidence.",
      signalKeys: ["hasJobOffer", "jobOfferProvince", "jobOfferFullTime", "jobOfferPermanent"],
    }
  }

  return {
    id: "B_q_fallback",
    prompt: "Share missing education details to improve this graduate-family fit assessment.",
    reason: "Education details improve confidence for graduate pathways.",
    signalKeys: ["anyEducationInCanada", "educationProvinceInCanada", "programLength", "graduationYear"],
  }
}

export function fallbackWhyBullet(familyId: StreamFamilyId): { id: string; text: string } {
  if (familyId === "BC_EMPLOYER_SKILLED") {
    return {
      id: "A_why_fallback",
      text: "Your profile shows some indicators that may align with BC employer-driven pathways, but more detail is needed.",
    }
  }
  return {
    id: "B_why_fallback",
    text: "Your profile shows some indicators that may align with BC graduate pathways, but more detail is needed.",
  }
}
