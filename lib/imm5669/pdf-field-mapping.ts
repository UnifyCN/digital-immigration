/**
 * AcroForm field mapping for the official IMM 5669 (10-2018) PDF.
 *
 * The template was pre-processed with qpdf to strip XFA and expose
 * the underlying AcroForm fields. Field names follow the pattern:
 *   IMM_5669[0].page{N}[0].{fieldName}[0]
 *
 * Radio groups use options "1" (YES / principal) and "2" (NO / dependent).
 *
 * Table fields follow:
 *   ...{tableName}[0].Row{N}[0].{cellName}[0]
 */

import type { Imm5669Data, BackgroundQuestions } from "./types"

const P = "IMM_5669[0]"

// ── Page 1 ──

export const PAGE1 = {
  applicantChoice: `${P}.page1[0].applicantChoice[0]`,
  familyName:      `${P}.page1[0].familyName[0]`,
  givenName:       `${P}.page1[0].givenName[0]`,
  nativeScript:    `${P}.page1[0].OriginalLanguage2[0]`,
  dateOfBirth:     `${P}.page1[0].birthDate3[0]`,

  fatherFamilyName:  `${P}.page1[0].fathersFamilyName[0]`,
  fatherGivenName:   `${P}.page1[0].fathersGivenName[0]`,
  fatherBirthDate:   `${P}.page1[0].fathersBirthDate[0]`,
  fatherBirthCity:   `${P}.page1[0].FathersBirthCity[0]`,
  fatherBirthCountry:`${P}.page1[0].fathersBirthCountry[0]`,
  fatherDeathDate:   `${P}.page1[0].fathersDeathDate[0]`,

  motherFamilyName:  `${P}.page1[0].mothersBirthFamilyName[0]`,
  motherGivenName:   `${P}.page1[0].mothersGivenName[0]`,
  motherBirthDate:   `${P}.page1[0].mothersBirthDate[0]`,
  motherBirthCity:   `${P}.page1[0].mothersBirthCity[0]`,
  motherBirthCountry:`${P}.page1[0].mothersBirthCountry[0]`,
  motherDeathDate:   `${P}.page1[0].mothersDeathDate[0]`,

  bgDetails:         `${P}.page1[0].ifYestoExplain[0]`,
} as const

export function bgRadioName(key: keyof BackgroundQuestions): string {
  return `${P}.page1[0].${key}YesNo[0]`
}

// ── Page 2 ──

export const PAGE2 = {
  elementary: `${P}.page2[0].elementary[0]`,
  secondary:  `${P}.page2[0].secondary[0]`,
  university: `${P}.page2[0].university[0]`,
  trade:      `${P}.page2[0].trade[0]`,
} as const

function tableField(
  page: string,
  table: string,
  row: number,
  cell: string,
): string {
  return `${P}.${page}.${table}.Row${row}[0].${cell}[0]`
}

// Education table: 5 rows, cells: fromDate, toDate, Cell3 (institution), Cell4 (city), Cell5 (cert), Cell6 (field)
export const EDU_MAX_ROWS = 5
export function eduField(row: number, cell: string): string {
  return tableField("page2[0]", "educationTable[0]", row, cell)
}
export const EDU_CELLS = ["fromDate", "toDate", "Cell3", "Cell4", "Cell5", "Cell6"] as const

// Personal history table: 5 rows, cells: fromDate, toDate, Cell3 (activity), Cell4 (city), Cell5 (status), Cell6 (employer)
export const PH_MAX_ROWS = 5
export function phField(row: number, cell: string): string {
  return tableField("page2[0]", "personalHistoryTable[0]", row, cell)
}
export const PH_CELLS = ["fromDate", "toDate", "Cell3", "Cell4", "Cell5", "Cell6"] as const

// Membership table: 5 rows, cells: fromDate, toDate, Cell3 (name), Cell4 (type), Cell5 (activities), Cell6 (city)
export const MEMB_MAX_ROWS = 5
export function membField(row: number, cell: string): string {
  return tableField("page2[0]", "membershipTable[0]", row, cell)
}
export const MEMB_CELLS = ["fromDate", "toDate", "Cell3", "Cell4", "Cell5", "Cell6"] as const

// Government positions table: 5 rows, cells: fromDate, toDate, Cell3 (jurisdiction), Cell4 (dept), Cell5 (activities)
export const GOV_MAX_ROWS = 5
export function govField(row: number, cell: string): string {
  return tableField("page2[0]", "governmentPositionsTable[0]", row, cell)
}
export const GOV_CELLS = ["fromDate", "toDate", "Cell3", "Cell4", "Cell5"] as const

// ── Page 3 ──

export const PAGE3 = {
  country1: `${P}.page3[0].country1[0]`,
  country2: `${P}.page3[0].country2[0]`,
} as const

// Military tables: 2 blocks of 6 rows each
// Rows 1-5: fromDate, toDate, Cell3 (branch), Cell4 (rank), Cell5 (combat), Cell6 (reason)
// Row 6: fromDate, Cell2 (toDate), Cell3, Cell4, Cell5, Cell6
export const MIL_MAX_ROWS_PER_BLOCK = 6
export function milField(block: 1 | 2, row: number, cell: string): string {
  return tableField("page3[0]", `militaryServiceTable${block}[0]`, row, cell)
}
export function milCellName(row: number, colIndex: number): string {
  if (row === 6) {
    return ["fromDate", "Cell2", "Cell3", "Cell4", "Cell5", "Cell6"][colIndex]
  }
  return ["fromDate", "toDate", "Cell3", "Cell4", "Cell5", "Cell6"][colIndex]
}

// Address table: 10 rows, cells: fromDate, toDate, Cell3 (street), Cell4 (city), Cell5 (province), Cell6 (postal), Cell7 (country)
export const ADDR_MAX_ROWS = 10
export function addrField(row: number, cell: string): string {
  return tableField("page3[0]", "addressTable[0]", row, cell)
}
export const ADDR_CELLS = ["fromDate", "toDate", "Cell3", "Cell4", "Cell5", "Cell6", "Cell7"] as const

// ── Page 4 ──

export const PAGE4 = {
  signatureApplicant:   `${P}.page4[0].signatureApplicant[0]`,
  dateApplicantSigned:  `${P}.page4[0].dateApplicantSigned[0]`,
  interpreterName:      `${P}.page4[0].interpreterName[0]`,
  language:             `${P}.page4[0].langugeOfTranslation[0]`,
  signatureInterpreter: `${P}.page4[0].signatureInterpreter[0]`,
  nameOfApplicant:      `${P}.page4[0].nameOfApplicant[0]`,
  signatureWitnessed:   `${P}.page4[0].signatureApplicantWitnessed[0]`,
  declaredBefore:       `${P}.page4[0].declaredBefore[0]`,
  day:                  `${P}.page4[0].day[0]`,
  month:                `${P}.page4[0].month[0]`,
  year:                 `${P}.page4[0].year[0]`,
  nameRepresentative:   `${P}.page4[0].nameRepresentative[0]`,
  signatureRepresentative: `${P}.page4[0].signatureRepresentative[0]`,
} as const

// ── Military grouping helpers ──

export interface MilitaryBlock {
  country: string
  rows: Imm5669Data["militaryService"]
}

/**
 * Groups military rows by country into at most 2 blocks (matching the
 * 2 country-sections on page 3). Rows beyond the capacity overflow.
 */
export function groupMilitaryByCountry(
  militaryService: Imm5669Data["militaryService"],
): { blocks: [MilitaryBlock | null, MilitaryBlock | null]; overflow: Imm5669Data["militaryService"] } {
  const countryOrder: string[] = []
  const byCountry = new Map<string, Imm5669Data["militaryService"]>()

  for (const row of militaryService) {
    const key = row.country.trim()
    if (!byCountry.has(key)) {
      countryOrder.push(key)
      byCountry.set(key, [])
    }
    byCountry.get(key)!.push(row)
  }

  const blocks: [MilitaryBlock | null, MilitaryBlock | null] = [null, null]
  const overflow: Imm5669Data["militaryService"] = []

  countryOrder.forEach((country, idx) => {
    const rows = byCountry.get(country)!
    if (idx < 2) {
      blocks[idx as 0 | 1] = {
        country,
        rows: rows.slice(0, MIL_MAX_ROWS_PER_BLOCK),
      }
      if (rows.length > MIL_MAX_ROWS_PER_BLOCK) {
        overflow.push(...rows.slice(MIL_MAX_ROWS_PER_BLOCK))
      }
    } else {
      overflow.push(...rows)
    }
  })

  return { blocks, overflow }
}

function getMilitaryOverflowRows(
  militaryService: Imm5669Data["militaryService"],
): Imm5669Data["militaryService"] {
  return groupMilitaryByCountry(militaryService).overflow
}

// ── Overflow detection ──

export interface OverflowSection {
  questionNumber: number
  label: string
  rows: string[][]
  headers: string[]
}

export function detectOverflow(data: Imm5669Data): OverflowSection[] {
  const overflows: OverflowSection[] = []

  if (data.educationHistory.length > EDU_MAX_ROWS) {
    overflows.push({
      questionNumber: 7,
      label: "Education",
      headers: ["From", "To", "Institution", "City/Country", "Certificate", "Field of Study"],
      rows: data.educationHistory.slice(EDU_MAX_ROWS).map(r => [
        r.from, r.to, r.institutionName, r.cityAndCountry, r.certificateType, r.fieldOfStudy,
      ]),
    })
  }

  if (data.personalHistory.length > PH_MAX_ROWS) {
    overflows.push({
      questionNumber: 8,
      label: "Personal History",
      headers: ["From", "To", "Activity", "City/Country", "Status", "Employer/School"],
      rows: data.personalHistory.slice(PH_MAX_ROWS).map(r => [
        r.from, r.to, r.activity, r.cityAndCountry, r.statusInCountry, r.companyOrEmployer,
      ]),
    })
  }

  if (data.memberships.length > MEMB_MAX_ROWS) {
    overflows.push({
      questionNumber: 9,
      label: "Memberships",
      headers: ["From", "To", "Organization", "Type", "Activities", "City/Country"],
      rows: data.memberships.slice(MEMB_MAX_ROWS).map(r => [
        r.from, r.to, r.organizationName, r.organizationType, r.activitiesOrPositions, r.cityAndCountry,
      ]),
    })
  }

  if (data.governmentPositions.length > GOV_MAX_ROWS) {
    overflows.push({
      questionNumber: 10,
      label: "Government Positions",
      headers: ["From", "To", "Jurisdiction", "Department", "Positions"],
      rows: data.governmentPositions.slice(GOV_MAX_ROWS).map(r => [
        r.from, r.to, r.countryAndJurisdiction, r.departmentBranch, r.activitiesOrPositions,
      ]),
    })
  }

  const milOverflowRows = getMilitaryOverflowRows(data.militaryService)
  if (milOverflowRows.length > 0) {
    overflows.push({
      questionNumber: 11,
      label: "Military Service",
      headers: ["Country", "From", "To", "Branch/Unit", "Rank", "Combat", "Reason for End"],
      rows: milOverflowRows.map(r => [
        r.country, r.from, r.to, r.branchAndUnit, r.ranks, r.combatDetails, r.reasonForEnd,
      ]),
    })
  }

  if (data.addresses.length > ADDR_MAX_ROWS) {
    overflows.push({
      questionNumber: 12,
      label: "Addresses",
      headers: ["From", "To", "Street", "City", "Province", "Postal Code", "Country"],
      rows: data.addresses.slice(ADDR_MAX_ROWS).map(r => [
        r.from, r.to, r.streetAndNumber, r.cityOrTown, r.provinceStateDistrict, r.postalCode, r.country,
      ]),
    })
  }

  return overflows
}
