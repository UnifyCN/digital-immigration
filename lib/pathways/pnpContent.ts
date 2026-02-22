import type { AssessmentData } from "@/lib/types"
import type { ChecklistRow, ChecklistStatus } from "@/lib/pathways/types"
import { deriveCanadianSkilledYearsBand } from "@/lib/work-derived"

export interface PnpBrief {
  whyIntro: string
  whyBullets: string[]
  checklistIntro: string
  checklistRows: ChecklistRow[]
  checklistNote: string
  nextSteps: string[]
  documentChecklist: {
    typical: string[]
    sometimes: string[]
    laterStage: string[]
  }
  timelines: {
    stages: string[]
    commonDelays: string[]
  }
  costBuckets: string[]
  riskFlags: string[]
  openQuestions: string[]
  professionalReviewCases: string[]
}

function hasPostSecondaryEducation(level: AssessmentData["educationLevel"]): boolean {
  return [
    "one-year-diploma",
    "two-year-diploma",
    "bachelors",
    "two-or-more-degrees",
    "masters",
    "phd",
  ].includes(level)
}

function hasSkilledWorkExperience(data: AssessmentData): boolean {
  const derivedCanadianBand = data.derivedCanadianSkilledYearsBand || deriveCanadianSkilledYearsBand(data)
  if (derivedCanadianBand !== "0") {
    return true
  }
  if (data.foreignSkilledYears && data.foreignSkilledYears !== "0") {
    return true
  }

  return (data.jobs ?? []).some((job) => Boolean(job.title && (job.yearsRange || job.startMonth || job.endMonth)))
}

function buildWhyRelevantBullets(data: AssessmentData): string[] {
  const bullets: string[] = []

  if (data.currentLocation === "inside-canada") {
    bullets.push("You indicated you are currently inside Canada and may benefit from streams that prioritize in-Canada candidates.")
  }

  if (hasSkilledWorkExperience(data)) {
    bullets.push("You reported skilled work experience that can support eligibility in province-specific skilled worker pathways.")
  }

  if (hasPostSecondaryEducation(data.educationLevel)) {
    bullets.push("You reported post-secondary education, which is commonly considered in many provincial selection systems.")
  }

  if (
    data.canadianWorkExperience === "yes" ||
    data.educationCompletedInCanada === "yes" ||
    data.canadaEducationStatus === "yes" ||
    data.canadaEducationStatus === "mix-some-in-canada"
  ) {
    bullets.push("You have Canadian work and/or Canadian education signals that may improve fit for certain provincial streams.")
  }

  if (data.englishTestStatus !== "completed" && data.frenchTestStatus !== "completed") {
    bullets.push("PNP may help as a parallel nomination strategy while language/points are uncertain or still in progress.")
  }

  if (bullets.length === 0) {
    bullets.push("PNP can be relevant when provinces prioritize candidates with local ties, work experience, or employer needs.")
  }

  return bullets
}

function getLanguageReadinessStatus(data: AssessmentData): ChecklistStatus {
  if (data.englishTestStatus === "completed" || data.frenchTestStatus === "completed") return "complete"
  if (data.englishTestStatus === "booked" || data.frenchTestStatus === "booked") return "warning"
  return "unknown"
}

function hasDocumentedWorkHistory(data: AssessmentData): boolean {
  return Boolean(
    data.currentJobTitle &&
      data.mostRecentJobStart &&
      (data.mostRecentJobPresent || data.mostRecentJobEnd) &&
      data.hoursPerWeekRange,
  )
}

export function buildPnpBrief(data: AssessmentData): PnpBrief {
  return {
    whyIntro: "Based on your inputs, PNP appears relevant because:",
    whyBullets: buildWhyRelevantBullets(data),
    checklistIntro: "Core eligibility signals commonly needed (varies by province/stream):",
    checklistRows: [
      {
        label: "Province identified",
        status: data.pnpTargetProvince ? "complete" : "unknown",
      },
      {
        label: "Work history documented",
        status: hasDocumentedWorkHistory(data) ? "complete" : "warning",
      },
      {
        label: "Language readiness",
        status: getLanguageReadinessStatus(data),
      },
      {
        label: "Education info",
        status: data.educationLevel ? "complete" : "unknown",
      },
      {
        label: "Status in Canada",
        status:
          data.currentLocation === "inside-canada" && data.currentStatus
            ? "complete"
            : "unknown",
      },
      {
        label: "Stream-specific requirement",
        status: "unknown",
      },
    ],
    checklistNote: "PNP is not one program—requirements depend on province + stream.",
    nextSteps: [
      "Choose a target province (or confirm where you plan to live/work)",
      "Clarify your likely stream type (job-offer vs graduate vs skilled worker vs Express Entry-aligned)",
      "Confirm language plan (completed / planning date)",
      "Make your work history document-ready (dates, hours/week, paid status, reference letter feasibility)",
      "Start a document checklist tailored to province + stream once selected",
    ],
    documentChecklist: {
      typical: [
        "Passport + identity documents",
        "Current immigration status document (if in Canada) + expiry date",
        "Education documents (degree/diploma + transcripts)",
        "Work history proof (reference letters, pay stubs, contracts, tax records depending on country)",
        "Language test results (if required by stream)",
        "Civil status documents (marriage/divorce, children, etc.)",
      ],
      sometimes: [
        "Job offer + employer forms",
        "Proof of residence/ties (lease, bills, provincial ID, school enrollment)",
        "Proof of funds",
        "Licensure / regulated occupation proof",
      ],
      laterStage: [
        "Police certificates",
        "Medical exam",
        "Biometrics",
      ],
    },
    timelines: {
      stages: [
        "Identify province + stream",
        "Prepare documents (most delays happen here)",
        "Submit PNP application (province review time varies)",
        "If nominated: apply for PR (federal stage)",
        "Requests during processing (additional docs, updates)",
        "Decision",
      ],
      commonDelays: [
        "Employer reference letters do not meet requirements",
        "Work dates/hours are inconsistent",
        "Missing translations or improper formatting",
        "Police certificates for multiple countries",
      ],
    },
    costBuckets: [
      "Language test fees",
      "ECA fees",
      "Translation / notarization",
      "Provincial application fee (some provinces)",
      "PR application fees (federal stage)",
      "Biometrics / medical exam",
    ],
    riskFlags: [
      "Unclear intent to reside in the province",
      "Work letters missing required details (duties, hours, pay, dates)",
      "Mismatch between claimed job and evidence",
      "Status issues (expiry / maintained status uncertainty if inside Canada)",
      "Inconsistent personal history timelines",
      "Document authenticity / unclear translations",
      "Prior refusals not explained consistently",
    ],
    openQuestions: [
      "Target province (or top 2 choices)",
      "Job offer availability",
      "Recent graduate in Canada",
      "Language test status (completed/planning + approximate level)",
      "Reference letter feasibility",
      "Ties: family/study/work/current residence in a province",
    ],
    professionalReviewCases: [
      "Prior refusals",
      "Criminal charges/convictions",
      "Medical admissibility concerns",
      "Misrepresentation concerns or inconsistencies",
      "Out-of-status / overstays / removals",
      "Difficult-to-document work history (informal/self-employed without records)",
      "Multiple countries lived in (police cert complexity)",
    ],
  }
}
