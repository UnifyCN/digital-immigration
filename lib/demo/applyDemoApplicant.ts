import type { DemoApplicant } from "./demoApplicants.ts"
import {
  clearAssessment,
  saveAssessment,
  saveCompletedSteps,
  saveStep,
} from "../storage.ts"

export function applyDemoApplicant(demo: DemoApplicant, totalSteps = 8): void {
  clearAssessment()
  saveAssessment(demo.answers)
  saveStep(0)
  saveCompletedSteps(Array(totalSteps).fill(false))
}
