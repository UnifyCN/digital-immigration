import type { AssessmentData } from "@/lib/types"
import type { Imm5669Data, PersonalHistoryRow } from "./types"
import { DEFAULT_IMM5669, EMPTY_EDUCATION_ROW, EMPTY_PERSONAL_HISTORY_ROW } from "./types"

export function prefillFromAssessment(assessment: AssessmentData): Imm5669Data {
  const givenParts = [assessment.firstName, assessment.middleName].filter(Boolean)

  const educationHistory = assessment.educationLevel
    ? [{
        ...EMPTY_EDUCATION_ROW,
        cityAndCountry: assessment.educationCountry || "",
        fieldOfStudy: "",
        certificateType: formatEducationLevel(assessment.educationLevel),
      }]
    : DEFAULT_IMM5669.educationHistory

  const personalHistory: PersonalHistoryRow[] = assessment.jobs.length > 0
    ? assessment.jobs.map((job) => ({
        ...EMPTY_PERSONAL_HISTORY_ROW,
        from: job.startMonth || "",
        to: job.present ? currentYearMonth() : (job.endMonth || ""),
        activity: job.title || "",
        cityAndCountry: job.country || "",
        statusInCountry: "",
        companyOrEmployer: "",
      }))
    : DEFAULT_IMM5669.personalHistory

  return {
    ...DEFAULT_IMM5669,
    familyName: assessment.lastName || "",
    givenNames: givenParts.join(" "),
    dateOfBirth: assessment.dateOfBirth || "",
    educationHistory,
    personalHistory,
  }
}

function formatEducationLevel(level: string): string {
  const map: Record<string, string> = {
    "high-school": "High School Diploma",
    "one-year-diploma": "One-Year Diploma",
    "two-year-diploma": "Two-Year Diploma",
    "bachelors": "Bachelor's Degree",
    "two-or-more-degrees": "Multiple Degrees",
    "masters": "Master's Degree",
    "phd": "Doctoral Degree (PhD)",
  }
  return map[level] || level
}

function currentYearMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}
