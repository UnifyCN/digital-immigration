import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { imm5669FullSchema } from "@/lib/imm5669/schemas"
import { BACKGROUND_QUESTION_LABELS } from "@/lib/imm5669/types"
import type { Imm5669Data, BackgroundQuestions } from "@/lib/imm5669/types"

// ── Rate limiter ──
const MAX_REQUESTS = 10
const WINDOW_MS = 60_000
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_REQUESTS) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = imm5669FullSchema.safeParse(body)
  if (!parsed.success) {
    const messages = parsed.error.issues.slice(0, 5).map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    )
    return NextResponse.json(
      { error: "Validation failed", details: messages },
      { status: 422 },
    )
  }

  try {
    const pdfBytes = await buildImm5669Pdf(parsed.data)

    const lastName = parsed.data.familyName || "Applicant"
    const safeLastName = lastName.replace(/[^a-zA-Z0-9_-]/g, "_")
    const date = new Date().toISOString().slice(0, 10)
    const filename = `IMM5669_Filled_${safeLastName}_${date}.pdf`

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("PDF generation failed:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 },
    )
  }
}

// ── PDF Builder ──

const W = 612
const H = 792
const M = 50
const COL2 = 320

async function buildImm5669Pdf(data: Imm5669Data): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const S = { reg: helvetica, bold, doc, data }

  drawPage1(S)
  drawPage2(S)
  drawPage3(S)
  drawPage4(S)

  return doc.save()
}

type Ctx = {
  reg: Awaited<ReturnType<PDFDocument["embedFont"]>>
  bold: Awaited<ReturnType<PDFDocument["embedFont"]>>
  doc: PDFDocument
  data: Imm5669Data
}

function drawPage1(S: Ctx) {
  const page = S.doc.addPage([W, H])
  let y = H - M

  y = header(page, S, y, "IMM 5669 — SCHEDULE A — BACKGROUND / DECLARATION", "Page 1 of 4")

  y = sectionTitle(page, S, y, "Applicant Type")
  const typeLabel = S.data.applicantType === "principal"
    ? "[X] Principal applicant"
    : "[X] Spouse, common-law partner, or dependent child (18+)"
  y = textLine(page, S.reg, y, typeLabel, 8)

  y -= 6
  y = sectionTitle(page, S, y, "1. Full Name")
  y = labelValue(page, S, y, "Family name", S.data.familyName)
  y = labelValue(page, S, y, "Given name(s)", S.data.givenNames)

  if (S.data.nativeScriptName) {
    y -= 4
    y = sectionTitle(page, S, y, "2. Name in Native Script")
    y = textLine(page, S.reg, y, S.data.nativeScriptName, 9)
  }

  y -= 4
  y = sectionTitle(page, S, y, "3. Date of Birth")
  y = textLine(page, S.reg, y, S.data.dateOfBirth, 9)

  y -= 4
  y = sectionTitle(page, S, y, "4. Father's Details")
  y = labelValue(page, S, y, "Name", `${S.data.father.familyName}, ${S.data.father.givenNames}`)
  if (S.data.father.dateOfBirth) y = labelValue(page, S, y, "DOB", S.data.father.dateOfBirth)
  if (S.data.father.townCityOfBirth) y = labelValue(page, S, y, "Birthplace", `${S.data.father.townCityOfBirth}, ${S.data.father.countryOfBirth}`)
  if (S.data.father.dateOfDeath) y = labelValue(page, S, y, "Deceased", S.data.father.dateOfDeath)

  y -= 4
  y = sectionTitle(page, S, y, "5. Mother's Details")
  y = labelValue(page, S, y, "Name", `${S.data.mother.familyName}, ${S.data.mother.givenNames}`)
  if (S.data.mother.dateOfBirth) y = labelValue(page, S, y, "DOB", S.data.mother.dateOfBirth)
  if (S.data.mother.townCityOfBirth) y = labelValue(page, S, y, "Birthplace", `${S.data.mother.townCityOfBirth}, ${S.data.mother.countryOfBirth}`)
  if (S.data.mother.dateOfDeath) y = labelValue(page, S, y, "Deceased", S.data.mother.dateOfDeath)

  y -= 4
  y = sectionTitle(page, S, y, "6. Background Questions")

  const bgKeys = Object.keys(BACKGROUND_QUESTION_LABELS) as (keyof BackgroundQuestions)[]
  for (const key of bgKeys) {
    const answer = S.data.backgroundQuestions[key]
    const label = BACKGROUND_QUESTION_LABELS[key]
    const answerStr = answer === "yes" ? "YES" : "NO"
    const truncated = label.length > 90 ? label.substring(0, 87) + "..." : label
    y = textLine(page, S.reg, y, `${key}) [${answerStr}] ${truncated}`, 7)
    if (y < M + 20) break
  }

  if (S.data.backgroundDetails) {
    y -= 4
    y = textLine(page, S.bold, y, "Details:", 8)
    const lines = wrapText(S.data.backgroundDetails, 95)
    for (const line of lines.slice(0, 4)) {
      y = textLine(page, S.reg, y, line, 7.5)
      if (y < M) break
    }
  }

  footer(page, S)
}

function drawPage2(S: Ctx) {
  const page = S.doc.addPage([W, H])
  let y = H - M

  y = header(page, S, y, "IMM 5669 — Page 2 of 4", "Education & Personal History")

  y = sectionTitle(page, S, y, "7. Education — Years Completed")
  const ey = S.data.educationYears
  y = textLine(page, S.reg, y, `Elementary: ${ey.elementary || "—"}   Secondary: ${ey.secondary || "—"}   University: ${ey.university || "—"}   Trade: ${ey.tradeSchool || "—"}`, 8)

  y -= 4
  y = sectionTitle(page, S, y, "Education History")

  const eduHeaders = ["From", "To", "Institution", "City/Country", "Certificate", "Field"]
  const eduColX = [M, M + 55, M + 110, M + 260, M + 380, M + 470]
  y = tableHeaderRow(page, S, y, eduHeaders, eduColX)

  for (const row of S.data.educationHistory.slice(0, 6)) {
    const vals = [row.from, row.to, row.institutionName, row.cityAndCountry, row.certificateType, row.fieldOfStudy]
    y = tableRow(page, S, y, vals, eduColX)
    if (y < M + 20) break
  }

  y -= 8
  y = sectionTitle(page, S, y, "8. Personal History")
  y = textLine(page, S.reg, y, "Since age 18 or past 10 years. No gaps in time.", 7)

  const phHeaders = ["From", "To", "Activity", "City/Country", "Status", "Employer/School"]
  const phColX = [M, M + 55, M + 110, M + 230, M + 350, M + 440]
  y = tableHeaderRow(page, S, y, phHeaders, phColX)

  for (const row of S.data.personalHistory.slice(0, 10)) {
    const vals = [row.from, row.to, row.activity, row.cityAndCountry, row.statusInCountry, row.companyOrEmployer]
    y = tableRow(page, S, y, vals, phColX)
    if (y < M + 20) break
  }

  footer(page, S)
}

function drawPage3(S: Ctx) {
  const page = S.doc.addPage([W, H])
  let y = H - M

  y = header(page, S, y, "IMM 5669 — Page 3 of 4", "Memberships, Government, Military, Addresses")

  y = sectionTitle(page, S, y, "9. Memberships & Associations")
  if (S.data.memberships.length === 0) {
    y = textLine(page, S.reg, y, "NONE", 9)
  } else {
    const mHeaders = ["From", "To", "Organization", "Type", "Activities", "City/Country"]
    const mColX = [M, M + 55, M + 110, M + 240, M + 340, M + 450]
    y = tableHeaderRow(page, S, y, mHeaders, mColX)
    for (const row of S.data.memberships.slice(0, 5)) {
      const vals = [row.from, row.to, row.organizationName, row.organizationType, row.activitiesOrPositions, row.cityAndCountry]
      y = tableRow(page, S, y, vals, mColX)
      if (y < H / 2) break
    }
  }

  y -= 6
  y = sectionTitle(page, S, y, "10. Government Positions")
  if (S.data.governmentPositions.length === 0) {
    y = textLine(page, S.reg, y, "NONE", 9)
  } else {
    const gHeaders = ["From", "To", "Country/Jurisdiction", "Department", "Positions"]
    const gColX = [M, M + 55, M + 110, M + 280, M + 410]
    y = tableHeaderRow(page, S, y, gHeaders, gColX)
    for (const row of S.data.governmentPositions.slice(0, 4)) {
      const vals = [row.from, row.to, row.countryAndJurisdiction, row.departmentBranch, row.activitiesOrPositions]
      y = tableRow(page, S, y, vals, gColX)
    }
  }

  y -= 6
  y = sectionTitle(page, S, y, "11. Military / Paramilitary Service")
  if (S.data.militaryService.length === 0) {
    y = textLine(page, S.reg, y, "NONE", 9)
  } else {
    for (const row of S.data.militaryService.slice(0, 2)) {
      y = labelValue(page, S, y, "Country", row.country)
      y = textLine(page, S.reg, y, `${row.from} — ${row.to}  |  Branch: ${row.branchAndUnit}  |  Rank: ${row.ranks}`, 7.5)
      if (row.combatDetails) y = textLine(page, S.reg, y, `Combat: ${row.combatDetails}`, 7.5)
      if (row.reasonForEnd) y = textLine(page, S.reg, y, `End reason: ${row.reasonForEnd}`, 7.5)
      y -= 4
    }
  }

  y -= 6
  y = sectionTitle(page, S, y, "12. Addresses")
  const aHeaders = ["From", "To", "Street", "City", "Province", "Postal", "Country"]
  const aColX = [M, M + 55, M + 110, M + 240, M + 320, M + 410, M + 470]
  y = tableHeaderRow(page, S, y, aHeaders, aColX)
  for (const row of S.data.addresses.slice(0, 8)) {
    const vals = [row.from, row.to, row.streetAndNumber, row.cityOrTown, row.provinceStateDistrict, row.postalCode, row.country]
    y = tableRow(page, S, y, vals, aColX)
    if (y < M + 20) break
  }

  footer(page, S)
}

function drawPage4(S: Ctx) {
  const page = S.doc.addPage([W, H])
  let y = H - M

  y = header(page, S, y, "IMM 5669 — Page 4 of 4", "Declaration")

  y -= 10
  const declText = [
    "Authority to disclose personal information:",
    "By submitting this form, you consent to the release to Canadian government authorities",
    "of all records and information any government authority may possess on your behalf.",
    "",
    "Declaration of applicant:",
    "I declare that the information I have given is truthful, complete and correct.",
  ]
  for (const line of declText) {
    if (line === "") { y -= 8; continue }
    y = textLine(page, S.reg, y, line, 8)
  }

  y -= 16
  y = labelValue(page, S, y, "Declaration date", S.data.declarationDate)
  y -= 12
  y = textLine(page, S.reg, y, "Signature: ________________________________", 9)
  y -= 4
  y = textLine(page, S.reg, y, "(Sign after printing)", 7)

  footer(page, S)
}

// ── Drawing helpers ──

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>
type Page = ReturnType<PDFDocument["addPage"]>

const BLACK = rgb(0, 0, 0)
const GRAY = rgb(0.45, 0.45, 0.45)
const LIGHT = rgb(0.85, 0.85, 0.85)

function header(page: Page, S: Ctx, y: number, left: string, right: string): number {
  page.drawText(left, { x: M, y, size: 10, font: S.bold, color: BLACK })
  const rw = S.reg.widthOfTextAtSize(right, 8)
  page.drawText(right, { x: W - M - rw, y: y + 1, size: 8, font: S.reg, color: GRAY })
  y -= 4
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: LIGHT })
  return y - 14
}

function footer(page: Page, S: Ctx) {
  const text = "Generated by Unify Social — informational only, not legal advice."
  page.drawText(text, { x: M, y: 30, size: 6.5, font: S.reg, color: GRAY })
}

function sectionTitle(page: Page, S: Ctx, y: number, title: string): number {
  page.drawText(title, { x: M, y, size: 9, font: S.bold, color: BLACK })
  return y - 14
}

function textLine(page: Page, font: Font, y: number, text: string, size: number): number {
  page.drawText(text, { x: M, y, size, font, color: BLACK })
  return y - (size + 3)
}

function labelValue(page: Page, S: Ctx, y: number, label: string, value: string): number {
  page.drawText(`${label}:`, { x: M, y, size: 8, font: S.bold, color: GRAY })
  page.drawText(value || "—", { x: M + 120, y, size: 9, font: S.reg, color: BLACK })
  return y - 13
}

function tableHeaderRow(page: Page, S: Ctx, y: number, headers: string[], colX: number[]): number {
  page.drawRectangle({
    x: M - 2,
    y: y - 3,
    width: W - 2 * M + 4,
    height: 12,
    color: rgb(0.93, 0.93, 0.93),
  })
  headers.forEach((h, i) => {
    page.drawText(h, { x: colX[i], y, size: 7, font: S.bold, color: GRAY })
  })
  return y - 14
}

function tableRow(page: Page, S: Ctx, y: number, values: string[], colX: number[]): number {
  values.forEach((v, i) => {
    const maxW = (colX[i + 1] ?? W - M) - colX[i] - 4
    const maxChars = Math.max(Math.floor(maxW / 3.5), 8)
    const display = v.length > maxChars ? v.substring(0, maxChars - 1) + "…" : v
    page.drawText(display || "—", { x: colX[i], y, size: 7, font: S.reg, color: BLACK })
  })
  return y - 11
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length <= maxChars) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}
