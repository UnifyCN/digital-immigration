import test from "node:test"
import assert from "node:assert/strict"
import { isPNPInScope } from "./pnp-scope.ts"

test("returns true when goal is Permanent Residence", () => {
  assert.equal(isPNPInScope({ primaryGoal: "Permanent Residence" }), true)
  assert.equal(isPNPInScope({ primaryGoal: "pr" }), true)
})

test("returns true when goal is not sure / exploring PR", () => {
  assert.equal(isPNPInScope({ primaryGoal: "Not sure / exploring PR" }), true)
  assert.equal(isPNPInScope({ primaryGoal: "not-sure" }), true)
  assert.equal(isPNPInScope({ primaryGoal: "unsure" }), true)
})

test("returns false for non-PR-only goals", () => {
  assert.equal(isPNPInScope({ primaryGoal: "Study" }), false)
  assert.equal(isPNPInScope({ primaryGoal: "Work temporarily" }), false)
  assert.equal(isPNPInScope({ primaryGoal: "Visit" }), false)
  assert.equal(isPNPInScope({ primaryGoal: "study-permit" }), false)
  assert.equal(isPNPInScope({ primaryGoal: "work-permit" }), false)
})

test("returns true when multiple selections include PR goal", () => {
  assert.equal(isPNPInScope({ primaryGoal: ["visit", "pr"] }), true)
  assert.equal(isPNPInScope({ primaryGoal: ["Study", "Not sure / exploring PR"] }), true)
})

test("returns false when goal is missing", () => {
  assert.equal(isPNPInScope({}), false)
  assert.equal(isPNPInScope({ primaryGoal: undefined }), false)
})
