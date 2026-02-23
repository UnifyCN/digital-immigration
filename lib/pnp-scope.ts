import type { AssessmentData } from "./types"

export type AnswersType = {
  primaryGoal?: AssessmentData["primaryGoal"] | string | string[] | null
  goal?: string | string[] | null
}

const IN_SCOPE_GOALS = new Set([
  "pr",
  "permanent residence",
  "permanent residence (pr)",
  "not-sure",
  "not sure",
  "not sure yet",
  "not sure / exploring pr",
  "exploring pr",
  "unsure",
])

function toNormalizedGoals(value: string | string[] | null | undefined): string[] {
  if (!value) return []
  const values = Array.isArray(value) ? value : [value]
  return values
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function isPNPInScope(answers: AnswersType): boolean {
  const normalizedGoals = toNormalizedGoals(answers.primaryGoal ?? answers.goal)
  return normalizedGoals.some((goal) => IN_SCOPE_GOALS.has(goal))
}
