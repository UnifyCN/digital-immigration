import { z } from "zod"

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/
const DATE_YYYY_MM = /^\d{4}-\d{2}$/

const optionalDateYMD = z.string().refine(
  (v) => v === "" || DATE_YYYY_MM_DD.test(v),
  { message: "Use YYYY-MM-DD format (e.g. 1990-05-15)" },
)

const requiredDateYMD = z.string().min(1, "Required").refine(
  (v) => DATE_YYYY_MM_DD.test(v),
  { message: "Use YYYY-MM-DD format (e.g. 1990-05-15)" },
)

const requiredDateYM = z.string().min(1, "Required").refine(
  (v) => DATE_YYYY_MM.test(v),
  { message: "Use YYYY-MM format (e.g. 2020-01)" },
)

const optionalDateYM = z.string().refine(
  (v) => v === "" || DATE_YYYY_MM.test(v),
  { message: "Use YYYY-MM format (e.g. 2020-01)" },
)

function parseYM(ym: string): Date | null {
  if (!DATE_YYYY_MM.test(ym)) return null
  const [y, m] = ym.split("-").map(Number)
  return new Date(y, m - 1, 1)
}

function validateNoGaps(
  rows: { from: string; to: string }[],
  ctx: z.RefinementCtx,
  path: string,
) {
  const valid = rows.filter((r) => r.from && r.to)
  if (valid.length < 2) return

  const sorted = [...valid].sort((a, b) => {
    const da = parseYM(a.from)
    const db = parseYM(b.from)
    if (!da || !db) return 0
    return da.getTime() - db.getTime()
  })

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentTo = parseYM(sorted[i].to)
    const nextFrom = parseYM(sorted[i + 1].from)
    if (!currentTo || !nextFrom) continue

    const gapMs = nextFrom.getTime() - currentTo.getTime()
    const oneMonthMs = 32 * 24 * 60 * 60 * 1000
    if (gapMs > oneMonthMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Gap detected between ${sorted[i].to} and ${sorted[i + 1].from}. All time periods must be accounted for.`,
        path: [path],
      })
    }
  }
}

// ── Section 1: Applicant Information ──

export const section1Schema = z.object({
  applicantType: z.enum(["principal", "spouse-dependent"], {
    required_error: "Select applicant type",
  }),
  familyName: z.string().min(1, "Family name is required"),
  givenNames: z.string().min(1, "Given name(s) required"),
  nativeScriptName: z.string(),
  dateOfBirth: requiredDateYMD,
})

// ── Section 2: Parent Details ──

const parentSchema = z.object({
  familyName: z.string().min(1, "Required"),
  givenNames: z.string().min(1, "Required"),
  dateOfBirth: optionalDateYMD,
  townCityOfBirth: z.string(),
  countryOfBirth: z.string(),
  dateOfDeath: optionalDateYMD,
})

export const section2Schema = z.object({
  father: parentSchema,
  mother: parentSchema,
})

// ── Section 3: Background Questions ──

const yesNoField = z.enum(["yes", "no"], { required_error: "Required" })

export const section3Schema = z.object({
  backgroundQuestions: z.object({
    a: yesNoField,
    b: yesNoField,
    c: yesNoField,
    d: yesNoField,
    e: yesNoField,
    f: yesNoField,
    g: yesNoField,
    h: yesNoField,
    i: yesNoField,
    j: yesNoField,
    k: yesNoField,
  }),
  backgroundDetails: z.string(),
}).superRefine((data, ctx) => {
  const anyYes = Object.values(data.backgroundQuestions).some((v) => v === "yes")
  if (anyYes && !data.backgroundDetails.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide details for any 'Yes' answer above.",
      path: ["backgroundDetails"],
    })
  }
})

// ── Section 4: Education ──

const educationRowSchema = z.object({
  from: requiredDateYM,
  to: requiredDateYM,
  institutionName: z.string().min(1, "Required"),
  cityAndCountry: z.string().min(1, "Required"),
  certificateType: z.string(),
  fieldOfStudy: z.string(),
})

export const section4Schema = z.object({
  educationYears: z.object({
    elementary: z.string(),
    secondary: z.string(),
    university: z.string(),
    tradeSchool: z.string(),
  }),
  educationHistory: z.array(educationRowSchema).min(1, "Add at least one education entry"),
})

// ── Section 5: Personal History ──

const personalHistoryRowSchema = z.object({
  from: requiredDateYM,
  to: requiredDateYM,
  activity: z.string().min(1, "Required"),
  cityAndCountry: z.string().min(1, "Required"),
  statusInCountry: z.string(),
  companyOrEmployer: z.string(),
})

export const section5Schema = z.object({
  personalHistory: z.array(personalHistoryRowSchema).min(1, "Add at least one entry"),
}).superRefine((data, ctx) => {
  validateNoGaps(data.personalHistory, ctx, "personalHistory")
})

// ── Section 6: Memberships & Government Positions ──

const membershipRowSchema = z.object({
  from: requiredDateYM,
  to: requiredDateYM,
  organizationName: z.string().min(1, "Required"),
  organizationType: z.string(),
  activitiesOrPositions: z.string(),
  cityAndCountry: z.string(),
})

const govPositionRowSchema = z.object({
  from: requiredDateYM,
  to: requiredDateYM,
  countryAndJurisdiction: z.string().min(1, "Required"),
  departmentBranch: z.string(),
  activitiesOrPositions: z.string(),
})

export const section6Schema = z.object({
  memberships: z.array(membershipRowSchema),
  governmentPositions: z.array(govPositionRowSchema),
})

// ── Section 7: Military Service & Addresses ──

const militaryRowSchema = z.object({
  country: z.string().min(1, "Required"),
  from: requiredDateYM,
  to: requiredDateYM,
  branchAndUnit: z.string(),
  ranks: z.string(),
  combatDetails: z.string(),
  reasonForEnd: z.string(),
})

const addressRowSchema = z.object({
  from: requiredDateYM,
  to: requiredDateYM,
  streetAndNumber: z.string().min(1, "Required"),
  cityOrTown: z.string().min(1, "Required"),
  provinceStateDistrict: z.string(),
  postalCode: z.string(),
  country: z.string().min(1, "Required"),
})

export const section7Schema = z.object({
  militaryService: z.array(militaryRowSchema),
  addresses: z.array(addressRowSchema).min(1, "Add at least one address"),
}).superRefine((data, ctx) => {
  if (data.militaryService.length > 0) {
    validateNoGaps(data.militaryService, ctx, "militaryService")
  }
  validateNoGaps(data.addresses, ctx, "addresses")
})

// ── Full form schema (for final validation + API) ──

export const imm5669FullSchema = z.object({
  applicantType: z.enum(["principal", "spouse-dependent"]),
  familyName: z.string().min(1),
  givenNames: z.string().min(1),
  nativeScriptName: z.string(),
  dateOfBirth: requiredDateYMD,
  father: parentSchema,
  mother: parentSchema,
  backgroundQuestions: z.object({
    a: yesNoField, b: yesNoField, c: yesNoField, d: yesNoField,
    e: yesNoField, f: yesNoField, g: yesNoField, h: yesNoField,
    i: yesNoField, j: yesNoField, k: yesNoField,
  }),
  backgroundDetails: z.string(),
  educationYears: z.object({
    elementary: z.string(),
    secondary: z.string(),
    university: z.string(),
    tradeSchool: z.string(),
  }),
  educationHistory: z.array(educationRowSchema),
  personalHistory: z.array(personalHistoryRowSchema),
  memberships: z.array(membershipRowSchema),
  governmentPositions: z.array(govPositionRowSchema),
  militaryService: z.array(militaryRowSchema),
  addresses: z.array(addressRowSchema),
  declarationDate: requiredDateYMD,
}).superRefine((data, ctx) => {
  const anyYes = Object.values(data.backgroundQuestions).some((v) => v === "yes")
  if (anyYes && !data.backgroundDetails.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Background details required when any answer is 'Yes'.",
      path: ["backgroundDetails"],
    })
  }
  validateNoGaps(data.personalHistory, ctx, "personalHistory")
  if (data.militaryService.length > 0) {
    validateNoGaps(data.militaryService, ctx, "militaryService")
  }
  validateNoGaps(data.addresses, ctx, "addresses")
})

export const sectionSchemas = [
  section1Schema,
  section2Schema,
  section3Schema,
  section4Schema,
  section5Schema,
  section6Schema,
  section7Schema,
] as const
