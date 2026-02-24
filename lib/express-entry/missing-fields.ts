import type { MissingFieldRef } from "./types"

const ASSESSMENT_STEP = {
  BASIC_INFORMATION: 1,
  WORK_HISTORY: 4,
  EDUCATION: 5,
  LANGUAGE: 6,
  FAMILY: 7,
} as const

function getAssessmentStepHref(step: number): string {
  return `/assessment?step=${step}`
}

const MISSING_FIELD_MAP: Record<string, Omit<MissingFieldRef, "key">> = {
  "language.primary.type": { label: "Primary language test type", step: ASSESSMENT_STEP.LANGUAGE, href: getAssessmentStepHref(ASSESSMENT_STEP.LANGUAGE) },
  "language.primary.date": { label: "Primary language test date", step: ASSESSMENT_STEP.LANGUAGE, href: getAssessmentStepHref(ASSESSMENT_STEP.LANGUAGE) },
  "language.primary.stream": { label: "Primary language test stream", step: ASSESSMENT_STEP.LANGUAGE, href: getAssessmentStepHref(ASSESSMENT_STEP.LANGUAGE) },
  "language.primary.scores": { label: "Primary language test scores", step: ASSESSMENT_STEP.LANGUAGE, href: getAssessmentStepHref(ASSESSMENT_STEP.LANGUAGE) },
  "education.credentials": { label: "Education credential details", step: ASSESSMENT_STEP.EDUCATION, href: getAssessmentStepHref(ASSESSMENT_STEP.EDUCATION) },
  "education.eca.issueDate": { label: "ECA issue date", step: ASSESSMENT_STEP.EDUCATION, href: getAssessmentStepHref(ASSESSMENT_STEP.EDUCATION) },
  "education.eca.equivalency": { label: "ECA equivalency result", step: ASSESSMENT_STEP.EDUCATION, href: getAssessmentStepHref(ASSESSMENT_STEP.EDUCATION) },
  "work.roles": { label: "Detailed work role history", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "work.roles.noc": { label: "NOC 2021 code for work roles", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "work.roles.teer": { label: "TEER level for work roles", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "work.roles.dates": { label: "Exact work role dates", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "work.roles.hours": { label: "Work role hours per week", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "work.roles.authorization": { label: "Canadian work authorization details", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "spouse.language": { label: "Spouse language test details", step: ASSESSMENT_STEP.FAMILY, href: getAssessmentStepHref(ASSESSMENT_STEP.FAMILY) },
  "spouse.education": { label: "Spouse education details", step: ASSESSMENT_STEP.FAMILY, href: getAssessmentStepHref(ASSESSMENT_STEP.FAMILY) },
  "funds.familySize": { label: "Proof-of-funds family size", step: ASSESSMENT_STEP.FAMILY, href: getAssessmentStepHref(ASSESSMENT_STEP.FAMILY) },
  "funds.available": { label: "Available settlement funds", step: ASSESSMENT_STEP.FAMILY, href: getAssessmentStepHref(ASSESSMENT_STEP.FAMILY) },
  "fst.offerOrCert": { label: "FST job offer or trade certificate", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
  "jobOffer.validity": { label: "Job offer validity details", step: ASSESSMENT_STEP.WORK_HISTORY, href: getAssessmentStepHref(ASSESSMENT_STEP.WORK_HISTORY) },
}

export function toMissingFieldRef(key: string): MissingFieldRef {
  const mapped = MISSING_FIELD_MAP[key]
  if (!mapped) {
    return {
      key,
      label: key,
      step: ASSESSMENT_STEP.BASIC_INFORMATION,
      href: getAssessmentStepHref(ASSESSMENT_STEP.BASIC_INFORMATION),
    }
  }
  return { key, ...mapped }
}

export function uniqueMissingFields(keys: string[]): MissingFieldRef[] {
  const unique = Array.from(new Set(keys.filter(Boolean)))
  return unique.map(toMissingFieldRef)
}
