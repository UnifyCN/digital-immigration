export type ChecklistStatus = "complete" | "warning" | "unknown"

export interface ChecklistRow {
  label: string
  status: ChecklistStatus
}
