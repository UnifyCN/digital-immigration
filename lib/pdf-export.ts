import { formatAnswer } from "@/lib/export-utils"
import { reviewSections } from "@/lib/review-answers"
import type { AssessmentData, AssessmentResults } from "@/lib/types"

const PAGE_MAX_LINES = 46
const LINE_WRAP_AT = 96

function wrapText(text: string, width = LINE_WRAP_AT): string[] {
  if (width <= 0) return [text]
  if (text.length <= width) return [text]

  const words = text.split(" ")
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    if (word.length > width) {
      if (line) {
        lines.push(line)
        line = ""
      }

      let remaining = word
      while (remaining.length > width) {
        lines.push(remaining.slice(0, width))
        remaining = remaining.slice(width)
      }
      line = remaining
      continue
    }

    const candidate = line ? `${line} ${word}` : word
    if (candidate.length <= width) {
      line = candidate
    } else {
      if (line) lines.push(line)
      line = word
    }
  }

  if (line) lines.push(line)
  return lines
}

function addLine(lines: string[], text = "", options?: { alreadyWrapped?: boolean }): void {
  const wrapped = options?.alreadyWrapped ? [text] : wrapText(text)
  lines.push(...wrapped)
}

function addBullet(lines: string[], text: string): void {
  const wrapped = wrapText(text, Math.max(LINE_WRAP_AT - 2, 1))
  wrapped.forEach((line, index) =>
    addLine(lines, `${index === 0 ? "- " : "  "}${line}`, { alreadyWrapped: true }),
  )
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function paginate(lines: string[]): string[][] {
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += PAGE_MAX_LINES) {
    pages.push(lines.slice(i, i + PAGE_MAX_LINES))
  }
  return pages.length ? pages : [["No content available"]]
}

function buildPdfFromPages(pages: string[][]): Blob {
  // This hand-rolled writer emits a sparse object table where objects[0] stays empty
  // because xref entry 0 is the required free object.
  const objects: string[] = []
  objects[0] = ""

  // Keep content in the ASCII/Latin-1 range. escapePdfText only escapes PDF control
  // characters; any codepoint above 255 is downgraded to "?" during byte encoding.
  const toPdfBytes = (value: string): Uint8Array => {
    const bytes = new Uint8Array(value.length)
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i)
      bytes[i] = code <= 0xff ? code : 0x3f
    }
    return bytes
  }
  const byteLength = (value: string) => toPdfBytes(value).length

  const pageCount = pages.length
  const pageEntries: string[] = []

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"

  for (let i = 0; i < pageCount; i++) {
    const pageObj = 4 + i * 2
    const contentObj = pageObj + 1
    pageEntries.push(`${pageObj} 0 R`)

    // Ensure T* appears between lines in correct order.
    const orderedStream: string[] = ["BT", "/F1 11 Tf", "14 TL", "40 770 Td"]
    pages[i].forEach((line, index) => {
      if (index > 0) orderedStream.push("T*")
      orderedStream.push(`(${escapePdfText(line)}) Tj`)
    })
    orderedStream.push("ET")
    const streamContent = orderedStream.join("\n")

    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>`
    objects[contentObj] =
      `<< /Length ${byteLength(streamContent)} >>\nstream\n${streamContent}\nendstream`
  }

  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${pageEntries.join(" ")}] >>`
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]
  let offset = byteLength(pdf)

  for (let i = 1; i < objects.length; i++) {
    offsets[i] = offset
    const objectChunk = `${i} 0 obj\n${objects[i]}\nendobj\n`
    pdf += objectChunk
    offset += byteLength(objectChunk)
  }

  const xrefStart = offset
  let trailer = `xref\n0 ${objects.length}\n`
  trailer += "0000000000 65535 f \n"
  for (let i = 1; i < objects.length; i++) {
    trailer += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
  }
  trailer += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  pdf += trailer

  return new Blob([toPdfBytes(pdf)], { type: "application/pdf" })
}

export function generateResultsPdf(
  assessment: AssessmentData,
  results: AssessmentResults,
): Blob {
  const lines: string[] = []

  addLine(lines, "Clarity Assessment Summary")
  addLine(lines, "Not legal advice. For informational and organizational purposes only.")
  addLine(lines)

  addLine(lines, "1) Summary")
  addBullet(lines, `Tier: ${results.tier.label} (Level ${results.tier.level})`)
  results.tier.reasons.forEach((reason) => addBullet(lines, reason))
  results.nextActions.forEach((action) => addBullet(lines, action))
  addLine(lines)

  addLine(lines, "2) Relevant Pathways")
  if (!results.pathways.length) {
    addBullet(lines, "None")
  } else {
    results.pathways.forEach((pathway, index) => {
      addLine(lines, `Pathway #${index + 1}: ${pathway.name}`)
      addBullet(lines, `Confidence: ${pathway.confidence}`)
      addLine(lines, "  Why relevant:")
      pathway.whyRelevant.forEach((item) => addBullet(lines, `  ${item}`))
      addLine(lines, "  What you need next:")
      pathway.whatNext.forEach((item) => addBullet(lines, `  ${item}`))
      addLine(lines)
    })
  }

  addLine(lines, "3) Risk Flags")
  if (!results.riskFlags.length) {
    addBullet(lines, "None identified")
  } else {
    results.riskFlags.forEach((flag, index) => {
      addLine(lines, `Risk #${index + 1}: ${flag.label}`)
      addBullet(lines, `Severity: ${formatAnswer(flag.severity)}`)
      addBullet(lines, `Recommended action: ${flag.action}`)
    })
  }
  addLine(lines)

  addLine(lines, "4) Review Your Answers")
  reviewSections.forEach((section) => {
    addLine(lines, section.title)
    section.fields.forEach((field) => {
      addBullet(lines, `${field.label}: ${formatAnswer(assessment[field.key])}`)
    })

    if (section.id === "work") {
      if (!assessment.jobs.length) {
        addBullet(lines, "Quick-add previous roles: None")
      } else {
        assessment.jobs.forEach((job, index) => {
          const details = [formatAnswer(job.title), formatAnswer(job.country), formatAnswer(job.yearsRange)]
            .filter((value) => value !== "Not provided")
            .join(" | ")
          addBullet(lines, `Role #${index + 1}: ${details || "Not provided"}`)
        })
      }
    }

    if (section.id === "education") {
      if (!assessment.additionalCredentials.length) {
        addBullet(lines, "Additional credentials: None")
      } else {
        assessment.additionalCredentials.forEach((credential, index) => {
          const details = [
            formatAnswer(credential.educationLevel),
            formatAnswer(credential.country),
            formatAnswer(credential.graduationYear),
            formatAnswer(credential.programLength),
          ]
            .filter((value) => value !== "Not provided")
            .join(" | ")
          addBullet(lines, `Credential #${index + 1}: ${details || "Not provided"}`)
        })
      }
    }

    addLine(lines)
  })

  return buildPdfFromPages(paginate(lines))
}
