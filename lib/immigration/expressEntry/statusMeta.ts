import type { ProgramCheckStatus } from "./types.ts"

export function getStreamStatusMeta(status: ProgramCheckStatus): {
  label: string
  variant: "default" | "secondary" | "outline"
} {
  if (status === "eligible") return { label: "Eligible", variant: "default" }
  if (status === "needs_more_info") return { label: "Needs more info", variant: "secondary" }
  return { label: "Ineligible", variant: "outline" }
}
