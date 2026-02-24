import type {
  AssessmentData,
  AssessmentResults,
  ConfidenceLevel,
  PathwayCard,
  RiskFlag,
  TierResult,
} from "./types.ts"
import { PATHWAY_STATUS } from "./types.ts"
import { recommendNextSteps } from "./next-steps.ts"
import { deriveCanadianSkilledYearsBand } from "./work-derived.ts"
import { computeExpressEntryEligibility } from "./express-entry/eligibility.ts"
import type { ExpressEntryEligibilityResult } from "./express-entry/types.ts"

// ── Tier Classification ──

export function computeTier(data: AssessmentData): TierResult {
  const reasons: string[] = []
  let level: 1 | 2 | 3 = 1

  // Tier 3 triggers (Complex)
  if (data.criminalCharges === "yes") {
    reasons.push("Criminal charges or convictions reported")
    level = 3
  }
  if (data.misrepresentation === "yes") {
    reasons.push("Misrepresentation concern flagged")
    level = 3
  }
  if (data.medicalIssues === "yes") {
    reasons.push("Medical admissibility concern flagged")
    level = 3
  }

  if (level === 3) {
    return { level: 3, label: "Complex", reasons }
  }

  // Tier 2 triggers (Moderate)
  if (data.priorRefusals === "yes") {
    reasons.push("Prior refusal on record")
    level = 2
  }
  if (data.employmentGaps === "yes") {
    reasons.push("Employment gaps in last 10 years")
    level = 2
  }
  if (data.multipleCountries === "yes") {
    reasons.push("Lived in multiple countries (last 10 years)")
    level = 2
  }
  if (data.missingDocuments === "yes") {
    reasons.push("Missing document risk identified")
    level = 2
  }
  if (data.nonTraditionalEmployment === "yes") {
    reasons.push("Non-traditional employment history")
    level = 2
  }

  // Status expiry within 90 days
  if (data.statusExpiryDate) {
    const expiry = new Date(data.statusExpiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
      reasons.push("Status expiry within 90 days")
      level = 2
    }
  }

  // Many "unsure" answers
  const unsureFields = [
    data.priorRefusals,
    data.criminalCharges,
    data.medicalIssues,
    data.misrepresentation,
    data.multipleCountries,
    data.nonTraditionalEmployment,
    data.missingDocuments,
    data.employmentGaps,
    data.expressEntryIntentOutsideQuebec,
    data.currentlyAuthorizedToWorkInCanada,
  ]
  const unsureCount = unsureFields.filter((v) => v === "unsure").length
  const ecaUnsureCount = data.ecaStatus === "not-sure" ? 1 : 0
  if (unsureCount + ecaUnsureCount >= 3) {
    reasons.push(
      `Multiple uncertain answers (${unsureCount + ecaUnsureCount} fields marked "unsure")`,
    )
    level = Math.max(level, 2) as 1 | 2 | 3
  }

  if (level === 2) {
    return { level: 2, label: "Moderate", reasons }
  }

  return { level: 1, label: "Clean", reasons: ["No major complexity signals detected"] }
}

// ── Pathway Matching ──

function getInputCompleteness(data: AssessmentData): number {
  let filled = 0
  let total = 0

  const checks = [
    data.primaryGoal,
    data.timeUrgency,
    data.currentLocation,
    data.currentStatus,
    data.countryOfResidence,
    data.nationality,
    data.derivedCanadianSkilledYearsBand || deriveCanadianSkilledYearsBand(data),
    data.foreignSkilledYears,
    data.educationLevel,
    data.languageTestPlan,
    data.maritalStatus,
    data.expressEntryIntentOutsideQuebec,
    data.currentlyAuthorizedToWorkInCanada,
    data.fswPrimaryOccupationRoleId,
    data.fstJobOfferEmployers?.length ? "present" : "",
  ]

  for (const c of checks) {
    total++
    if (c && c !== "") filled++
  }

  return filled / total
}

function getConfidence(data: AssessmentData): ConfidenceLevel {
  const completeness = getInputCompleteness(data)
  if (completeness >= 0.8) return "High"
  if (completeness >= 0.5) return "Medium"
  return "Low"
}

export function computePathways(
  data: AssessmentData,
  expressEntryEligibility?: ExpressEntryEligibilityResult,
): PathwayCard[] {
  const pathways: PathwayCard[] = []
  const confidence = getConfidence(data)
  const isInsideCanada = data.currentLocation === "inside-canada"
  const goal = data.primaryGoal

  // Express Entry (Federal Skilled Worker / CEC / FST)
  if (goal === "pr" || goal === "not-sure") {
    const eeEligibility = expressEntryEligibility ?? computeExpressEntryEligibility(data)
    if (eeEligibility.overallStatus !== "ineligible") {
      const missingActions = eeEligibility.missingFields
        .slice(0, 2)
        .map((field) => `Complete: ${field.label}`)

      pathways.push({
        id: "express-entry",
        name: "Express Entry",
        whyRelevant:
          eeEligibility.overallStatus === "eligible"
            ? [
                "At least one federal Express Entry program is currently eligible.",
                "Permanent residence is your stated goal.",
              ]
            : [
                "Permanent residence is your stated goal.",
                "More details are needed before eligibility can be finalized.",
              ],
        whatNext:
          eeEligibility.overallStatus === "eligible"
            ? ["Review your program-level results in Express Entry details", "Keep language/ECA/work documents current"]
            : missingActions.length > 0
              ? missingActions
              : ["Complete missing profile details", "Recheck Express Entry eligibility"],
        confidence,
        statusTag: eeEligibility.overallStatus === "eligible" ? PATHWAY_STATUS.ELIGIBLE : PATHWAY_STATUS.NEEDS_INFO,
        statusNote:
          eeEligibility.overallStatus === "eligible"
            ? "You currently qualify for at least one Express Entry program."
            : `Eligibility is pending missing details (${eeEligibility.missingFields.length} fields).`,
        eligibilityStatus: eeEligibility.overallStatus,
      })
    }
  }

  // PNP
  if (goal === "pr" || goal === "work-permit" || goal === "not-sure") {
    pathways.push({
      id: "pnp",
      name: "Provincial Nominee Program (PNP)",
      whyRelevant: [
        "May complement Express Entry profile",
        isInsideCanada ? "Currently inside Canada" : "Programs available for overseas applicants",
      ],
      whatNext: [
        "Identify target province based on work/family ties",
        "Review province-specific eligibility criteria",
      ],
      confidence,
    })
  }

  // Study Permit
  if (goal === "study-permit" || goal === "not-sure") {
    pathways.push({
      id: "study-permit",
      name: "Study Permit",
      whyRelevant: [
        "Study in Canada is a stated goal",
        "May provide post-graduation work pathways",
      ],
      whatNext: [
        "Obtain acceptance from a Designated Learning Institution (DLI)",
        "Demonstrate proof of funds and ties to home country",
      ],
      confidence,
    })
  }

  // Work Permit
  if (goal === "work-permit" || goal === "not-sure") {
    pathways.push({
      id: "work-permit",
      name: "Work Permit",
      whyRelevant: [
        "Work authorization is a stated goal",
        data.currentJobTitle ? `Current/recent role: ${data.currentJobTitle}` : "Employer-specific or open permits available",
      ],
      whatNext: [
        "Determine if LMIA-based or LMIA-exempt stream applies",
        "Identify potential employer sponsorship",
      ],
      confidence,
    })
  }

  // Sponsorship
  if (goal === "sponsorship" || goal === "not-sure") {
    pathways.push({
      id: "sponsorship",
      name: "Family Sponsorship",
      whyRelevant: [
        "Sponsorship is a stated goal",
        "Spouse/partner or family member may be eligible to sponsor",
      ],
      whatNext: [
        "Confirm sponsor eligibility and minimum income requirements",
        "Gather relationship documentation",
      ],
      confidence,
    })
  }

  return pathways.slice(0, 5)
}

// ── Risk Flags ──

export function computeRiskFlags(data: AssessmentData): RiskFlag[] {
  const flags: RiskFlag[] = []

  const englishMissingOrBooked =
    (data.languageTestPlan === "english-only" || data.languageTestPlan === "both-languages") &&
    data.englishTestStatus !== "completed"
  const frenchMissingOrBooked =
    (data.languageTestPlan === "french-only" || data.languageTestPlan === "both-languages") &&
    data.frenchTestStatus !== "completed"
  const languageNeedsAction =
    data.languageTestPlan === "not-sure" || englishMissingOrBooked || frenchMissingOrBooked

  if (data.employmentGaps === "yes") {
    flags.push({
      id: "employment_gaps",
      label: "Timeline gaps likely in employment history",
      severity: "medium",
      action: "Prepare explanation letters for gaps",
    })
  }

  if (languageNeedsAction) {
    const hasNotTaken =
      data.englishTestStatus === "not-taken" || data.frenchTestStatus === "not-taken" || data.languageTestPlan === "not-sure"
    flags.push({
      id: "language_test_missing",
      label: "Missing or pending language test scores",
      severity: hasNotTaken ? "high" : "medium",
      action: hasNotTaken ? "Schedule a language test" : "Confirm planned test date",
    })
  }

  if (
    !data.currentlyAuthorizedToWorkInCanada ||
    data.currentlyAuthorizedToWorkInCanada === "not-sure"
  ) {
    flags.push({
      id: "work_authorization_unclear",
      label: "Current Canadian work authorization is unclear",
      severity: "medium",
      action: "Confirm whether you are currently authorized to work in Canada",
    })
  }

  if (data.priorRefusals === "yes") {
    flags.push({
      id: "prior_refusal",
      label: "Prior refusal needs explanation in new application",
      severity: "high",
      action: "Professional review suggested",
    })
  }

  if (data.missingDocuments === "yes") {
    flags.push({
      id: "missing_documents",
      label: "Document dependency risk identified",
      severity: "medium",
      action: "Create document checklist and begin gathering",
    })
  }

  if (data.statusExpiryDate) {
    const expiry = new Date(data.statusExpiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
      flags.push({
        id: "status_expiring",
        label: `Status expires in ~${daysUntilExpiry} days`,
        severity: daysUntilExpiry <= 30 ? "high" : "medium",
        action: "Resolve status before or alongside main application",
      })
    }
  }

  if (data.ecaStatus === "no" || data.ecaStatus === "not-sure") {
    flags.push({
      id: "eca_incomplete",
      label: "Education Credential Assessment (ECA) not completed",
      severity: "low",
      action: "Apply for ECA if pursuing Express Entry",
    })
  }

  if (data.criminalCharges === "yes") {
    flags.push({
      id: "criminal_charges",
      label: "Criminal inadmissibility concern",
      severity: "high",
      action: "Professional review suggested",
    })
  }

  if (data.medicalIssues === "yes") {
    flags.push({
      id: "medical_issues",
      label: "Medical admissibility concern",
      severity: "high",
      action: "Professional review suggested",
    })
  }

  if (data.misrepresentation === "yes") {
    flags.push({
      id: "misrepresentation",
      label: "Misrepresentation concern flagged",
      severity: "high",
      action: "Professional review suggested",
    })
  }

  if (data.multipleCountries === "yes") {
    flags.push({
      id: "multiple_countries",
      label: "Multiple countries of residence may require additional police certificates",
      severity: "low",
      action: "Begin gathering police clearance certificates",
    })
  }

  return flags
}

// ── Next Actions ──

export function computeNextActions(tier: TierResult, flags: RiskFlag[]): string[] {
  const actions: string[] = []

  actions.push("Next, you can explore scenarios to understand tradeoffs.")

  if (tier.level >= 2) {
    actions.push("Based on the flags above, a licensed professional review may be appropriate.")
  }

  const hasHighSeverity = flags.some((f) => f.severity === "high")
  if (hasHighSeverity) {
    actions.push("Consider consulting a licensed immigration consultant or lawyer for flagged items.")
  } else {
    actions.push("If you want, unlock a deeper breakdown of requirements and timelines.")
  }

  return actions.slice(0, 3)
}

// ── Combined ──

export function computeResults(data: AssessmentData): AssessmentResults {
  const tier = computeTier(data)
  const expressEntryEligibility = computeExpressEntryEligibility(data)
  const pathways = computePathways(data, expressEntryEligibility)
  const riskFlags = computeRiskFlags(data)
  const nextSteps = recommendNextSteps(data, pathways, riskFlags)
  const nextActions = nextSteps.slice(0, 3).map((step) => step.title)

  return { tier, pathways, riskFlags, nextSteps, nextActions, expressEntryEligibility }
}
