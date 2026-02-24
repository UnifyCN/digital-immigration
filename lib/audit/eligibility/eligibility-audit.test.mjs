import test from "node:test"
import assert from "node:assert/strict"
import { PDFDocument } from "pdf-lib"
import { buildEligibilityAuditModel } from "./extractLogic.ts"
import { buildEligibilityAuditDiagrams } from "./diagramSpecs.ts"
import { renderEligibilityAuditPdf } from "./renderPdf.ts"

function fixedModel() {
  return buildEligibilityAuditModel({
    generatedAt: new Date("2026-02-24T00:00:00Z"),
    gitCommit: "test-commit",
  })
}

test("audit model captures required EE and work-hour constants/thresholds", () => {
  const model = fixedModel()
  const thresholdText = model.sections
    .flatMap((section) => section.decisionConditions)
    .flatMap((condition) => condition.thresholds)
    .join(" | ")

  assert.match(thresholdText, /1560/)
  assert.match(thresholdText, /3120/)
  assert.match(thresholdText, /67/)
  assert.match(thresholdText, /2/)
  assert.match(thresholdText, /5/)
  assert.match(thresholdText, /30/)

  assert.ok(model.rulesetVersion.legacyExpressEntry.length > 0)
  assert.equal(model.rulesetVersion.streamsEngine, "2026-02-24")
})

test("diagram specs include all required flowcharts and key decision nodes", () => {
  const diagrams = buildEligibilityAuditDiagrams()
  const ids = new Set(diagrams.map((diagram) => diagram.id))

  const requiredDiagramIds = [
    "input-to-engine-architecture",
    "ee-status-determination",
    "streams-classification-entry-flow",
    "cec-decision-tree",
    "fsw-decision-tree",
    "fst-decision-tree",
    "pnp-relevance-flow",
    "province-alignment-scoring-flow",
    "pnp-base-enhanced-gap",
  ]

  for (const id of requiredDiagramIds) {
    assert.ok(ids.has(id), `Missing diagram: ${id}`)
  }

  const fsw = diagrams.find((diagram) => diagram.id === "fsw-decision-tree")
  assert.ok(fsw)
  assert.ok(fsw.nodes.some((node) => /continuous year/i.test(node.label)))
  assert.ok(fsw.nodes.some((node) => /67-point/i.test(node.label)))

  const cec = diagrams.find((diagram) => diagram.id === "cec-decision-tree")
  assert.ok(cec)
  assert.ok(cec.nodes.some((node) => /canadian work/i.test(node.label.toLowerCase())))
  assert.ok(cec.nodes.some((node) => /1560/i.test(node.label.toLowerCase()) || /1560/i.test(node.detail ?? "")))

  const fst = diagrams.find((diagram) => diagram.id === "fst-decision-tree")
  assert.ok(fst)
  assert.ok(fst.nodes.some((node) => /trade NOC/i.test(node.detail ?? "")))
  assert.ok(fst.nodes.some((node) => /3120/i.test(node.label + (node.detail ?? ""))))
})

test("audit model contains explicit PNP base/enhanced not-implemented gap", () => {
  const model = fixedModel()
  const gap = model.gaps.find((item) => item.id === "pnp-base-enhanced-missing")
  assert.ok(gap)
  assert.equal(gap.status, "not_implemented")
  assert.match(gap.title.toLowerCase(), /base.*enhanced/)
})

test("renderEligibilityAuditPdf generates parseable PDF", async () => {
  const pdfBytes = await renderEligibilityAuditPdf(fixedModel())
  assert.ok(pdfBytes.length > 30_000)

  const parsed = await PDFDocument.load(pdfBytes)
  assert.ok(parsed.getPageCount() >= 8)
})

test("audit model structure snapshot remains stable", () => {
  const model = fixedModel()
  const snapshot = {
    sectionIds: model.sections.map((section) => section.id),
    decisionTreeIds: model.decisionTrees.map((tree) => tree.id),
    assumptionsCount: model.assumptions.length,
    gaps: model.gaps.map((gap) => gap.id),
    rulesetVersion: model.rulesetVersion,
  }

  assert.deepEqual(snapshot, {
    sectionIds: [
      "system-architecture",
      "ee-overall-status",
      "ee-streams-orchestrator",
      "cec-logic",
      "fsw-logic",
      "fst-logic",
      "pnp-pathway-relevance",
      "pnp-province-alignment",
      "audit-gaps",
    ],
    decisionTreeIds: [
      "input-to-engine-architecture",
      "ee-status-determination",
      "streams-classification-entry-flow",
      "cec-decision-tree",
      "fsw-decision-tree",
      "fst-decision-tree",
      "pnp-relevance-flow",
      "province-alignment-scoring-flow",
      "pnp-base-enhanced-gap",
    ],
    assumptionsCount: 10,
    gaps: ["pnp-base-enhanced-missing"],
    rulesetVersion: {
      legacyExpressEntry: "EE-MILESTONE-ELIGIBILITY-2026-02-23",
      streamsEngine: "2026-02-24",
    },
  })
})
