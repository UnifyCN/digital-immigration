import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import bannedTermsData from "../rules/compliance/banned_terms.json" with { type: "json" }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")

const TARGET_PATHS = [
  "lib/copy",
  "rules",
  "components/pathways/PathwayDetail.tsx",
  "components/pathways/province-finder-questionnaire.tsx",
  "components/pathways/province-finder-results.tsx",
  "components/results/pathway-cards.tsx",
  "app/assessment/results/pathways/pnp/bc",
]

const ALLOWED_FILES = new Set([
  path.resolve(ROOT, "rules/compliance/banned_terms.json"),
  path.resolve(__filename),
])

function shouldInspect(filePath) {
  if (ALLOWED_FILES.has(filePath)) return false
  if (filePath.endsWith(".test.mjs")) return false
  return filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".json")
}

function collectFiles(targetPath) {
  if (!existsSync(targetPath)) return []
  const stats = statSync(targetPath)
  if (!stats.isDirectory()) {
    return shouldInspect(targetPath) ? [targetPath] : []
  }

  const files = []
  for (const entry of readdirSync(targetPath)) {
    const fullPath = path.join(targetPath, entry)
    const childStats = statSync(fullPath)
    if (childStats.isDirectory()) {
      files.push(...collectFiles(fullPath))
    } else if (shouldInspect(fullPath)) {
      files.push(fullPath)
    }
  }
  return files
}

test("compliance copy: banned terms do not appear in PNP UI/copy/rules files", () => {
  const banned = Array.isArray(bannedTermsData.banned)
    ? bannedTermsData.banned.map((term) => `${term}`.toLowerCase())
    : []

  assert.ok(banned.length > 0, "Expected at least one banned term")

  const files = TARGET_PATHS.flatMap((target) => collectFiles(path.resolve(ROOT, target)))
  const violations = []

  for (const filePath of files) {
    const content = readFileSync(filePath, "utf8")
    const lower = content.toLowerCase()
    for (const term of banned) {
      if (lower.includes(term)) {
        violations.push({ term, filePath: path.relative(ROOT, filePath) })
      }
    }
  }

  const uniqueViolations = violations.filter(
    (item, index) =>
      violations.findIndex((other) => other.term === item.term && other.filePath === item.filePath) === index,
  )

  assert.equal(
    uniqueViolations.length,
    0,
    uniqueViolations
      .map((item) => `Banned term "${item.term}" found in ${item.filePath}`)
      .join("\n"),
  )
})
