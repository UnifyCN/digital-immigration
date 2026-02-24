export type AuditLogicLayer = "calculation" | "presentation" | "gap"

export interface AuditSourceRef {
  filePath: string
  symbol: string
}

export interface DecisionCondition {
  id: string
  title: string
  condition: string
  thresholds: string[]
  dependencies: string[]
  outcome: string
  failState: string
  missingDataState: string
  sourceRefs: AuditSourceRef[]
}

export interface AuditSection {
  id: string
  title: string
  summary: string
  layer: AuditLogicLayer
  sourceRefs: AuditSourceRef[]
  decisionConditions: DecisionCondition[]
}

export type DecisionNodeType =
  | "process"
  | "decision"
  | "terminal-pass"
  | "terminal-fail"
  | "terminal-needs-info"
  | "gap"
  | "data"

export interface DecisionNode {
  id: string
  type: DecisionNodeType
  label: string
  detail?: string
  sourceRefs?: AuditSourceRef[]
}

export interface DecisionEdge {
  from: string
  to: string
  label?: string
}

export interface DecisionTree {
  id: string
  title: string
  summary: string
  sourceRefs: AuditSourceRef[]
  nodes: DecisionNode[]
  edges: DecisionEdge[]
}

export type RuleAssumptionStatus = "implemented" | "gap"

export interface RuleAssumption {
  domain: string
  rule: string
  currentImplementation: string
  source: string
  status: RuleAssumptionStatus
  validationNote: string
}

export interface AuditGap {
  id: string
  domain: string
  title: string
  currentBehavior: string
  expectedBehavior: string
  impact: string
  sourceRefs: AuditSourceRef[]
  status: "not_implemented" | "partial"
}

export interface EligibilityAuditModel {
  generatedAt: string
  gitCommit: string
  rulesetVersion: {
    legacyExpressEntry: string
    streamsEngine: string
  }
  sections: AuditSection[]
  decisionTrees: DecisionTree[]
  assumptions: RuleAssumption[]
  gaps: AuditGap[]
}
