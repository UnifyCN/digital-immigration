import type { Imm5669Data } from "./types"
import { DEFAULT_IMM5669 } from "./types"

const DRAFT_KEY = "unify-imm5669-draft"
const SECTION_KEY = "unify-imm5669-section"
const PATHWAY_KEY = "unify-selected-pathway"
const STATUS_KEY = "unify-imm5669-status"

export interface SelectedPathway {
  pathwayId: string
  pathwayName: string
}

// ── IMM 5669 draft ──

export function saveImm5669Draft(data: Imm5669Data): void {
  if (typeof window === "undefined") return
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
}

export function loadImm5669Draft(): Imm5669Data | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<Imm5669Data>
    return {
      ...DEFAULT_IMM5669,
      ...parsed,
      father: { ...DEFAULT_IMM5669.father, ...parsed.father },
      mother: { ...DEFAULT_IMM5669.mother, ...parsed.mother },
      backgroundQuestions: {
        ...DEFAULT_IMM5669.backgroundQuestions,
        ...parsed.backgroundQuestions,
      },
      educationYears: {
        ...DEFAULT_IMM5669.educationYears,
        ...parsed.educationYears,
      },
      educationHistory: Array.isArray(parsed.educationHistory)
        ? parsed.educationHistory
        : DEFAULT_IMM5669.educationHistory,
      personalHistory: Array.isArray(parsed.personalHistory)
        ? parsed.personalHistory
        : DEFAULT_IMM5669.personalHistory,
      memberships: Array.isArray(parsed.memberships)
        ? parsed.memberships
        : DEFAULT_IMM5669.memberships,
      governmentPositions: Array.isArray(parsed.governmentPositions)
        ? parsed.governmentPositions
        : DEFAULT_IMM5669.governmentPositions,
      militaryService: Array.isArray(parsed.militaryService)
        ? parsed.militaryService
        : DEFAULT_IMM5669.militaryService,
      addresses: Array.isArray(parsed.addresses)
        ? parsed.addresses
        : DEFAULT_IMM5669.addresses,
    }
  } catch {
    return null
  }
}

export function clearImm5669Draft(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem(SECTION_KEY)
  localStorage.removeItem(STATUS_KEY)
}

export function hasImm5669Draft(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(DRAFT_KEY) !== null
}

// ── Section index ──

export function saveImm5669Section(section: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SECTION_KEY, String(section))
}

export function loadImm5669Section(): number {
  if (typeof window === "undefined") return 0
  const raw = localStorage.getItem(SECTION_KEY)
  const parsed = raw ? parseInt(raw, 10) : 0
  return Number.isNaN(parsed) ? 0 : parsed
}

// ── Selected pathway ──

export function saveSelectedPathway(pathway: SelectedPathway): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PATHWAY_KEY, JSON.stringify(pathway))
}

export function loadSelectedPathway(): SelectedPathway | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(PATHWAY_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SelectedPathway
  } catch {
    return null
  }
}

// ── Document status ──

export function saveImm5669Status(status: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STATUS_KEY, status)
}

export function loadImm5669Status(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STATUS_KEY)
}

export function clearImm5669Status(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STATUS_KEY)
}
