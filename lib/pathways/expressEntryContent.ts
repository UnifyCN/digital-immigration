import type { AssessmentData } from "@/lib/types"
import type { ChecklistRow, ChecklistStatus } from "@/lib/pathways/types"
import { deriveCanadianSkilledYearsBand } from "@/lib/work-derived"
import { isCanadaCountry } from "@/lib/canada-helpers"
import type { ExpressEntryEligibilityResult } from "@/lib/express-entry/types"

export interface ExpressEntryBrief {
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
  crsSignalsIntro: string
  crsSignals: string[]
  crsSignalsNote: string
  riskFlags: string[]
  openQuestions: string[]
  professionalReviewCases: string[]
}

// Keep this mapped from AssessmentData["educationLevel"] so new levels are handled intentionally.
function hasPostSecondaryEducation(level: AssessmentData["educationLevel"]): boolean {
  switch (level) {
    case "one-year-diploma":
    case "two-year-diploma":
    case "bachelors":
    case "two-or-more-degrees":
    case "masters":
    case "phd":
      return true
    case "":
    case "none":
    case "high-school":
      return false
  }
}

function hasSkilledWorkExperience(data: AssessmentData): boolean {
  const derivedCanadianBand = data.derivedCanadianSkilledYearsBand || deriveCanadianSkilledYearsBand(data)
  if (derivedCanadianBand !== "0") return true
  if (data.foreignSkilledYears && data.foreignSkilledYears !== "0") return true
  return Boolean(data.currentJobTitle || (data.jobs ?? []).length > 0)
}

function hasCanadianWorkOneYearPlus(data: AssessmentData): boolean {
  const derivedCanadianBand = data.derivedCanadianSkilledYearsBand || deriveCanadianSkilledYearsBand(data)
  return ["1", "2", "3", "4", "5+"].includes(derivedCanadianBand)
}

function getLanguageReadinessStatus(data: AssessmentData): ChecklistStatus {
  const englishCompleted =
    (data.languageTestPlan === "english-only" || data.languageTestPlan === "both-languages") &&
    data.englishTestStatus === "completed"
  const frenchCompleted =
    (data.languageTestPlan === "french-only" || data.languageTestPlan === "both-languages") &&
    data.frenchTestStatus === "completed"
  const anyBooked = data.englishTestStatus === "booked" || data.frenchTestStatus === "booked"
  if (englishCompleted || frenchCompleted) return "complete"
  if (anyBooked) return "warning"
  return "unknown"
}

function getEcaStatus(data: AssessmentData): ChecklistStatus {
  const hasEducationCountry = Boolean(data.educationCountry.trim())
  const educationOutsideCanada = hasEducationCountry && !isCanadaCountry(data.educationCountry)

  if (!educationOutsideCanada) return "unknown"
  if (data.ecaValid === "yes" || data.ecaStatus === "yes") return "complete"
  if (data.ecaValid === "no" || data.ecaStatus === "no") return "warning"
  return "unknown"
}

function hasCoreProfileCompleteness(data: AssessmentData): boolean {
  return Boolean(
    data.primaryGoal &&
      data.currentStatus &&
      (data.derivedCanadianSkilledYearsBand ||
        data.foreignSkilledYears ||
        data.currentJobTitle) &&
      data.educationLevel &&
      data.languageTestPlan,
  )
}

function buildWhyRelevantBullets(
  data: AssessmentData,
  eligibility?: ExpressEntryEligibilityResult,
): string[] {
  const bullets: string[] = []

  if (eligibility) {
    if (eligibility.overallStatus === "eligible") {
      bullets.push("You currently qualify for at least one Express Entry program.")
    } else if (eligibility.overallStatus === "needs_more_info") {
      bullets.push("Express Entry may apply, but key details are still missing.")
    } else {
      bullets.push("Current inputs do not satisfy Express Entry program requirements.")
    }
  }

  if (hasSkilledWorkExperience(data)) {
    bullets.push("You reported skilled work experience.")
  }

  if (hasPostSecondaryEducation(data.educationLevel)) {
    bullets.push("You reported post-secondary education.")
  }

  if (data.englishTestStatus === "completed" || data.frenchTestStatus === "completed") {
    bullets.push("You indicated completed language test results (a key requirement for most Express Entry streams).")
  }

  if (hasCanadianWorkOneYearPlus(data)) {
    bullets.push("You reported Canadian work experience (often relevant for Canadian Experience Class).")
  }

  if (data.currentLocation === "inside-canada") {
    bullets.push("You indicated you are currently inside Canada, which can affect which streams are practical (e.g., CEC).")
  }

  if (bullets.length === 0) {
    bullets.push("Express Entry can be relevant for skilled workers with qualifying work experience, education, and language ability.")
  }

  return bullets
}

function toChecklistStatus(status: "eligible" | "ineligible" | "needs_more_info"): ChecklistStatus {
  if (status === "eligible") return "complete"
  if (status === "needs_more_info") return "warning"
  return "unknown"
}

export function buildExpressEntryBrief(
  data: AssessmentData,
  eligibility?: ExpressEntryEligibilityResult,
): ExpressEntryBrief {
  const dynamicChecklistRows = eligibility
    ? [
        { label: "Canadian Experience Class (CEC)", status: toChecklistStatus(eligibility.programs.cec.status) },
        { label: "Federal Skilled Worker (FSW)", status: toChecklistStatus(eligibility.programs.fsw.status) },
        { label: "Federal Skilled Trades (FST)", status: toChecklistStatus(eligibility.programs.fst.status) },
      ]
    : null

  const dynamicOpenQuestions = eligibility
    ? eligibility.missingFields.slice(0, 8).map((field) => field.label)
    : []

  const dynamicRiskFlags = eligibility
    ? [
        ...eligibility.programs.cec.reasons,
        ...eligibility.programs.fsw.reasons,
        ...eligibility.programs.fst.reasons,
      ].slice(0, 7)
    : []

  return {
    whyIntro: eligibility
      ? "Based on deterministic rule checks, your current Express Entry status is:"
      : "Based on your inputs, Express Entry appears relevant because:",
    whyBullets: buildWhyRelevantBullets(data, eligibility),
    checklistIntro: eligibility
      ? "Program-level eligibility status:"
      : "Core eligibility signals commonly needed (varies by stream):",
    checklistRows:
      dynamicChecklistRows ??
      [
        {
          label: "Skilled work experience",
          status: hasSkilledWorkExperience(data) ? "complete" : "unknown",
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
          label: "ECA (if education outside Canada)",
          status: getEcaStatus(data),
        },
        {
          label: "Canadian experience (CEC signal)",
          status: hasCanadianWorkOneYearPlus(data) ? "complete" : "unknown",
        },
        {
          label: "Profile completeness",
          status: hasCoreProfileCompleteness(data) ? "complete" : "warning",
        },
      ],
    checklistNote: eligibility
      ? `Rules version: ${eligibility.rulesVersion}. Missing fields must be completed for final determinations.`
      : "Express Entry includes multiple programs; eligibility and scoring depend on your exact profile.",
    nextSteps: [
      "Confirm which stream is most plausible (FSW vs CEC vs FST) based on your work/location",
      "Confirm language plan (scores/validity or booking date)",
      "Confirm education plan (ECA if needed, Canadian credential details if applicable)",
      "Make your work history document-ready (dates, hours/week, paid status, reference letter feasibility)",
      "Gather identity + civil status documents early",
      "Optional: explore nomination (PNP) as a parallel path if points are uncertain",
    ],
    documentChecklist: {
      typical: [
        "Passport + identity documents",
        "Education docs (degree/diploma + transcripts)",
        "ECA report (if required)",
        "Language test results (valid)",
        "Work reference letters with duties/hours/pay/dates",
        "Proof of status in Canada (if inside Canada)",
        "Civil status docs (marriage/divorce, children, etc.)",
      ],
      sometimes: [
        "Proof of funds (often relevant depending on stream/circumstances)",
        "Job offer documents (if applicable)",
        "Provincial nomination certificate (if nominated)",
      ],
      laterStage: [
        "Police certificates",
        "Medical exam",
        "Biometrics",
      ],
    },
    timelines: {
      stages: [
        "Prepare evidence + confirm eligibility signals",
        "Create Express Entry profile",
        "Enter pool and monitor draws",
        "If invited: submit PR application (tight submission window)",
        "Processing + requests for additional documents",
        "Decision",
      ],
      commonDelays: [
        "Work letters not meeting required details",
        "ECA/language test timing",
        "Inconsistent personal history timelines",
        "Police certificates for multiple countries",
      ],
    },
    crsSignalsIntro:
      "These are common levers that can affect points; they do not guarantee an invitation.",
    crsSignals: [
      "Language scores (often high impact)",
      "Canadian work experience duration",
      "Level of education + ECA equivalency",
      "Age (points tend to decrease with higher age brackets)",
      "Spouse factors (language/education/work)",
      "Provincial nomination (major boost if obtained)",
      "Valid job offer (if applicable)",
    ],
    crsSignalsNote: "Your points and draw thresholds change over time.",
    riskFlags:
      dynamicRiskFlags.length > 0
        ? dynamicRiskFlags
        : [
            "Inconsistent personal history (gaps/overlaps not explained consistently)",
            "Work letters missing duties/hours/pay/dates",
            "Mismatch between claimed occupation and supporting evidence",
            "Language/ECA expired at key moments",
            "Document authenticity or unclear translations",
            "Prior refusals not explained consistently",
            "Misrepresentation concerns",
          ],
    openQuestions:
      dynamicOpenQuestions.length > 0
        ? dynamicOpenQuestions
        : [
            "Exact language level (CLB approximation) + validity date",
            "ECA status/validity (if education outside Canada)",
            "Canadian work duration (exact range)",
            "Reference letter feasibility for your main role(s)",
            "Whether you have a spouse (and if accompanying) + spouse language/education (if relevant)",
            "Whether you have lived in multiple countries (police certificate complexity)",
          ],
    professionalReviewCases: [
      "Prior refusals",
      "Criminal charges/convictions",
      "Medical admissibility concerns",
      "Misrepresentation concerns or inconsistencies",
      "Out-of-status / overstays / removals",
      "Hard-to-document work history (informal/self-employed without records)",
      "Complex family/sponsorship intersections",
    ],
  }
}
