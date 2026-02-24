import { EXPRESS_ENTRY_RULES_VERSION } from "../../express-entry/rules.ts"
import { defaultAssessmentData } from "../../storage.ts"
import { classifyExpressEntryStreams } from "../../immigration/expressEntry/streamsEngine.ts"
import { buildEligibilityAuditDiagrams } from "./diagramSpecs.ts"
import type {
  AuditGap,
  AuditSection,
  AuditSourceRef,
  EligibilityAuditModel,
  RuleAssumption,
} from "./reportModel.ts"

function source(filePath: string, symbol: string): AuditSourceRef {
  return { filePath, symbol }
}

function buildSections(): AuditSection[] {
  return [
    {
      id: "system-architecture",
      title: "System Architecture",
      summary:
        "Assessment inputs flow through calculation engines first, then presentation/view-model logic for pathway cards and summaries.",
      layer: "calculation",
      sourceRefs: [
        source("/lib/scoring.ts", "computeResults"),
        source("/lib/express-entry/eligibility.ts", "computeExpressEntryEligibility"),
        source("/lib/pathways/expressEntryPresentation.ts", "buildExpressEntryPathwayViewModel"),
        source("/lib/immigration/expressEntry/streamsEngine.ts", "classifyExpressEntryStreams"),
        source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
      ],
      decisionConditions: [
        {
          id: "architecture-1",
          title: "Main Results Pipeline",
          condition:
            "computeResults(data) always computes tier, legacy EE eligibility, pathways, risk flags, and next steps from current AssessmentData.",
          thresholds: [],
          dependencies: [
            "computeTier",
            "computeExpressEntryEligibility",
            "computePathways",
            "computeRiskFlags",
            "recommendNextSteps",
          ],
          outcome:
            "The result object includes both machine-facing eligibility structures and UI-facing cards/actions.",
          failState: "No hard fail state in orchestration; downstream engines carry pass/fail/needs_info statuses.",
          missingDataState:
            "Missing data is represented as needs_more_info in EE engines and as lower confidence in pathway/risk calculations.",
          sourceRefs: [source("/lib/scoring.ts", "computeResults")],
        },
      ],
    },
    {
      id: "ee-overall-status",
      title: "EE Overall Status",
      summary:
        "Legacy EE engine computes program-level statuses, then presentation mapping converts those statuses to UI labels.",
      layer: "presentation",
      sourceRefs: [
        source("/lib/express-entry/eligibility.ts", "overallStatusForPrograms"),
        source("/lib/pathways/expressEntryPresentation.ts", "toPresentationStatus"),
      ],
      decisionConditions: [
        {
          id: "ee-status-1",
          title: "Legacy Overall Status Aggregation",
          condition:
            "If any of CEC/FSW/FST is eligible => overall eligible; else if any needs_more_info => overall needs_more_info; else ineligible.",
          thresholds: [],
          dependencies: ["checkCEC", "checkFSW", "checkFST", "uniqueMissingFields"],
          outcome: "Legacy status drives whether Express Entry pathway card is eligible, needs info, or hidden.",
          failState: "overallStatus = ineligible when no program is eligible and no missing-data path remains.",
          missingDataState: "overallStatus = needs_more_info when at least one program is unresolved.",
          sourceRefs: [source("/lib/express-entry/eligibility.ts", "computeExpressEntryEligibility")],
        },
        {
          id: "ee-status-2",
          title: "Presentation Status Mapping",
          condition:
            "eligible -> eligible; needs_more_info -> low_eligibility; ineligible -> low_eligibility only for actionable soft-ineligible reasons without hard inadmissibility blockers, otherwise not_eligible.",
          thresholds: [],
          dependencies: ["isSoftIneligible", "hasHardInadmissibilityBlockers", "ACTIONABLE_SOFT_INELIGIBLE_CODES"],
          outcome: "UI badge/status summary can show low_eligibility despite legacy ineligible when gaps are actionable.",
          failState:
            "Hard inadmissibility flags (criminal/medical/misrepresentation) force not_eligible presentation when overall status is ineligible.",
          missingDataState: "Missing fields are surfaced as low_eligibility with targeted next actions.",
          sourceRefs: [source("/lib/pathways/expressEntryPresentation.ts", "toPresentationStatus")],
        },
      ],
    },
    {
      id: "ee-streams-orchestrator",
      title: "EE Streams Orchestrator",
      summary:
        "Streams engine normalizes profile data, runs CEC/FSW/FST checks, and generates deduped follow-up questions from missing fields.",
      layer: "calculation",
      sourceRefs: [
        source("/lib/immigration/expressEntry/streamsEngine.ts", "buildProfileFromAnswers"),
        source("/lib/immigration/expressEntry/streamsEngine.ts", "classifyExpressEntryStreams"),
        source("/lib/immigration/expressEntry/followUpQuestions.ts", "buildFollowUpQuestions"),
      ],
      decisionConditions: [
        {
          id: "streams-orchestrator-1",
          title: "Profile Normalization",
          condition:
            "AssessmentData is transformed to CandidateProfile with role-level fields (NOC/TEER/dates/hours/paid/employment/authorization/student flags), language metadata, and FST offer-employer array.",
          thresholds: ["FST employers capped to 2 in normalization output"],
          dependencies: ["buildProfileFromAnswers", "normalizeLanguageTest"],
          outcome: "Program checks consume a consistent profile regardless of legacy vs new intake shape.",
          failState: "Invalid/incomplete normalized values cause program checks to return ineligible or needs_more_info.",
          missingDataState:
            "Unresolved fields are kept as empty/null sentinels and translated into explicit missingFields by each checker.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "buildProfileFromAnswers")],
        },
        {
          id: "streams-orchestrator-2",
          title: "Classification Output",
          condition:
            "checkCEC/checkFSW/checkFST run with same asOfDate; eligiblePrograms is the set of programs where status=eligible; nextQuestions are generated from union of missing fields.",
          thresholds: ["rulesetDate included in result", "asOfDate serialized as YYYY-MM-DD"],
          dependencies: ["checkCEC", "checkFSW", "checkFST", "buildFollowUpQuestions"],
          outcome:
            "Single payload returns program cards, reasons, machine-readable missing fields, and dynamic follow-up prompts.",
          failState: "Programs with unmet thresholds return ineligible with reasons.",
          missingDataState: "Programs with unresolved required inputs return needs_more_info and missing field keys.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "classifyExpressEntryStreams")],
        },
      ],
    },
    {
      id: "cec-logic",
      title: "CEC Logic",
      summary:
        "CEC requires qualifying Canadian skilled work, valid language, and 1,560 countable hours in a 3-year window.",
      layer: "calculation",
      sourceRefs: [
        source("/lib/immigration/expressEntry/streamsEngine.ts", "checkCEC"),
        source("/lib/immigration/expressEntry/workHours.ts", "summarizeHours"),
      ],
      decisionConditions: [
        {
          id: "cec-1",
          title: "Quebec Intent Gate",
          condition:
            "If intentOutsideQuebec is unknown/not-sure => needs_more_info; if intentOutsideQuebec=no => ineligible.",
          thresholds: [],
          dependencies: ["evaluateQuebecGate"],
          outcome: "CEC only proceeds when intent is clearly outside Quebec.",
          failState: "ineligible with reason: Express Entry requires intent to live outside Quebec.",
          missingDataState: "needs_more_info with missing field shared.intentOutsideQuebec.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "evaluateQuebecGate")],
        },
        {
          id: "cec-2",
          title: "Role Completeness and Qualifying Filters",
          condition:
            "Canadian roles must have valid NOC/TEER/dates/hours/paid/employment/authorization/student/physical-in-Canada fields; qualifying roles require TEER 0-3, paid, employee, authorized=yes, student=no, physicallyInCanada=yes.",
          thresholds: [],
          dependencies: ["resolveRoleTeer", "isValidNocCode", "isSkilledTeer"],
          outcome: "Only compliant Canadian roles are counted toward CEC minimum hours.",
          failState: "ineligible when no qualifying roles remain after CEC-specific exclusions.",
          missingDataState: "needs_more_info when any required role field is missing/unknown.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkCEC")],
        },
        {
          id: "cec-3",
          title: "Language + Hours Threshold",
          condition:
            "Language threshold is CLB7 all abilities if any qualifying TEER 0/1 role exists; otherwise CLB5 all abilities. Countable hours in last 3 years must be >=1560 with a 30-hour/week overlap cap.",
          thresholds: ["CEC_MIN_HOURS=1560", "WORK_WINDOW_YEARS=3", "HOURS_PER_WEEK_CAP=30", "LANGUAGE_VALIDITY_YEARS=2"],
          dependencies: ["evaluateLanguage", "summarizeHours"],
          outcome: "CEC status eligible only when both language validity and minimum hours pass.",
          failState: "ineligible for expired/below-threshold language or insufficient hours.",
          missingDataState: "needs_more_info when language metadata/scores are missing or invalid test type/stream.",
          sourceRefs: [
            source("/lib/immigration/expressEntry/streamsEngine.ts", "checkCEC"),
            source("/lib/immigration/expressEntry/workHours.ts", "summarizeHours"),
          ],
        },
      ],
    },
    {
      id: "fsw-logic",
      title: "FSW Logic",
      summary:
        "FSW enforces minimum requirements, continuity in a selected primary role, funds decisioning, and the 67-point grid.",
      layer: "calculation",
      sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFSW")],
      decisionConditions: [
        {
          id: "fsw-1",
          title: "Required Data and Primary Occupation Selection",
          condition:
            "Skilled role identity fields, language metadata, and education/ECA data must be complete. If multiple skilled roles exist, fswPrimaryOccupationRoleId is required.",
          thresholds: [],
          dependencies: ["resolveRoleTeer", "isValidNocCode", "bestEducationLevel", "hasValidEca"],
          outcome: "FSW minimum check is anchored to one selected primary role and complete profile factors.",
          failState: "ineligible when minimum conditions fail after data is complete.",
          missingDataState: "needs_more_info when any required factor or primary role selection is missing.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFSW")],
        },
        {
          id: "fsw-2",
          title: "Minimum Program Thresholds",
          condition:
            "Language must be valid and CLB7+, selected primary role must satisfy 1 continuous year and 1,560 hours in 10 years, and education must be at least secondary with valid ECA if foreign.",
          thresholds: [
            "FSW_MIN_HOURS=1560",
            "WORK_WINDOW_YEARS=10",
            "LANGUAGE_VALIDITY_YEARS=2",
            "ECA_VALIDITY_YEARS=5",
          ],
          dependencies: ["evaluateLanguage", "hasContinuousYearForRole", "summarizeHours"],
          outcome: "Only candidates passing all minimums proceed to funds decision and 67 grid scoring.",
          failState: "ineligible for language, continuity/hours, or education minimum failures.",
          missingDataState: "needs_more_info if any prerequisite data is incomplete.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFSW")],
        },
        {
          id: "fsw-3",
          title: "Funds Decision and 67-Point Grid",
          condition:
            "Funds requirement is exempt only when authorized to work in Canada and valid offer status supports exemption; otherwise funds family size + available CAD must be provided. Grid uses language, education, experience, age, arranged employment, adaptability; pass mark is 67.",
          thresholds: ["FSW_PASS_MARK=67"],
          dependencies: [
            "determineFundsRequirement",
            "fswLanguagePoints",
            "fswEducationPoints",
            "fswExperiencePoints",
            "fswAgePoints",
          ],
          outcome: "FSW eligible requires completed funds branch and score >=67.",
          failState: "ineligible when final 67 score is below pass mark.",
          missingDataState:
            "needs_more_info for unresolved funds exemption facts, funds fields, spouse language, or spouse education when spouse is accompanying.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFSW")],
        },
      ],
    },
    {
      id: "fst-logic",
      title: "FST Logic",
      summary:
        "FST requires eligible trade-NOC work history, language minimums, 3,120 hours in one eligible trade NOC, and a valid certificate or offer path.",
      layer: "calculation",
      sourceRefs: [
        source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFST"),
        source("/lib/immigration/expressEntry/nocLookup.ts", "isEligibleFstTradeNoc"),
      ],
      decisionConditions: [
        {
          id: "fst-1",
          title: "Trade Role Completeness and Eligibility",
          condition:
            "Role must include identity/work fields plus student and qualified-to-practice flags; eligible trade roles require paid=true, TEER 2/3, NOC in defined FST trade groups, student=no, qualifiedToPractice=yes.",
          thresholds: [],
          dependencies: ["resolveRoleTeer", "isEligibleFstTradeNoc"],
          outcome: "Only eligible trade roles are grouped by NOC for hour counting.",
          failState: "ineligible when no eligible trade roles remain.",
          missingDataState: "needs_more_info when role details are incomplete.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFST")],
        },
        {
          id: "fst-2",
          title: "Language + Trade Hours Minimum",
          condition:
            "Language requires L/S >= CLB5 and R/W >= CLB4 with valid approved test within 2 years. Best single eligible trade NOC must reach 3,120 countable hours in the last 5 years.",
          thresholds: ["FST_MIN_HOURS=3120", "WORK_WINDOW_YEARS=5", "LANGUAGE_VALIDITY_YEARS=2", "HOURS_PER_WEEK_CAP=30"],
          dependencies: ["evaluateLanguage", "summarizeHours"],
          outcome: "FST advances only when language and one-trade-NOC hour threshold are met.",
          failState: "ineligible for language or minimum-hour failure.",
          missingDataState: "needs_more_info when language metadata/scores are incomplete.",
          sourceRefs: [
            source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFST"),
            source("/lib/immigration/expressEntry/workHours.ts", "summarizeHours"),
          ],
        },
        {
          id: "fst-3",
          title: "Offer/Certificate Path + Funds",
          condition:
            "Candidate must have either complete certificate details or at least one valid offer among up to two employers (paid=yes, fullTime=yes, continuous=yes, >=30 hours/week, >=12 months). Funds decision mirrors authorized+offer exemption logic.",
          thresholds: ["Offer duration >=12 months", "Offer hours/week >=30", "Max employers considered = 2"],
          dependencies: ["evaluateFstOffer", "determineFundsRequirement"],
          outcome: "FST eligible only after qualifying offer/certificate path and resolved funds branch.",
          failState: "ineligible when neither qualifying certificate nor qualifying offer exists.",
          missingDataState: "needs_more_info for incomplete offer/certificate or unresolved funds fields.",
          sourceRefs: [source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFST")],
        },
      ],
    },
    {
      id: "pnp-pathway-relevance",
      title: "PNP Pathway Relevance",
      summary:
        "PNP in current implementation is pathway-card relevance logic tied primarily to stated immigration goal, not stream-level legal eligibility.",
      layer: "presentation",
      sourceRefs: [source("/lib/scoring.ts", "computePathways")],
      decisionConditions: [
        {
          id: "pnp-relevance-1",
          title: "PNP Card Inclusion",
          condition:
            "PNP card is added when primaryGoal is 'pr', 'work-permit', or 'not-sure'.",
          thresholds: [],
          dependencies: ["computePathways"],
          outcome: "PNP appears as a relevant pathway with generic why/next guidance.",
          failState: "No PNP card when goal is outside supported set.",
          missingDataState: "No explicit needs_more_info status; confidence decreases indirectly via input completeness.",
          sourceRefs: [source("/lib/scoring.ts", "computePathways")],
        },
      ],
    },
    {
      id: "pnp-province-alignment",
      title: "PNP Province Alignment",
      summary:
        "Province finder computes weighted alignment scores (0-100) for BC/AB/ON/SK/MB from questionnaire answers and ranks recommendations.",
      layer: "calculation",
      sourceRefs: [source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations")],
      decisionConditions: [
        {
          id: "pnp-alignment-1",
          title: "Weighted Provincial Scoring",
          condition:
            "Each province profile applies multipliers over factors (employer support, tenure, wage, rural preference, education, funds, French, sector). Raw score is normalized by denominator 140 to 0-100.",
          thresholds: ["NORMALIZATION_DENOMINATOR=140", "Labels: >=70 Strong, >=45 Moderate, else Exploratory"],
          dependencies: ["computeProvinceRecommendations", "scoreLabel", "buildRiskFlags"],
          outcome: "Returns sorted recommendation list with whyBullets, riskFlags, and whatToConfirmNext.",
          failState: "No strict fail/ineligible; outputs always produced for provided answers.",
          missingDataState:
            "Draft completion is validated separately; incomplete answers can still reduce factor points or trigger confirmation prompts.",
          sourceRefs: [source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations")],
        },
      ],
    },
    {
      id: "audit-gaps",
      title: "Audit Gaps",
      summary:
        "Critical logic not currently implemented is explicitly captured to prevent over-claiming deterministic eligibility coverage.",
      layer: "gap",
      sourceRefs: [
        source("/lib/scoring.ts", "computePathways"),
        source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
      ],
      decisionConditions: [
        {
          id: "gap-1",
          title: "PNP Base vs Enhanced",
          condition: "No deterministic classifier exists for base vs enhanced PNP stream determination.",
          thresholds: [],
          dependencies: [],
          outcome: "Current output is relevance + province alignment, not legal stream eligibility.",
          failState: "Cannot return base/enhanced status from current engines.",
          missingDataState: "No follow-up workflow exists in code to close this gap today.",
          sourceRefs: [
            source("/lib/scoring.ts", "computePathways"),
            source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
          ],
        },
      ],
    },
  ]
}

function buildGaps(): AuditGap[] {
  return [
    {
      id: "pnp-base-enhanced-missing",
      domain: "PNP",
      title: "Base vs Enhanced PNP classification is not implemented",
      currentBehavior:
        "PNP is surfaced as a pathway card plus province-alignment score shortlist without deterministic stream-category classification.",
      expectedBehavior:
        "Given candidate profile + province-specific rules, classify or narrow Base vs Enhanced stream categories deterministically.",
      impact:
        "Users and reviewers can over-interpret a province alignment score as legal stream eligibility; manual review remains required.",
      sourceRefs: [
        source("/lib/scoring.ts", "computePathways"),
        source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
      ],
      status: "not_implemented",
    },
  ]
}

function buildAssumptions(): RuleAssumption[] {
  return [
    {
      domain: "Express Entry Legacy",
      rule: "CEC minimum hours",
      currentImplementation: "Eligible only when countable Canadian qualifying work hours >= 1,560 in 3-year window.",
      source: "/lib/express-entry/rules.ts (CEC_MIN_HOURS), /lib/express-entry/eligibility.ts (checkCEC)",
      status: "implemented",
      validationNote: "Hour counting uses 30-hour/week cap and overlap suppression via normalizeWorkHours.",
    },
    {
      domain: "Express Entry Legacy",
      rule: "FSW continuity + minimum hours",
      currentImplementation:
        "Requires one continuous countable year and >=1,560 skilled paid hours in 10-year window before scoring grid.",
      source: "/lib/express-entry/eligibility.ts (checkFSW), /lib/express-entry/work-normalization.ts",
      status: "implemented",
      validationNote: "Continuity checked with contiguous-day streak and countable-hours threshold.",
    },
    {
      domain: "Express Entry Legacy",
      rule: "FST minimum hours",
      currentImplementation: "Requires >=3,120 countable skilled-trade hours in 5-year window.",
      source: "/lib/express-entry/rules.ts (FST_MIN_HOURS), /lib/express-entry/eligibility.ts (checkFST)",
      status: "implemented",
      validationNote: "Legacy skilled-trade detection depends on role.isSkilledTradeRole and TEER 2/3.",
    },
    {
      domain: "Express Entry (Both Engines)",
      rule: "Language validity window",
      currentImplementation: "Language test validity is enforced at 2 years before asOfDate.",
      source: "/lib/express-entry/rules.ts (LANGUAGE_VALIDITY_YEARS), /lib/express-entry/clb.ts, /lib/immigration/expressEntry/streamsEngine.ts",
      status: "implemented",
      validationNote: "Expired tests are fail states; missing/invalid metadata can become needs_more_info.",
    },
    {
      domain: "Express Entry (Both Engines)",
      rule: "ECA validity window",
      currentImplementation: "Foreign-education ECA treated as valid when issue date is within 5 years and equivalency exists.",
      source: "/lib/express-entry/rules.ts (ECA_VALIDITY_YEARS), /lib/express-entry/eligibility.ts, /lib/immigration/expressEntry/streamsEngine.ts",
      status: "implemented",
      validationNote: "Missing/expired ECA fields typically route to needs_more_info.",
    },
    {
      domain: "Express Entry (Both Engines)",
      rule: "Work-hour cap",
      currentImplementation: "Countable work is capped at 30 hours/week total, including overlap handling.",
      source: "/lib/express-entry/rules.ts (HOURS_PER_WEEK_CAP), /lib/express-entry/work-normalization.ts, /lib/immigration/expressEntry/workHours.ts",
      status: "implemented",
      validationNote: "Concurrent jobs do not inflate countable hours above cap.",
    },
    {
      domain: "Streams Engine",
      rule: "Quebec intent gate",
      currentImplementation:
        "Unknown intent => needs_more_info; intent to live in Quebec => ineligible across CEC/FSW/FST.",
      source: "/lib/immigration/expressEntry/streamsEngine.ts (evaluateQuebecGate)",
      status: "implemented",
      validationNote: "Gate is applied at start of each stream checker.",
    },
    {
      domain: "Streams Engine",
      rule: "Invalid language test type/stream",
      currentImplementation:
        "Unapproved test type, wrong stream, or missing language metadata returns needs_more_info rather than CLB conversion.",
      source: "/lib/immigration/expressEntry/streamsEngine.ts (evaluateLanguage)",
      status: "implemented",
      validationNote: "Approved types are restricted to IELTS General, CELPIP General, TEF, TCF, PTE Core.",
    },
    {
      domain: "Streams Engine",
      rule: "Funds required vs exempt",
      currentImplementation:
        "Decision = exempt/required/needs_more_info from authorized-work status + qualifying offer/funds-exempt flags; thresholds are not validated here.",
      source: "/lib/immigration/expressEntry/streamsEngine.ts (determineFundsRequirement)",
      status: "implemented",
      validationNote: "Amount thresholds are out of scope in current implementation.",
    },
    {
      domain: "PNP",
      rule: "Base vs enhanced stream classification",
      currentImplementation:
        "Not implemented. Current logic provides pathway relevance and province scoring, not legal stream-category classification.",
      source: "/lib/scoring.ts (computePathways), /lib/pathways/provinceFinder.ts (computeProvinceRecommendations)",
      status: "gap",
      validationNote: "Requires dedicated deterministic rules per province and stream family.",
    },
  ]
}

export interface BuildEligibilityAuditModelOptions {
  generatedAt?: Date
  gitCommit?: string
}

export function buildEligibilityAuditModel(
  options: BuildEligibilityAuditModelOptions = {},
): EligibilityAuditModel {
  const now = options.generatedAt ?? new Date()
  const streamsProbe = classifyExpressEntryStreams(defaultAssessmentData, now)

  return {
    generatedAt: now.toISOString(),
    gitCommit: options.gitCommit ?? "unknown",
    rulesetVersion: {
      legacyExpressEntry: EXPRESS_ENTRY_RULES_VERSION,
      streamsEngine: streamsProbe.rulesetDate,
    },
    sections: buildSections(),
    decisionTrees: buildEligibilityAuditDiagrams(),
    assumptions: buildAssumptions(),
    gaps: buildGaps(),
  }
}
