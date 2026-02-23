import type { AssessmentData, AssessmentResults } from "@/lib/types"
import type { ChecklistRow, ChecklistStatus } from "@/lib/pathways/types"
import type { ExpressEntryEligibilityResult } from "@/lib/express-entry/types"
import { buildExpressEntryPathwayViewModel } from "@/lib/pathways/expressEntryPresentation"

export interface ExpressEntryBrief {
  statusBadgeLabel: string
  statusSummary: string
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

function toChecklistStatus(status: "eligible" | "ineligible" | "needs_more_info"): ChecklistStatus {
  if (status === "eligible") return "complete"
  if (status === "needs_more_info") return "warning"
  return "unknown"
}

function fallbackChecklistRows(): ChecklistRow[] {
  return [
    { label: "Canadian Experience Class (CEC)", status: "unknown" },
    { label: "Federal Skilled Worker (FSW)", status: "unknown" },
    { label: "Federal Skilled Trades (FST)", status: "unknown" },
  ]
}

export function buildExpressEntryBrief(
  data: AssessmentData,
  eligibility?: ExpressEntryEligibilityResult,
  resultsContext?: Pick<AssessmentResults, "pathways" | "riskFlags" | "nextSteps">,
): ExpressEntryBrief {
  if (!eligibility) {
    return {
      statusBadgeLabel: "Needs Improvement",
      statusSummary: "Complete your profile details to compute deterministic Express Entry eligibility.",
      whyIntro: "Your Express Entry result is provisional because required details are missing.",
      whyBullets: [
        "Program eligibility cannot be finalized until language, work, and education evidence is complete.",
        "Use the checklist and open questions below to complete missing inputs.",
      ],
      checklistIntro: "Program-level eligibility status:",
      checklistRows: fallbackChecklistRows(),
      checklistNote: "Missing fields must be completed for final determinations.",
      nextSteps: [
        "Complete required language test details and scores.",
        "Complete detailed work-role entries (NOC, TEER, dates, hours, authorization).",
        "Complete education and ECA details if education is foreign.",
      ],
      documentChecklist: {
        typical: [
          "Passport and identity documents",
          "Language test report details (type, date, stream, scores)",
          "Work letters with duties, hours, pay, and dates",
          "Education credentials and ECA details (if foreign)",
        ],
        sometimes: [
          "Proof of funds details",
          "Valid job-offer support details",
          "Spouse education/language details if accompanying",
        ],
        laterStage: ["Police certificates", "Medical exam", "Biometrics"],
      },
      timelines: {
        stages: [
          "Complete profile details",
          "Re-evaluate deterministic eligibility",
          "Create Express Entry profile if eligible",
          "Submit PR application if invited",
        ],
        commonDelays: [
          "Missing role-level employment details",
          "Expired or incomplete language/ECA evidence",
          "Incomplete spouse/funds details where required",
        ],
      },
      crsSignalsIntro: "CRS scoring is out of scope for this milestone; current output is eligibility-first.",
      crsSignals: [
        "Language score quality",
        "Canadian and foreign skilled work quality",
        "Education and ECA completeness",
        "Spouse factors (if accompanying)",
      ],
      crsSignalsNote: "Once profile data is complete, CRS components can be layered on accurately.",
      riskFlags: ["Eligibility is provisional until missing required profile fields are completed."],
      openQuestions: [
        "Primary language test type/date/stream/scores",
        "Detailed work role records (NOC/TEER/dates/hours)",
        "Education and ECA issue date/equivalency",
      ],
      professionalReviewCases: [
        "Criminal charges/convictions",
        "Medical admissibility concerns",
        "Misrepresentation concerns",
      ],
    }
  }

  const model = buildExpressEntryPathwayViewModel({
    assessment: data,
    eligibility,
    resultsContext,
  })

  const checklistRows: ChecklistRow[] = [
    { label: "Canadian Experience Class (CEC)", status: toChecklistStatus(eligibility.programs.cec.status) },
    { label: "Federal Skilled Worker (FSW)", status: toChecklistStatus(eligibility.programs.fsw.status) },
    { label: "Federal Skilled Trades (FST)", status: toChecklistStatus(eligibility.programs.fst.status) },
  ]

  return {
    statusBadgeLabel: model.statusBadgeLabel,
    statusSummary: model.statusSummary,
    whyIntro:
      model.status === "eligible"
        ? "You currently satisfy at least one Express Entry program gate under deterministic rule checks."
        : model.status === "low_eligibility"
          ? "Your profile has fixable gaps before final eligibility can be confirmed."
          : "Current inputs do not meet minimum Express Entry requirements.",
    whyBullets:
      model.status === "eligible"
        ? model.qualifyingFactors
        : model.status === "low_eligibility"
          ? model.missingOrWeakFactors
          : model.failedCoreRequirements,
    checklistIntro: "Program-level eligibility status:",
    checklistRows,
    checklistNote: `Rules version: ${eligibility.rulesVersion}. Outcomes shown are deterministic from your saved answers.`,
    nextSteps: model.nextActions.map((action) => action.label),
    documentChecklist: {
      typical: [
        "Passport and identity documents",
        "Language test details and score report",
        "Role-based employment records (NOC/TEER/dates/hours/pay)",
        "Education credentials and ECA details where required",
      ],
      sometimes: [
        "Proof of funds details",
        "Valid job-offer details",
        "Spouse language/education details (if accompanying)",
      ],
      laterStage: ["Police certificates", "Medical exam", "Biometrics"],
    },
    timelines: {
      stages: [
        "Complete profile gaps",
        "Re-check deterministic eligibility",
        "Create/optimize Express Entry profile",
        "Submit full application if invited",
      ],
      commonDelays: [
        "Incomplete work-role evidence",
        "Expired language/ECA records",
        "Unresolved funds or spouse-factor gaps",
      ],
    },
    crsSignalsIntro:
      model.status === "eligible"
        ? "You are currently eligible; next focus is competitiveness before or after profile creation."
        : "Eligibility-first result shown. Improve the factors below before relying on CRS competitiveness.",
    crsSignals: [
      "Language proficiency level",
      "Quality and continuity of skilled work records",
      "Education/ECA completeness",
      "Spouse factors when accompanying",
      "Provincial nomination options",
    ],
    crsSignalsNote: "Job-offer CRS points remain zero under current rules; do not count them toward CRS improvement.",
    riskFlags: model.riskFlags,
    openQuestions:
      eligibility.missingFields.length > 0
        ? eligibility.missingFields.slice(0, 8).map((field) => field.label)
        : model.missingOrWeakFactors.slice(0, 8),
    professionalReviewCases: [
      "Criminal or medical admissibility concerns",
      "Potential misrepresentation/inconsistency issues",
      "Complex refusal history or status-violation history",
      "Hard-to-document employment evidence",
    ],
  }
}
