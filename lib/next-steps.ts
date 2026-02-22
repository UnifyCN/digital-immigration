import type {
  AssessmentData,
  NextStep,
  NextStepPriority,
  PathwayCard,
  RiskFlag,
  RiskId,
} from "./types"

const priorityRank: Record<NextStepPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function hasRisk(risks: RiskFlag[], id: RiskId): boolean {
  return risks.some((risk) => risk.id === id)
}

function hasPathway(pathways: PathwayCard[], id: string): boolean {
  return pathways.some((pathway) => pathway.id === id)
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function checklist(items: string[]): { id: string; text: string }[] {
  return items.map((text, index) => ({
    id: `task-${index + 1}`,
    text,
  }))
}

function isEducationMostlyOutsideCanada(profile: AssessmentData): boolean {
  if (profile.canadaEducationStatus === "no") return true
  if (profile.canadaEducationStatus === "mix-some-in-canada") return true
  return profile.educationCountry.trim().length > 0 && profile.educationCountry.toLowerCase() !== "canada"
}

export function recommendNextSteps(
  profile: AssessmentData,
  pathways: PathwayCard[],
  risks: RiskFlag[],
): NextStep[] {
  const steps = new Map<string, NextStep>()

  const languageTestTriggered =
    profile.languageTestStatus === "no" ||
    profile.languageTestStatus === "planning" ||
    hasRisk(risks, "language_test_missing")

  if (languageTestTriggered) {
    const isMissing = profile.languageTestStatus === "no"
    const plannedTiming = profile.languagePlannedTiming || "not-scheduled"
    const timingPhrase =
      plannedTiming === "within-1-month"
        ? "within the next month"
        : plannedTiming === "1-3-months"
          ? "in the next 1-3 months"
          : plannedTiming === "3-plus-months"
            ? "in 3+ months"
            : "without a scheduled date"

    steps.set("language_test", {
      id: "language_test",
      title: "Book and complete an approved language test",
      priority: isMissing ? "high" : "medium",
      summary: isMissing
        ? "Schedule IELTS/CELPIP/TEF immediately so your profile can be scored accurately."
        : "Lock in a test date and prep plan to avoid delays in profile readiness.",
      whatThisStepIs:
        "This step ensures you have valid language results from an approved exam. Most economic pathways require these scores before key profile or application milestones.",
      whyRecommendedForYou: unique([
        profile.languageTestStatus === "no"
          ? "You indicated you do not yet have language test results."
          : "",
        profile.languageTestStatus === "planning"
          ? `You indicated your test is planned ${timingPhrase}.`
          : "",
        hasRisk(risks, "language_test_missing")
          ? "Your risk flags include missing or pending language scores."
          : "",
        hasPathway(pathways, "express-entry")
          ? "Express Entry appears relevant, and language scores directly affect CRS points."
          : "",
      ]),
      howToDoIt: [
        "Choose the most suitable approved test (IELTS General, CELPIP, or TEF/TCF if applicable).",
        "Book the earliest realistic date and note result release timelines.",
        "Set target CLB scores based on your likely pathway requirements.",
        "Create a focused prep schedule for listening, reading, writing, and speaking.",
      ],
      documentsNeeded: unique([
        "Valid passport matching the profile/application identity",
        "Test registration confirmation",
        hasPathway(pathways, "express-entry") ? "Score target plan by CLB band" : "",
      ]),
      commonMistakes: [
        "Booking too late and delaying your full application sequence.",
        "Taking the wrong exam type for the program requirements.",
        "Not checking test validity window against expected submission timing.",
      ],
      checklist: checklist([
        "Select approved language exam type",
        "Book test date",
        "Create 4-week prep plan",
        "Upload/store result report when available",
      ]),
      evidence: {
        inputs: unique([
          profile.languageTestStatus
            ? `languageTestStatus=${profile.languageTestStatus}`
            : "",
          profile.languagePlannedTiming
            ? `languagePlannedTiming=${profile.languagePlannedTiming}`
            : "",
        ]),
        pathways: hasPathway(pathways, "express-entry") ? ["express-entry"] : [],
        risks: hasRisk(risks, "language_test_missing") ? ["language_test_missing"] : [],
      },
    })
  }

  const ecaTriggered =
    (profile.ecaStatus === "no" || profile.ecaStatus === "not-sure" || hasRisk(risks, "eca_incomplete")) &&
    isEducationMostlyOutsideCanada(profile)

  if (ecaTriggered) {
    steps.set("eca", {
      id: "eca",
      title: "Start an ECA (Education Credential Assessment)",
      priority: hasPathway(pathways, "express-entry") ? "high" : "medium",
      summary:
        "Begin ECA processing now so your foreign education can be counted in immigration scoring.",
      whatThisStepIs:
        "An ECA verifies that your non-Canadian education is equivalent to a Canadian credential for immigration purposes.",
      whyRecommendedForYou: unique([
        profile.ecaStatus === "no" ? "You indicated ECA is not completed." : "",
        profile.ecaStatus === "not-sure"
          ? "You indicated ECA status is not confirmed yet."
          : "",
        isEducationMostlyOutsideCanada(profile)
          ? "Your education history appears to include credentials outside Canada."
          : "",
        hasPathway(pathways, "express-entry")
          ? "Express Entry appears relevant and typically requires ECA for foreign education points."
          : "",
        hasRisk(risks, "eca_incomplete") ? "ECA incomplete is already flagged as a risk." : "",
      ]),
      howToDoIt: [
        "Choose a designated organization (for example WES, IQAS, ICAS, or CES) based on your credential type.",
        "Request transcripts/degree records from issuing institutions exactly as required.",
        "Submit application and payment, then track document receipt.",
        "Store final ECA report details for profile entry and supporting docs.",
      ],
      documentsNeeded: unique([
        "Degree/diploma certificates",
        "Official transcripts sent per assessor instructions",
        "Identity document used for your profile",
      ]),
      commonMistakes: [
        "Sending incorrect transcript formats that cause processing holds.",
        "Assuming Canadian education does not need separate confirmation in mixed credential cases.",
        "Waiting to start ECA until after other profile steps are complete.",
      ],
      checklist: checklist([
        "Select designated ECA organization",
        "Request institution transcripts",
        "Submit ECA application",
        "Track and save ECA reference number",
      ]),
      evidence: {
        inputs: unique([
          profile.ecaStatus ? `ecaStatus=${profile.ecaStatus}` : "",
          profile.canadaEducationStatus
            ? `canadaEducationStatus=${profile.canadaEducationStatus}`
            : "",
          profile.educationCountry ? `educationCountry=${profile.educationCountry}` : "",
        ]),
        pathways: hasPathway(pathways, "express-entry") ? ["express-entry"] : [],
        risks: hasRisk(risks, "eca_incomplete") ? ["eca_incomplete"] : [],
      },
    })
  }

  const employmentGapsTriggered =
    profile.employmentGaps === "yes" || hasRisk(risks, "employment_gaps")

  if (employmentGapsTriggered) {
    const notes: string[] = []
    if (profile.nonTraditionalEmployment === "yes") {
      notes.push(
        "If your work includes self-employment/contract periods, map those periods with supporting invoices, contracts, or tax records.",
      )
    }
    if (profile.hasOverlappingPeriods === "yes") {
      notes.push(
        "Your profile indicates overlapping periods; keep one clean chronology and annotate overlaps to avoid inconsistency.",
      )
    }

    steps.set("employment_history", {
      id: "employment_history",
      title: "Create a complete personal history and draft explanation letters",
      priority: "high",
      summary:
        "Build a month-by-month timeline and explain every gap or overlap before submission.",
      whatThisStepIs:
        "This step organizes your work, education, and unemployment periods into a complete chronology with short explanations where needed.",
      whyRecommendedForYou: unique([
        profile.employmentGaps === "yes"
          ? "You indicated employment gaps in your timeline."
          : "",
        hasRisk(risks, "employment_gaps")
          ? "Employment timeline gaps are flagged as a risk."
          : "",
        profile.hasOverlappingPeriods === "yes"
          ? "You also indicated overlapping periods that need clear explanation."
          : "",
      ]),
      howToDoIt: [
        "List all activities by month (work, study, travel, caregiving, unemployed).",
        "Highlight any gap longer than one month and draft a concise explanation.",
        "Attach supporting records for each gap or unusual period.",
        "Cross-check every date against forms, resumes, and reference letters.",
      ],
      documentsNeeded: unique([
        "Updated CV with exact month/year dates",
        "Employment letters/contracts where available",
        "Evidence for non-work periods (study records, medical notes, travel records)",
      ]),
      commonMistakes: [
        "Leaving unexplained timeline gaps.",
        "Using inconsistent dates across forms and supporting documents.",
        "Providing overly long narratives instead of concise factual explanations.",
      ],
      conditionalNotes: notes.length > 0 ? notes : undefined,
      checklist: checklist([
        "Build full chronology table",
        "Draft gap explanation letters",
        "Attach evidence per gap",
        "Reconcile dates across all documents",
      ]),
      evidence: {
        inputs: unique([
          profile.employmentGaps ? `employmentGaps=${profile.employmentGaps}` : "",
          profile.hasOverlappingPeriods
            ? `hasOverlappingPeriods=${profile.hasOverlappingPeriods}`
            : "",
          profile.nonTraditionalEmployment
            ? `nonTraditionalEmployment=${profile.nonTraditionalEmployment}`
            : "",
        ]),
        pathways: [],
        risks: hasRisk(risks, "employment_gaps") ? ["employment_gaps"] : [],
      },
    })
  }

  const documentTriggered =
    profile.missingDocuments === "yes" ||
    hasRisk(risks, "missing_documents") ||
    hasRisk(risks, "multiple_countries")

  if (documentTriggered) {
    const hasMultiCountry = hasRisk(risks, "multiple_countries") || profile.multipleCountries === "yes"

    steps.set("document_plan", {
      id: "document_plan",
      title: "Build a document checklist and request long-lead items",
      priority: "high",
      summary:
        "Create a pathway-specific document tracker and start long processing items first.",
      whatThisStepIs:
        "This step creates a single source of truth for required documents, owners, and timelines so your application package is complete on submission.",
      whyRecommendedForYou: unique([
        profile.missingDocuments === "yes"
          ? "You indicated potential missing document issues."
          : "",
        hasRisk(risks, "missing_documents")
          ? "Document dependency risk is flagged in your profile."
          : "",
        hasRisk(risks, "multiple_countries")
          ? "Multiple countries of residence may add police certificate requirements."
          : "",
      ]),
      howToDoIt: [
        "List required documents by pathway and profile section.",
        "Mark each item as ready, in progress, or blocked.",
        "Request long-lead items first (police certificates, civil records, assessments).",
        "Set a weekly review cadence to close blockers early.",
      ],
      documentsNeeded: unique([
        "Government ID and civil status records",
        "Employment and education proofs",
        hasMultiCountry ? "Police certificates for each relevant country" : "",
      ]),
      commonMistakes: [
        "Treating all document requests as equal priority.",
        "Not tracking expiry windows for time-sensitive documents.",
        "Submitting without validating translation/notarization rules.",
      ],
      conditionalNotes: hasMultiCountry
        ? [
            "Because you reported multiple countries of residence, start police certificate requests from the slowest jurisdictions first.",
          ]
        : undefined,
      checklist: checklist([
        "Create document tracker",
        "Mark long-lead requests",
        "Collect and validate received documents",
        "Confirm final package completeness",
      ]),
      evidence: {
        inputs: unique([
          profile.missingDocuments ? `missingDocuments=${profile.missingDocuments}` : "",
          profile.multipleCountries ? `multipleCountries=${profile.multipleCountries}` : "",
        ]),
        pathways: [],
        risks: unique([
          hasRisk(risks, "missing_documents") ? "missing_documents" : "",
          hasRisk(risks, "multiple_countries") ? "multiple_countries" : "",
        ]),
      },
    })
  }

  if (hasPathway(pathways, "pnp")) {
    steps.set("pnp_targeting", {
      id: "pnp_targeting",
      title: "Identify target province and check stream eligibility",
      priority: "medium",
      summary: "Narrow to one or two provinces and validate the stream fit against your profile.",
      whatThisStepIs:
        "This step turns broad PNP interest into a concrete shortlist of provincial streams you can realistically target.",
      whyRecommendedForYou: unique([
        "PNP appears relevant in your pathway results.",
        profile.currentLocation === "inside-canada"
          ? "You indicated you are currently inside Canada, which can affect stream options."
          : "You indicated you are currently outside Canada, so overseas-eligible streams matter.",
        profile.preferredProvince
          ? `You listed a preferred province: ${profile.preferredProvince}.`
          : "",
      ]),
      howToDoIt: [
        "Choose 1-2 provinces aligned with your occupation, ties, and goals.",
        "Review stream criteria (occupation, language, work history, job offer expectations).",
        "Map each requirement to evidence you can provide now.",
        "Track opening windows and nomination timelines for each stream.",
      ],
      documentsNeeded: unique([
        "Occupation and work history summary",
        "Language/ECA status snapshot for eligibility checks",
        "Province-specific forms or expression-of-interest profile details",
      ]),
      commonMistakes: [
        "Applying broadly without checking stream-specific criteria.",
        "Ignoring province opening windows and intake caps.",
        "Assuming PNP requirements are identical across provinces.",
      ],
      checklist: checklist([
        "Shortlist target provinces",
        "Map each stream requirement",
        "Prepare evidence per shortlisted stream",
        "Track intake windows",
      ]),
      evidence: {
        inputs: unique([
          profile.currentLocation ? `currentLocation=${profile.currentLocation}` : "",
          profile.preferredProvince ? `preferredProvince=${profile.preferredProvince}` : "",
          profile.pnpTargetProvince ? `pnpTargetProvince=${profile.pnpTargetProvince}` : "",
        ]),
        pathways: ["pnp"],
        risks: [],
      },
    })
  }

  if (hasPathway(pathways, "express-entry")) {
    steps.set("express_entry_prep", {
      id: "express_entry_prep",
      title: "Create and prepare Express Entry profile prerequisites",
      priority: "medium",
      summary: "Finalize all inputs that affect CRS before profile submission.",
      whatThisStepIs:
        "This step prepares the core prerequisites that determine eligibility and competitiveness in the Express Entry pool.",
      whyRecommendedForYou: unique([
        "Express Entry appears relevant in your pathway results.",
        profile.totalExperience && profile.totalExperience !== "0-1"
          ? `You indicated skilled work experience (${profile.totalExperience}).`
          : "",
        profile.educationLevel && !["none", "high-school"].includes(profile.educationLevel)
          ? `You reported post-secondary education (${profile.educationLevel}).`
          : "",
      ]),
      howToDoIt: [
        "Validate language score, ECA, and work-history inputs before profile creation.",
        "Estimate CRS with realistic values and identify improvement levers.",
        "Prepare documentation proofs for every declared point claim.",
        "Create the profile only when key prerequisites are confirmed.",
      ],
      documentsNeeded: unique([
        "Language test results",
        "ECA report (if foreign education is claimed)",
        "Detailed work history evidence for declared experience",
      ]),
      commonMistakes: [
        "Claiming points without matching supporting evidence.",
        "Submitting profile with incomplete prerequisite data.",
        "Not updating profile promptly when new scores/documents arrive.",
      ],
      checklist: checklist([
        "Validate points-driving inputs",
        "Run CRS estimate",
        "Collect proof for each point claim",
        "Create/update Express Entry profile",
      ]),
      evidence: {
        inputs: unique([
          profile.totalExperience ? `totalExperience=${profile.totalExperience}` : "",
          profile.educationLevel ? `educationLevel=${profile.educationLevel}` : "",
          profile.languageTestStatus
            ? `languageTestStatus=${profile.languageTestStatus}`
            : "",
          profile.ecaStatus ? `ecaStatus=${profile.ecaStatus}` : "",
        ]),
        pathways: ["express-entry"],
        risks: [],
      },
    })
  }

  return [...steps.values()].sort((a, b) => {
    const rankDiff = priorityRank[a.priority] - priorityRank[b.priority]
    if (rankDiff !== 0) return rankDiff
    return a.title.localeCompare(b.title)
  })
}
