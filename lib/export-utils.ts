import { loadAssessment } from "@/lib/storage"
import { formatAnswer as baseFormatAnswer } from "@/lib/review-answers"
import type { AssessmentData } from "@/lib/types"

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

export function getTimestampForFilename(date = new Date()): string {
  const yyyy = date.getFullYear()
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const min = pad2(date.getMinutes())
  return `${yyyy}${mm}${dd}-${hh}${min}`
}

export function formatDate(value: string): string {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const date = new Date(`${value}-01T00:00:00Z`)
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return value
}

export function formatAnswer(value: unknown): string {
  if (typeof value === "string") return baseFormatAnswer(formatDate(value))
  return baseFormatAnswer(value)
}

export function safeGetAssessmentFromLocalStorage(): AssessmentData | null {
  if (typeof window === "undefined") return null
  try {
    return loadAssessment()
  } catch {
    return null
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
