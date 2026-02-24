import test from "node:test"
import assert from "node:assert/strict"
import { derivePNPVisibility } from "./pnpVisibility.ts"

test("Case 1: inScope=false hides PNP regardless of confidence", () => {
  const result = derivePNPVisibility({
    inScope: false,
    confidenceLevel: "high",
  })

  assert.equal(result.shouldShowPNP, false)
  assert.equal(result.visibilityMode, "hidden")
  assert.equal(result.visibilityReasonCode, "not_in_pr_scope")
  assert.equal(result.displayRank, 999)
})

test("Case 2: inScope=true and high confidence gives rank 20", () => {
  const result = derivePNPVisibility({
    inScope: true,
    confidenceLevel: "high",
  })

  assert.equal(result.shouldShowPNP, true)
  assert.equal(result.visibilityMode, "visible")
  assert.equal(result.visibilityReasonCode, "pr_goal_in_scope")
  assert.equal(result.displayRank, 20)
})

test("Case 3: inScope=true and medium confidence gives rank 40", () => {
  const result = derivePNPVisibility({
    inScope: true,
    confidenceLevel: "medium",
  })

  assert.equal(result.shouldShowPNP, true)
  assert.equal(result.visibilityMode, "visible")
  assert.equal(result.displayRank, 40)
})

test("Case 4: inScope=true and low confidence gives rank 60", () => {
  const result = derivePNPVisibility({
    inScope: true,
    confidenceLevel: "low",
  })

  assert.equal(result.shouldShowPNP, true)
  assert.equal(result.visibilityMode, "visible")
  assert.equal(result.displayRank, 60)
})
