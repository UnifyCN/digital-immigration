import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { readFile } from "fs/promises"
import { join } from "path"
import { imm5669FullSchema } from "@/lib/imm5669/schemas"
import type { Imm5669Data, BackgroundQuestions } from "@/lib/imm5669/types"
import {
  PAGE1,
  PAGE2,
  PAGE3,
  PAGE4,
  bgRadioName,
  eduField,
  EDU_CELLS,
  EDU_MAX_ROWS,
  phField,
  PH_CELLS,
  PH_MAX_ROWS,
  membField,
  MEMB_CELLS,
  MEMB_MAX_ROWS,
  govField,
  GOV_CELLS,
  GOV_MAX_ROWS,
  milField,
  milCellName,
  MIL_MAX_ROWS_PER_BLOCK,
  addrField,
  ADDR_CELLS,
  ADDR_MAX_ROWS,
  groupMilitaryByCountry,
  detectOverflow,
  type OverflowSection,
} from "@/lib/imm5669/pdf-field-mapping"

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
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
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
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    )
  }

  const parsed = imm5669FullSchema.safeParse(body)
  if (!parsed.success) {
    const messages = parsed.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
    return NextResponse.json(
      { error: "Validation failed", details: messages },
      { status: 422 },
    )
  }

  try {
    const pdfBytes = await fillOfficialTemplate(parsed.data)

    const lastName = parsed.data.familyName || "Applicant"
    const safeLastName = lastName.replace(/[^a-zA-Z0-9_-]/g, "_")
    const date = new Date().toISOString().slice(0, 10)
    const filename = `IMM5669_Filled_${safeLastName}_${date}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error(
      "PDF generation failed:",
      err instanceof Error ? err.message : err,
    )
    return NextResponse.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 },
    )
  }
}

// ── Fill the official IMM 5669 template ──

async function fillOfficialTemplate(
  data: Imm5669Data,
): Promise<Uint8Array> {
  const templatePath = join(
    process.cwd(),
    "public",
    "templates",
    "imm5669-template.pdf",
  )
  const templateBytes = await readFile(templatePath)
  const doc = await PDFDocument.load(templateBytes, {
    ignoreEncryption: true,
  })
  const form = doc.getForm()

  fillPage1(form, data)
  fillPage2(form, data)
  fillPage3(form, data)
  fillPage4(form, data)

  form.flatten()

  const overflows = detectOverflow(data)
  if (overflows.length > 0) {
    await addOverflowPages(doc, data, overflows)
  }

  return doc.save()
}

// ── Helpers ──

function setText(
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  value: string,
) {
  if (!value) return
  try {
    const field = form.getTextField(fieldName)
    field.setText(value)
  } catch {
    // Field not found — skip silently
  }
}

function setRadio(
  form: ReturnType<PDFDocument["getForm"]>,
  fieldName: string,
  optionValue: string,
) {
  try {
    const field = form.getRadioGroup(fieldName)
    field.select(optionValue)
  } catch {
    // Field not found — skip silently
  }
}

// ── Page 1: Applicant info, parents, background questions ──

function fillPage1(
  form: ReturnType<PDFDocument["getForm"]>,
  data: Imm5669Data,
) {
  // Applicant type: "1" = principal, "2" = dependent
  if (data.applicantType === "principal") {
    setRadio(form, PAGE1.applicantChoice, "1")
  } else if (data.applicantType === "spouse-dependent") {
    setRadio(form, PAGE1.applicantChoice, "2")
  }

  setText(form, PAGE1.familyName, data.familyName)
  setText(form, PAGE1.givenName, data.givenNames)
  setText(form, PAGE1.nativeScript, data.nativeScriptName)
  setText(form, PAGE1.dateOfBirth, data.dateOfBirth)

  // Father
  setText(form, PAGE1.fatherFamilyName, data.father.familyName)
  setText(form, PAGE1.fatherGivenName, data.father.givenNames)
  setText(form, PAGE1.fatherBirthDate, data.father.dateOfBirth)
  setText(form, PAGE1.fatherBirthCity, data.father.townCityOfBirth)
  setText(form, PAGE1.fatherBirthCountry, data.father.countryOfBirth)
  setText(form, PAGE1.fatherDeathDate, data.father.dateOfDeath)

  // Mother
  setText(form, PAGE1.motherFamilyName, data.mother.familyName)
  setText(form, PAGE1.motherGivenName, data.mother.givenNames)
  setText(form, PAGE1.motherBirthDate, data.mother.dateOfBirth)
  setText(form, PAGE1.motherBirthCity, data.mother.townCityOfBirth)
  setText(form, PAGE1.motherBirthCountry, data.mother.countryOfBirth)
  setText(form, PAGE1.motherDeathDate, data.mother.dateOfDeath)

  // Q6 Background questions: "1" = YES, "2" = NO
  const bgKeys: (keyof BackgroundQuestions)[] = [
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k",
  ]
  for (const key of bgKeys) {
    const answer = data.backgroundQuestions[key]
    if (answer === "yes") {
      setRadio(form, bgRadioName(key), "1")
    } else if (answer === "no") {
      setRadio(form, bgRadioName(key), "2")
    }
  }

  setText(form, PAGE1.bgDetails, data.backgroundDetails)
}

// ── Page 2: Education, personal history, memberships, government ──

function fillPage2(
  form: ReturnType<PDFDocument["getForm"]>,
  data: Imm5669Data,
) {
  setText(form, PAGE2.elementary, data.educationYears.elementary)
  setText(form, PAGE2.secondary, data.educationYears.secondary)
  setText(form, PAGE2.university, data.educationYears.university)
  setText(form, PAGE2.trade, data.educationYears.tradeSchool)

  // Education table (up to 5 rows)
  const eduRows = data.educationHistory.slice(0, EDU_MAX_ROWS)
  eduRows.forEach((row, i) => {
    const r = i + 1
    const vals = [
      row.from,
      row.to,
      row.institutionName,
      row.cityAndCountry,
      row.certificateType,
      row.fieldOfStudy,
    ]
    EDU_CELLS.forEach((cell, ci) => {
      setText(form, eduField(r, cell), vals[ci])
    })
  })

  // Personal history table (up to 5 rows)
  const phRows = data.personalHistory.slice(0, PH_MAX_ROWS)
  phRows.forEach((row, i) => {
    const r = i + 1
    const vals = [
      row.from,
      row.to,
      row.activity,
      row.cityAndCountry,
      row.statusInCountry,
      row.companyOrEmployer,
    ]
    PH_CELLS.forEach((cell, ci) => {
      setText(form, phField(r, cell), vals[ci])
    })
  })

  // Membership table (up to 5 rows)
  const membRows = data.memberships.slice(0, MEMB_MAX_ROWS)
  membRows.forEach((row, i) => {
    const r = i + 1
    const vals = [
      row.from,
      row.to,
      row.organizationName,
      row.organizationType,
      row.activitiesOrPositions,
      row.cityAndCountry,
    ]
    MEMB_CELLS.forEach((cell, ci) => {
      setText(form, membField(r, cell), vals[ci])
    })
  })

  // Government positions table (up to 5 rows)
  const govRows = data.governmentPositions.slice(0, GOV_MAX_ROWS)
  govRows.forEach((row, i) => {
    const r = i + 1
    const vals = [
      row.from,
      row.to,
      row.countryAndJurisdiction,
      row.departmentBranch,
      row.activitiesOrPositions,
    ]
    GOV_CELLS.forEach((cell, ci) => {
      setText(form, govField(r, cell), vals[ci])
    })
  })
}

// ── Page 3: Military service, addresses ──

function fillPage3(
  form: ReturnType<PDFDocument["getForm"]>,
  data: Imm5669Data,
) {
  // Military: group by country into 2 blocks
  const { blocks } = groupMilitaryByCountry(data.militaryService)

  for (let blockIdx = 0; blockIdx < 2; blockIdx++) {
    const block = blocks[blockIdx as 0 | 1]
    if (!block) continue

    const blockNum = (blockIdx + 1) as 1 | 2
    const countryField =
      blockIdx === 0 ? PAGE3.country1 : PAGE3.country2
    setText(form, countryField, block.country)

    block.rows
      .slice(0, MIL_MAX_ROWS_PER_BLOCK)
      .forEach((row, i) => {
        const r = i + 1
        const vals = [
          row.from,
          row.to,
          row.branchAndUnit,
          row.ranks,
          row.combatDetails,
          row.reasonForEnd,
        ]
        vals.forEach((v, ci) => {
          const cellName = milCellName(r, ci)
          setText(form, milField(blockNum, r, cellName), v)
        })
      })
  }

  // Address table (up to 10 rows)
  const addrRows = data.addresses.slice(0, ADDR_MAX_ROWS)
  addrRows.forEach((row, i) => {
    const r = i + 1
    const vals = [
      row.from,
      row.to,
      row.streetAndNumber,
      row.cityOrTown,
      row.provinceStateDistrict,
      row.postalCode,
      row.country,
    ]
    ADDR_CELLS.forEach((cell, ci) => {
      setText(form, addrField(r, cell), vals[ci])
    })
  })
}

// ── Page 4: Declaration ──

function fillPage4(
  form: ReturnType<PDFDocument["getForm"]>,
  data: Imm5669Data,
) {
  const fullName = `${data.familyName}, ${data.givenNames}`.trim()
  setText(form, PAGE4.nameOfApplicant, fullName)
  setText(form, PAGE4.dateApplicantSigned, data.declarationDate)

  if (data.declarationDate) {
    const parts = data.declarationDate.split("-")
    if (parts.length === 3) {
      setText(form, PAGE4.year, parts[0])
      setText(form, PAGE4.month, parts[1])
      setText(form, PAGE4.day, parts[2])
    }
  }
}

// ── Overflow pages ──

const OVF_MARGIN = 50
const OVF_WIDTH = 612
const OVF_HEIGHT = 792
const OVF_LINE = 12

async function addOverflowPages(
  doc: PDFDocument,
  data: Imm5669Data,
  overflows: OverflowSection[],
) {
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  for (const section of overflows) {
    let page = doc.addPage([OVF_WIDTH, OVF_HEIGHT])
    let y = OVF_HEIGHT - OVF_MARGIN

    const nameLabel = `${data.familyName}, ${data.givenNames}`
    page.drawText(nameLabel, {
      x: OVF_MARGIN,
      y,
      size: 10,
      font: bold,
      color: rgb(0, 0, 0),
    })
    y -= OVF_LINE

    page.drawText(
      `IMM 5669 — Question ${section.questionNumber} (${section.label}) — continued`,
      { x: OVF_MARGIN, y, size: 9, font: bold, color: rgb(0, 0, 0) },
    )
    y -= OVF_LINE * 1.5

    // Column positions (evenly distributed)
    const numCols = section.headers.length
    const usable = OVF_WIDTH - 2 * OVF_MARGIN
    const colW = usable / numCols
    const colX = section.headers.map((_, i) => OVF_MARGIN + i * colW)

    // Header row
    section.headers.forEach((h, i) => {
      page.drawText(h, {
        x: colX[i],
        y,
        size: 7,
        font: bold,
        color: rgb(0.3, 0.3, 0.3),
      })
    })
    y -= OVF_LINE

    page.drawLine({
      start: { x: OVF_MARGIN, y: y + 4 },
      end: { x: OVF_WIDTH - OVF_MARGIN, y: y + 4 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })

    for (const row of section.rows) {
      if (y < OVF_MARGIN + OVF_LINE * 2) {
        page = doc.addPage([OVF_WIDTH, OVF_HEIGHT])
        y = OVF_HEIGHT - OVF_MARGIN

        page.drawText(
          `${nameLabel} — Q${section.questionNumber} (continued)`,
          { x: OVF_MARGIN, y, size: 9, font: bold, color: rgb(0, 0, 0) },
        )
        y -= OVF_LINE * 1.5
      }

      row.forEach((cell, i) => {
        const maxChars = Math.floor((colW - 4) / 4)
        const display =
          cell.length > maxChars
            ? cell.substring(0, maxChars - 1) + "…"
            : cell
        page.drawText(display || "—", {
          x: colX[i],
          y,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        })
      })
      y -= OVF_LINE
    }
  }
}
