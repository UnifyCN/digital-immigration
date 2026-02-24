import type { AuditSourceRef, DecisionTree } from "./reportModel.ts"

export interface DiagramNodeLayout {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramSpec extends DecisionTree {
  layout: Record<string, DiagramNodeLayout>
}

function source(filePath: string, symbol: string): AuditSourceRef {
  return { filePath, symbol }
}

function verticalLayout(
  nodeIds: string[],
  startX = 0.24,
  startY = 0.88,
  width = 0.52,
  height = 0.09,
  gap = 0.035,
): Record<string, DiagramNodeLayout> {
  const map: Record<string, DiagramNodeLayout> = {}
  let y = startY
  for (const id of nodeIds) {
    map[id] = { x: startX, y, width, height }
    y -= height + gap
  }
  return map
}

export function buildEligibilityAuditDiagrams(): DiagramSpec[] {
  const architecture: DiagramSpec = {
    id: "input-to-engine-architecture",
    title: "Input-to-Engine Architecture",
    summary: "Shows how saved assessment input flows through calculation engines and presentation layers.",
    sourceRefs: [
      source("/lib/scoring.ts", "computeResults"),
      source("/lib/express-entry/eligibility.ts", "computeExpressEntryEligibility"),
      source("/lib/pathways/expressEntryPresentation.ts", "buildExpressEntryPathwayViewModel"),
      source("/lib/immigration/expressEntry/streamsEngine.ts", "classifyExpressEntryStreams"),
      source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
    ],
    nodes: [
      { id: "n1", type: "data", label: "AssessmentData Input" },
      { id: "n2", type: "process", label: "computeResults()", detail: "tier, pathways, risk flags, next steps" },
      { id: "n3", type: "process", label: "Legacy EE Engine", detail: "CEC/FSW/FST legacy checks + aggregate status" },
      { id: "n4", type: "process", label: "EE Presentation Mapping", detail: "eligible / low_eligibility / not_eligible" },
      { id: "n5", type: "process", label: "Streams Engine", detail: "CEC/FSW/FST authoritative stream classification" },
      { id: "n6", type: "process", label: "PNP Relevance + Province Alignment", detail: "pathway card + province shortlist scoring" },
      { id: "n7", type: "terminal-pass", label: "Rendered Results + Follow-ups" },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4" },
      { from: "n2", to: "n5" },
      { from: "n2", to: "n6" },
      { from: "n4", to: "n7" },
      { from: "n5", to: "n7" },
      { from: "n6", to: "n7" },
    ],
    layout: verticalLayout(["n1", "n2", "n3", "n4", "n5", "n6", "n7"], 0.22, 0.88, 0.56, 0.08, 0.03),
  }

  const eeStatus: DiagramSpec = {
    id: "ee-status-determination",
    title: "EE Status Determination (Legacy + Presentation)",
    summary: "Legacy eligibility outcome is mapped to user-facing status with inadmissibility and soft-ineligible logic.",
    sourceRefs: [
      source("/lib/express-entry/eligibility.ts", "computeExpressEntryEligibility"),
      source("/lib/pathways/expressEntryPresentation.ts", "toPresentationStatus"),
    ],
    nodes: [
      { id: "s1", type: "process", label: "Run checkCEC/checkFSW/checkFST" },
      { id: "s2", type: "decision", label: "Any program eligible?" },
      { id: "s3", type: "terminal-pass", label: "Legacy overallStatus = eligible" },
      { id: "s4", type: "decision", label: "Any program needs_more_info?" },
      { id: "s5", type: "terminal-needs-info", label: "Legacy overallStatus = needs_more_info" },
      { id: "s6", type: "terminal-fail", label: "Legacy overallStatus = ineligible" },
      { id: "s7", type: "decision", label: "Presentation mapping" },
      { id: "s8", type: "terminal-pass", label: "Presentation: eligible" },
      { id: "s9", type: "terminal-needs-info", label: "Presentation: low_eligibility" },
      { id: "s10", type: "terminal-fail", label: "Presentation: not_eligible" },
    ],
    edges: [
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3", label: "yes" },
      { from: "s2", to: "s4", label: "no" },
      { from: "s4", to: "s5", label: "yes" },
      { from: "s4", to: "s6", label: "no" },
      { from: "s3", to: "s7" },
      { from: "s5", to: "s7" },
      { from: "s6", to: "s7" },
      { from: "s7", to: "s8", label: "legacy eligible" },
      { from: "s7", to: "s9", label: "legacy needs_info OR soft actionable ineligible" },
      { from: "s7", to: "s10", label: "hard ineligible / inadmissibility" },
    ],
    layout: verticalLayout(["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"], 0.2, 0.9, 0.6, 0.075, 0.02),
  }

  const streamsEntry: DiagramSpec = {
    id: "streams-classification-entry-flow",
    title: "Streams Classification Entry Flow",
    summary: "Step-10 flow from opening the questionnaire to persisted follow-up and instant reclassification.",
    sourceRefs: [
      source("/components/pathways/express-entry-streams-questionnaire-page.tsx", "ExpressEntryStreamsQuestionnairePage"),
      source("/lib/immigration/expressEntry/streamsEngine.ts", "classifyExpressEntryStreams"),
      source("/lib/storage.ts", "saveAssessment"),
    ],
    nodes: [
      { id: "e1", type: "process", label: "User opens stream questionnaire page" },
      { id: "e2", type: "process", label: "Load saved assessment + run classifyExpressEntryStreams()" },
      { id: "e3", type: "process", label: "Render CEC/FSW/FST cards with reasons" },
      { id: "e4", type: "decision", label: "Missing fields returned?" },
      { id: "e5", type: "process", label: "Render deduped follow-up questions only" },
      { id: "e6", type: "process", label: "Persist answers to assessment storage" },
      { id: "e7", type: "process", label: "Debounced re-run classification" },
      { id: "e8", type: "terminal-pass", label: "Final stream result page" },
    ],
    edges: [
      { from: "e1", to: "e2" },
      { from: "e2", to: "e3" },
      { from: "e3", to: "e4" },
      { from: "e4", to: "e5", label: "yes" },
      { from: "e5", to: "e6" },
      { from: "e6", to: "e7" },
      { from: "e7", to: "e3" },
      { from: "e4", to: "e8", label: "no" },
    ],
    layout: verticalLayout(["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"], 0.22, 0.88, 0.56, 0.08, 0.028),
  }

  const cecTree: DiagramSpec = {
    id: "cec-decision-tree",
    title: "CEC Decision Tree",
    summary: "CEC checks Quebec intent, Canadian skilled role validity, language threshold, and 1,560 countable hours.",
    sourceRefs: [
      source("/lib/immigration/expressEntry/streamsEngine.ts", "checkCEC"),
      source("/lib/immigration/expressEntry/workHours.ts", "summarizeHours"),
    ],
    nodes: [
      { id: "c1", type: "decision", label: "Intent outside Quebec known?" },
      { id: "c2", type: "terminal-needs-info", label: "needs_more_info (shared.intentOutsideQuebec)" },
      { id: "c3", type: "decision", label: "Intent outside Quebec = no?" },
      { id: "c4", type: "terminal-fail", label: "ineligible (Quebec intent gate)" },
      { id: "c5", type: "decision", label: "Canadian work roles present and complete?" },
      { id: "c6", type: "terminal-needs-info", label: "needs_more_info (role identity/authorization/student/remote fields)" },
      { id: "c7", type: "decision", label: "Role filters pass?", detail: "TEER 0-3, paid, employee, authorized, not student, physically in Canada" },
      { id: "c8", type: "terminal-fail", label: "ineligible (no qualifying CEC role)" },
      { id: "c9", type: "decision", label: "Language valid + threshold met?", detail: "TEER 0/1 -> CLB7; TEER 2/3 -> CLB5; not older than 2 years" },
      { id: "c10", type: "terminal-needs-info", label: "needs_more_info (language fields invalid/missing)" },
      { id: "c11", type: "terminal-fail", label: "ineligible (language below threshold/expired)" },
      { id: "c12", type: "decision", label: "Countable hours >= 1560 in last 3 years?", detail: "30h/week cap with overlap cap" },
      { id: "c13", type: "terminal-fail", label: "ineligible (hours below minimum)" },
      { id: "c14", type: "terminal-pass", label: "eligible (CEC)" },
    ],
    edges: [
      { from: "c1", to: "c2", label: "no" },
      { from: "c1", to: "c3", label: "yes" },
      { from: "c3", to: "c4", label: "yes" },
      { from: "c3", to: "c5", label: "no" },
      { from: "c5", to: "c6", label: "no" },
      { from: "c5", to: "c7", label: "yes" },
      { from: "c7", to: "c8", label: "no" },
      { from: "c7", to: "c9", label: "yes" },
      { from: "c9", to: "c10", label: "missing" },
      { from: "c9", to: "c11", label: "invalid" },
      { from: "c9", to: "c12", label: "ok" },
      { from: "c12", to: "c13", label: "no" },
      { from: "c12", to: "c14", label: "yes" },
    ],
    layout: verticalLayout(["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14"], 0.2, 0.92, 0.6, 0.063, 0.014),
  }

  const fswTree: DiagramSpec = {
    id: "fsw-decision-tree",
    title: "FSW Decision Tree (Minimum + 67 Grid)",
    summary: "FSW enforces primary-occupation continuity, language/education minimums, funds decision, and 67-point pass mark.",
    sourceRefs: [
      source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFSW"),
      source("/lib/immigration/expressEntry/workHours.ts", "hasContinuousYearForRole"),
    ],
    nodes: [
      { id: "f1", type: "decision", label: "Intent outside Quebec known and yes?" },
      { id: "f2", type: "terminal-needs-info", label: "needs_more_info (shared.intentOutsideQuebec)" },
      { id: "f3", type: "terminal-fail", label: "ineligible (Quebec intent gate)" },
      { id: "f4", type: "decision", label: "Skilled role + language + education data complete?" },
      { id: "f5", type: "terminal-needs-info", label: "needs_more_info (work/language/education/ECA gaps)" },
      { id: "f6", type: "decision", label: "Primary occupation selected if multiple roles?" },
      { id: "f7", type: "terminal-needs-info", label: "needs_more_info (fsw.primaryOccupationRoleId)" },
      { id: "f8", type: "decision", label: "Language valid and CLB7+ all abilities?" },
      { id: "f9", type: "terminal-fail", label: "ineligible (language)" },
      { id: "f10", type: "decision", label: "1 continuous year + 1560 hours in selected primary role?" },
      { id: "f11", type: "terminal-fail", label: "ineligible (continuous work minimum)" },
      { id: "f12", type: "decision", label: "Education minimum + valid ECA (if foreign)?" },
      { id: "f13", type: "terminal-fail", label: "ineligible (education/ECA minimum)" },
      { id: "f14", type: "decision", label: "Funds exemption known?", detail: "authorized to work + valid offer => exempt" },
      { id: "f15", type: "terminal-needs-info", label: "needs_more_info (funds exemption facts missing)" },
      { id: "f16", type: "decision", label: "If funds required, family size + funds entered?" },
      { id: "f17", type: "terminal-needs-info", label: "needs_more_info (funds fields)" },
      { id: "f18", type: "decision", label: "FSW 67-point grid >= 67?" },
      { id: "f19", type: "terminal-fail", label: "ineligible (67 score below pass mark)" },
      { id: "f20", type: "terminal-pass", label: "eligible (FSW)" },
    ],
    edges: [
      { from: "f1", to: "f2", label: "unknown" },
      { from: "f1", to: "f3", label: "no" },
      { from: "f1", to: "f4", label: "yes" },
      { from: "f4", to: "f5", label: "no" },
      { from: "f4", to: "f6", label: "yes" },
      { from: "f6", to: "f7", label: "no" },
      { from: "f6", to: "f8", label: "yes" },
      { from: "f8", to: "f9", label: "no" },
      { from: "f8", to: "f10", label: "yes" },
      { from: "f10", to: "f11", label: "no" },
      { from: "f10", to: "f12", label: "yes" },
      { from: "f12", to: "f13", label: "no" },
      { from: "f12", to: "f14", label: "yes" },
      { from: "f14", to: "f15", label: "unknown" },
      { from: "f14", to: "f16", label: "known" },
      { from: "f16", to: "f17", label: "no" },
      { from: "f16", to: "f18", label: "yes" },
      { from: "f18", to: "f19", label: "no" },
      { from: "f18", to: "f20", label: "yes" },
    ],
    layout: verticalLayout(["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", "f14", "f15", "f16", "f17", "f18", "f19", "f20"], 0.18, 0.93, 0.64, 0.053, 0.01),
  }

  const fstTree: DiagramSpec = {
    id: "fst-decision-tree",
    title: "FST Decision Tree",
    summary: "FST checks trade-NOC eligibility, language, 3,120-hour threshold, offer/certificate path, and funds decision.",
    sourceRefs: [
      source("/lib/immigration/expressEntry/streamsEngine.ts", "checkFST"),
      source("/lib/immigration/expressEntry/nocLookup.ts", "isEligibleFstTradeNoc"),
    ],
    nodes: [
      { id: "t1", type: "decision", label: "Intent outside Quebec known and yes?" },
      { id: "t2", type: "terminal-needs-info", label: "needs_more_info (shared.intentOutsideQuebec)" },
      { id: "t3", type: "terminal-fail", label: "ineligible (Quebec intent gate)" },
      { id: "t4", type: "decision", label: "Trade role fields complete?" },
      { id: "t5", type: "terminal-needs-info", label: "needs_more_info (trade role fields)" },
      { id: "t6", type: "decision", label: "Eligible trade roles exist?", detail: "TEER 2/3 + eligible trade NOC + paid + not student + qualified to practice" },
      { id: "t7", type: "terminal-fail", label: "ineligible (no eligible trade role)" },
      { id: "t8", type: "decision", label: "Language valid and FST minimum met?", detail: "L/S CLB5 and R/W CLB4, test within 2 years" },
      { id: "t9", type: "terminal-needs-info", label: "needs_more_info (language fields)" },
      { id: "t10", type: "terminal-fail", label: "ineligible (language)" },
      { id: "t11", type: "decision", label: "Best eligible trade NOC has >=3120 hours in 5 years?" },
      { id: "t12", type: "terminal-fail", label: "ineligible (hours below minimum)" },
      { id: "t13", type: "decision", label: "Valid certificate OR valid 1-year offer path?" },
      { id: "t14", type: "terminal-needs-info", label: "needs_more_info (offer/certificate details missing)" },
      { id: "t15", type: "terminal-fail", label: "ineligible (no qualifying offer/certificate)" },
      { id: "t16", type: "decision", label: "Funds exemption known?" },
      { id: "t17", type: "terminal-needs-info", label: "needs_more_info (funds exemption facts)" },
      { id: "t18", type: "decision", label: "If required, funds details present?" },
      { id: "t19", type: "terminal-needs-info", label: "needs_more_info (funds fields)" },
      { id: "t20", type: "terminal-pass", label: "eligible (FST)" },
    ],
    edges: [
      { from: "t1", to: "t2", label: "unknown" },
      { from: "t1", to: "t3", label: "no" },
      { from: "t1", to: "t4", label: "yes" },
      { from: "t4", to: "t5", label: "no" },
      { from: "t4", to: "t6", label: "yes" },
      { from: "t6", to: "t7", label: "no" },
      { from: "t6", to: "t8", label: "yes" },
      { from: "t8", to: "t9", label: "missing" },
      { from: "t8", to: "t10", label: "invalid" },
      { from: "t8", to: "t11", label: "ok" },
      { from: "t11", to: "t12", label: "no" },
      { from: "t11", to: "t13", label: "yes" },
      { from: "t13", to: "t14", label: "missing" },
      { from: "t13", to: "t15", label: "no" },
      { from: "t13", to: "t16", label: "yes" },
      { from: "t16", to: "t17", label: "unknown" },
      { from: "t16", to: "t18", label: "known" },
      { from: "t18", to: "t19", label: "no" },
      { from: "t18", to: "t20", label: "yes" },
    ],
    layout: verticalLayout(["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12", "t13", "t14", "t15", "t16", "t17", "t18", "t19", "t20"], 0.18, 0.93, 0.64, 0.053, 0.01),
  }

  const pnpRelevance: DiagramSpec = {
    id: "pnp-relevance-flow",
    title: "PNP Relevance Flow",
    summary: "Pathway relevance decision used to include the PNP card in pathway results.",
    sourceRefs: [source("/lib/scoring.ts", "computePathways")],
    nodes: [
      { id: "p1", type: "decision", label: "Primary goal in {PR, Work Permit, Not Sure}?" },
      { id: "p2", type: "terminal-fail", label: "No PNP card injected" },
      { id: "p3", type: "process", label: "Inject PNP card", detail: "whyRelevant + whatNext boilerplate" },
      { id: "p4", type: "terminal-pass", label: "PNP pathway card shown" },
    ],
    edges: [
      { from: "p1", to: "p2", label: "no" },
      { from: "p1", to: "p3", label: "yes" },
      { from: "p3", to: "p4" },
    ],
    layout: verticalLayout(["p1", "p2", "p3", "p4"], 0.22, 0.82, 0.56, 0.11, 0.06),
  }

  const provinceAlignment: DiagramSpec = {
    id: "province-alignment-scoring-flow",
    title: "Province Alignment Scoring Flow",
    summary: "Questionnaire answers are weighted per province, normalized to 0-100, then sorted into top recommendations.",
    sourceRefs: [
      source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
      source("/lib/pathways/provinceFinder.ts", "topProvinceRecommendations"),
    ],
    nodes: [
      { id: "a1", type: "data", label: "ProvinceFinderAnswers input" },
      { id: "a2", type: "process", label: "Iterate province profiles (BC, AB, ON, SK, MB)" },
      { id: "a3", type: "process", label: "Apply factor weights", detail: "employer support, tenure, wage, rural, education, funds, french, sector" },
      { id: "a4", type: "decision", label: "Add risk flags?", detail: "prior refusal, licensure, employer support, funds, residence intent" },
      { id: "a5", type: "process", label: "Normalize raw score to 0-100 and assign label" },
      { id: "a6", type: "process", label: "Sort descending + top shortlist" },
      { id: "a7", type: "terminal-pass", label: "Province recommendations (top 3)" },
    ],
    edges: [
      { from: "a1", to: "a2" },
      { from: "a2", to: "a3" },
      { from: "a3", to: "a4" },
      { from: "a4", to: "a5" },
      { from: "a5", to: "a6" },
      { from: "a6", to: "a7" },
    ],
    layout: verticalLayout(["a1", "a2", "a3", "a4", "a5", "a6", "a7"], 0.2, 0.88, 0.6, 0.09, 0.03),
  }

  const pnpGap: DiagramSpec = {
    id: "pnp-base-enhanced-gap",
    title: "PNP Base vs Enhanced Classification Gap",
    summary: "Explicitly marks that the app does not implement deterministic base/enhanced stream classification.",
    sourceRefs: [
      source("/lib/scoring.ts", "computePathways"),
      source("/lib/pathways/provinceFinder.ts", "computeProvinceRecommendations"),
    ],
    nodes: [
      { id: "g1", type: "decision", label: "Classify candidate as PNP Base vs Enhanced?" },
      { id: "g2", type: "gap", label: "Not implemented in current codebase" },
      { id: "g3", type: "terminal-needs-info", label: "Manual/legal review required for stream-level matching" },
    ],
    edges: [
      { from: "g1", to: "g2" },
      { from: "g2", to: "g3" },
    ],
    layout: verticalLayout(["g1", "g2", "g3"], 0.2, 0.76, 0.6, 0.12, 0.08),
  }

  return [
    architecture,
    eeStatus,
    streamsEntry,
    cecTree,
    fswTree,
    fstTree,
    pnpRelevance,
    provinceAlignment,
    pnpGap,
  ]
}
