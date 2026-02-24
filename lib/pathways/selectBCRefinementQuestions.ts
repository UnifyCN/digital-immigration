import type { RefinementQuestion } from "../rules/pnp/bcRefinementQuestionBank.ts"
import { BC_REFINEMENT_QUESTION_BANK } from "../rules/pnp/bcRefinementQuestionBank.ts"
import type { ProvinceFinderEvaluation, StreamFamilyId } from "../rules/pnp/bcFamilies.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope"

function normalizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

const QUESTION_BY_ID = new Map(BC_REFINEMENT_QUESTION_BANK.map((question) => [question.id, question]))

const SCORE_DRIVER_IDS = new Set(["job_offer_exists", "job_province", "teer_or_noc", "job_full_time", "job_permanent"])
const READINESS_IDS = new Set(["language_test_status"])

const CRITICAL_QUESTION_IDS_BY_FAMILY: Record<StreamFamilyId, Set<string>> = {
  BC_EMPLOYER_SKILLED: new Set(["job_offer_exists", "job_province", "job_full_time", "job_permanent", "teer_or_noc"]),
  BC_INTL_GRAD: new Set(["institution_type", "job_province", "language_test_status"]),
}

function mapSignalKeysToQuestionId(signalKeys?: string[]): string | null {
  const keys = (signalKeys ?? []).map((key) => normalizeKey(key))
  if (keys.some((key) => key.includes("teer") || key.includes("noc"))) return "teer_or_noc"
  if (keys.some((key) => key.includes("jobfulltime") || key.includes("jobofferfulltime"))) return "job_full_time"
  if (keys.some((key) => key.includes("jobpermanent") || key.includes("jobofferpermanent"))) return "job_permanent"
  if (keys.some((key) => key.includes("institutiontype") || key.includes("publicinstitution"))) return "institution_type"
  if (keys.some((key) => key.includes("language"))) return "language_test_status"
  if (keys.some((key) => key.includes("hasjoboffer"))) return "job_offer_exists"
  if (keys.some((key) => key.includes("jobprovince"))) return "job_province"
  return null
}

function mapMissingItemToQuestionId(item: { prompt: string; signalKeys?: string[] }): string | null {
  const fromKeys = mapSignalKeysToQuestionId(item.signalKeys)
  if (fromKeys) return fromKeys

  const prompt = item.prompt.toLowerCase()
  if (prompt.includes("teer") || prompt.includes("noc")) return "teer_or_noc"
  if (prompt.includes("full-time")) return "job_full_time"
  if (prompt.includes("permanent") || prompt.includes("ongoing")) return "job_permanent"
  if (prompt.includes("public or private")) return "institution_type"
  if (prompt.includes("language")) return "language_test_status"
  if (prompt.includes("job offer")) return "job_offer_exists"
  if (prompt.includes("which province")) return "job_province"
  return null
}

function priorityForQuestion(params: {
  questionId: string
  familyId: StreamFamilyId
  isMappedFromMissing: boolean
  isCritical: boolean
}): number {
  let score = 0
  if (params.isMappedFromMissing) score += 1000
  if (params.isCritical) score += 500
  if (SCORE_DRIVER_IDS.has(params.questionId)) score += 200
  if (READINESS_IDS.has(params.questionId)) score += 50
  return score
}

export function selectBCRefinementQuestions(input: {
  evaluation: ProvinceFinderEvaluation
  signals: CombinedPNPSignals & Record<string, unknown>
  mode?: "guided" | "explore"
}): RefinementQuestion[] {
  const targetFamily = input.evaluation.evaluatedFamilies[0]
  if (!targetFamily) return []

  if (targetFamily.matchLevel === "strong" && targetFamily.confidence !== "low") {
    return []
  }

  const maxQuestions =
    targetFamily.matchLevel === "strong"
      ? targetFamily.confidence === "low"
        ? 2
        : 0
      : input.mode === "explore"
        ? 3
        : 5
  if (maxQuestions === 0) return []

  const criticalSet = CRITICAL_QUESTION_IDS_BY_FAMILY[targetFamily.familyId]
  const shouldAskQuestions = BC_REFINEMENT_QUESTION_BANK.filter((question) =>
    question.shouldAsk({ signals: input.signals }),
  )

  const mappedIds = new Set<string>()
  for (const missing of targetFamily.missingInfo) {
    const mappedId = mapMissingItemToQuestionId(missing)
    if (mappedId) mappedIds.add(mappedId)
  }

  const candidates = new Map<
    string,
    { question: RefinementQuestion; priority: number; sourceOrder: number }
  >()

  let sourceOrder = 0
  for (const question of shouldAskQuestions) {
    const isMappedFromMissing = mappedIds.has(question.id)
    const isCritical = criticalSet.has(question.id)
    candidates.set(question.id, {
      question,
      priority: priorityForQuestion({
        questionId: question.id,
        familyId: targetFamily.familyId,
        isMappedFromMissing,
        isCritical,
      }),
      sourceOrder: sourceOrder++,
    })
  }

  // If missingInfo mapped to a known question but guard blocked it due to key alias differences,
  // include it when the question exists and is still relevant per family critical set.
  for (const questionId of mappedIds) {
    if (candidates.has(questionId)) continue
    const question = QUESTION_BY_ID.get(questionId)
    if (!question) continue
    const isCritical = criticalSet.has(question.id)
    candidates.set(question.id, {
      question,
      priority: priorityForQuestion({
        questionId: question.id,
        familyId: targetFamily.familyId,
        isMappedFromMissing: true,
        isCritical,
      }),
      sourceOrder: sourceOrder++,
    })
  }

  const ordered = [...candidates.values()]
    .sort((a, b) => b.priority - a.priority || a.sourceOrder - b.sourceOrder || a.question.id.localeCompare(b.question.id))
    .map((entry) => entry.question)

  const selected = ordered.slice(0, maxQuestions)
  if (selected.length >= 2 || selected.length === 0) return selected

  // Try to keep at least 2 questions if there are alternatives available.
  const remaining = ordered.filter((question) => !selected.some((picked) => picked.id === question.id))
  for (const question of remaining) {
    if (selected.length >= 2 || selected.length >= maxQuestions) break
    selected.push(question)
  }

  return selected
}
