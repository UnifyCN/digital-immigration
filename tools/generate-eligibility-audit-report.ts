import { execSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { buildEligibilityAuditModel } from "../lib/audit/eligibility/extractLogic.ts"
import { renderEligibilityAuditPdf } from "../lib/audit/eligibility/renderPdf.ts"

function currentGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
  } catch {
    return "unknown"
  }
}

async function main() {
  const outputDir = join(process.cwd(), "docs", "audit")
  await mkdir(outputDir, { recursive: true })

  const model = buildEligibilityAuditModel({
    generatedAt: new Date(),
    gitCommit: currentGitCommit(),
  })

  const pdfBytes = await renderEligibilityAuditPdf(model)

  const pdfPath = join(outputDir, "eligibility-engine-audit.pdf")
  const jsonPath = join(outputDir, "eligibility-engine-audit.json")

  await writeFile(pdfPath, Buffer.from(pdfBytes))
  await writeFile(jsonPath, JSON.stringify(model, null, 2), "utf8")

  process.stdout.write(`Wrote PDF: ${pdfPath}\n`)
  process.stdout.write(`Wrote JSON: ${jsonPath}\n`)
}

main().catch((error) => {
  process.stderr.write(`Failed to generate eligibility audit report: ${String(error)}\n`)
  process.exit(1)
})
