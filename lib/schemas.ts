import { z } from "zod"

export const jobEntrySchema = z.object({
  title: z.string(),
  country: z.string(),
  yearsRange: z.string(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  present: z.boolean().optional(),
})

export const step0Schema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name"),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(2, "Please enter your last name"),
  dateOfBirth: z.string().min(1, "Please select your date of birth"),
  citizenshipCountry: z.string().trim().min(1, "Please enter your country of citizenship"),
  email: z
    .union([z.literal(""), z.string().email("Please enter a valid email address")])
    .optional(),
  consentAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Please confirm before continuing" }),
  }),
})

const step1BaseSchema = z.object({
  primaryGoal: z.enum(["pr", "study-permit", "work-permit", "sponsorship", "not-sure"], {
    required_error: "Please select a goal",
  }),
  timeUrgency: z.enum(["less-than-3", "3-to-6", "6-to-12", "flexible"], {
    required_error: "Please select a timeline",
  }),
  currentLocation: z.enum(["inside-canada", "outside-canada"], {
    required_error: "Please select your location",
  }),
  geographicFlexibility: z.enum(["yes-anywhere", "prefer-specific", "only-specific"], {
    required_error: "Please select an option",
  }),
  preferredProvince: z.string().optional(),
  deadlineTrigger: z.enum(
    [
      "status-expiring",
      "job-offer-start",
      "school-intake",
      "family-situation",
      "no-hard-deadline",
    ],
    {
      required_error: "Please select an option",
    },
  ),
  deadlineDate: z.string().optional(),
  studyPermitHasLOA: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  workPermitHasJobOffer: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  sponsorshipRelation: z
    .union([z.enum(["spouse-partner", "child", "parent-grandparent", "other"]), z.literal("")])
    .optional(),
})

export const step1Schema = step1BaseSchema.superRefine((data, ctx) => {
  if (
    (data.geographicFlexibility === "prefer-specific" ||
      data.geographicFlexibility === "only-specific") &&
    !data.preferredProvince
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["preferredProvince"],
      message: "Please select a province or territory",
    })
  }

  if (data.deadlineTrigger !== "no-hard-deadline" && !data.deadlineDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deadlineDate"],
      message: "Please provide the deadline date",
    })
  }

  if (data.primaryGoal === "study-permit" && !data.studyPermitHasLOA) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["studyPermitHasLOA"],
      message: "Please select an option",
    })
  }

  if (data.primaryGoal === "work-permit" && !data.workPermitHasJobOffer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["workPermitHasJobOffer"],
      message: "Please select an option",
    })
  }

  if (data.primaryGoal === "sponsorship" && !data.sponsorshipRelation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sponsorshipRelation"],
      message: "Please select an option",
    })
  }
})

const step2BaseSchema = z.object({
  currentStatus: z.enum(["citizen", "pr", "visitor", "student", "worker", "other"], {
    required_error: "Please select your status",
  }),
  statusExpiryDate: z.string().optional(),
  hasAppliedToExtendStatus: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  refusalHistory: z.enum(["no", "canada", "another-country", "both", "unsure"], {
    required_error: "Please select an option",
  }),
  mostRecentRefusalType: z
    .union([z.enum(["visitor", "study", "work", "pr", "sponsorship", "other", "not-sure"]), z.literal("")])
    .optional(),
  priorCanadaApplicationType: z
    .union([z.enum(["visitor", "study", "work", "pr", "sponsorship", "other", "not-sure"]), z.literal("")])
    .optional(),
  countryOfResidence: z.string().min(1, "Please enter your country of residence"),
  nationality: z.string().min(1, "Please enter your nationality"),
  priorApplications: z.enum(["yes", "no", "unsure"], {
    required_error: "Please select an option",
  }),
  currentLocation: z.enum(["inside-canada", "outside-canada"], {
    required_error: "Please select your location",
  }),
})

export const step2Schema = step2BaseSchema.superRefine((data, ctx) => {
  if (data.currentStatus !== "citizen" && data.currentStatus !== "pr" && !data.statusExpiryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["statusExpiryDate"],
      message: "Please provide your status expiry date",
    })
  }

  if (data.currentLocation === "inside-canada" && !data.hasAppliedToExtendStatus) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["hasAppliedToExtendStatus"],
      message: "Please select an option",
    })
  }

  if (data.refusalHistory !== "no" && !data.mostRecentRefusalType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mostRecentRefusalType"],
      message: "Please select the most recent refusal type",
    })
  }
})

const step3BaseSchema = z.object({
  currentJobTitle: z.string().optional(),
  countryOfWork: z.string().optional(),
  totalExperience: z.union([z.enum(["0-1", "1-3", "3-5", "5+", "not-sure"]), z.literal("")]).optional(),
  industryCategory: z.string().optional(),
  employmentGaps: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  mostRecentJobStart: z.string().optional(),
  mostRecentJobEnd: z.string().optional(),
  mostRecentJobPresent: z.boolean().optional(),
  hoursPerWeekRange: z.union([z.enum(["lt15", "15-29", "30plus", "varies-not-sure"]), z.literal("")]).optional(),
  paidWorkStatus: z.union([z.enum(["yes", "no", "mix-not-sure"]), z.literal("")]).optional(),
  employmentType: z.union([z.enum(["employee", "self-employed-contractor", "mix", "unsure"]), z.literal("")]).optional(),
  canObtainEmployerLetter: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  employerLetterChallenge: z
    .union([
      z.enum([
        "employer-wont-include-duties",
        "employer-closed-cant-contact",
        "self-employed",
        "informal-work-no-records",
        "other-not-sure",
      ]),
      z.literal(""),
    ])
    .optional(),
  hasOverlappingPeriods: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  jobs: z.array(jobEntrySchema).optional(),
})

export const step3Schema = step3BaseSchema.superRefine((data, ctx) => {
  if (!data.mostRecentJobStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mostRecentJobStart"],
      message: "Please provide the start date",
    })
  }

  if (!data.mostRecentJobPresent && !data.mostRecentJobEnd) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["mostRecentJobEnd"],
      message: "Please provide the end date or mark Present",
    })
  }

  if (!data.hoursPerWeekRange) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["hoursPerWeekRange"],
      message: "Please select an option",
    })
  }

  if (!data.paidWorkStatus) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paidWorkStatus"],
      message: "Please select an option",
    })
  }

  if (!data.employmentType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["employmentType"],
      message: "Please select an option",
    })
  }

  if (!data.canObtainEmployerLetter) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["canObtainEmployerLetter"],
      message: "Please select an option",
    })
  }

  if (data.canObtainEmployerLetter && data.canObtainEmployerLetter !== "yes" && !data.employerLetterChallenge) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["employerLetterChallenge"],
      message: "Please select the main challenge",
    })
  }

  if (!data.hasOverlappingPeriods) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["hasOverlappingPeriods"],
      message: "Please select an option",
    })
  }
})

const additionalCredentialSchema = z.object({
  educationLevel: z
    .union([
      z.enum([
        "none",
        "high-school",
        "one-year-diploma",
        "two-year-diploma",
        "bachelors",
        "two-or-more-degrees",
        "masters",
        "phd",
      ]),
      z.literal(""),
    ])
    .optional(),
  country: z.string().optional(),
  graduationYear: z.string().optional(),
  programLength: z
    .union([z.enum(["less-than-1-year", "1-year", "2-years", "3-plus-years", "not-sure"]), z.literal("")])
    .optional(),
})

export const step4Schema = z.object({
  educationLevel: z
    .union([
      z.enum([
        "none",
        "high-school",
        "one-year-diploma",
        "two-year-diploma",
        "bachelors",
        "two-or-more-degrees",
        "masters",
        "phd",
      ]),
      z.literal(""),
    ])
    .optional(),
  educationCountry: z.string().optional(),
  graduationYear: z.string().optional(),
  ecaStatus: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  canadaEducationStatus: z.enum(["yes", "no", "mix-some-in-canada", "not-sure"], {
    required_error: "Please select an option",
  }),
  programLength: z.enum(["less-than-1-year", "1-year", "2-years", "3-plus-years", "not-sure"], {
    required_error: "Please select an option",
  }),
  hasMultipleCredentials: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
  additionalCredentials: z.array(additionalCredentialSchema).optional(),
  ecaValid: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
})

const step5BaseSchema = z.object({
  languageTestStatus: z.enum(["yes", "no", "planning"], {
    required_error: "Please select an option",
  }),
  languageScores: z
    .object({
      listening: z.string().optional(),
      reading: z.string().optional(),
      writing: z.string().optional(),
      speaking: z.string().optional(),
    })
    .optional(),
  addScoresLater: z.boolean().optional(),
  plannedTestDate: z.string().optional(),
  languageApproxCLB: z.union([z.enum(["clb-4-6", "clb-7", "clb-8", "clb-9-plus", "not-sure"]), z.literal("")]).optional(),
  languageTestValid: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  languagePlannedTiming: z
    .union([z.enum(["within-1-month", "1-3-months", "3-plus-months", "not-scheduled"]), z.literal("")])
    .optional(),
  ageRange: z.enum(["17-or-less", "18-24", "25-29", "30-34", "35-39", "40-44", "45+"], {
    required_error: "Please select your age range",
  }),
  canadianEducation: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
  canadianWorkExperience: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  canadianWorkDuration: z.enum(["none", "less-than-1-year", "1-year", "2-plus-years", "not-sure"], {
    required_error: "Please select an option",
  }),
  secondOfficialLanguageIntent: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
})

export const step5Schema = step5BaseSchema.superRefine((data, ctx) => {
  if (data.languageTestStatus === "yes") {
    if (!data.languageApproxCLB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageApproxCLB"],
        message: "Please select your approximate language level",
      })
    }
    if (!data.languageTestValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageTestValid"],
        message: "Please select an option",
      })
    }
  }

  if (data.languageTestStatus === "planning" && !data.languagePlannedTiming) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["languagePlannedTiming"],
      message: "Please select when you plan to take the test",
    })
  }
})

const step6BaseSchema = z.object({
  maritalStatus: z.enum(["single", "married", "common-law", "separated", "divorced", "widowed"], {
    required_error: "Please select your marital status",
  }),
  dependents: z.number().min(0).optional(),
  spouseAccompanying: z
    .union([z.enum(["yes-accompanying", "no-non-accompanying", "not-sure"]), z.literal("")])
    .optional(),
  spouseLocation: z.union([z.enum(["in-canada", "outside-canada", "not-sure"]), z.literal("")]).optional(),
  closeRelativeInCanada: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
  closeRelativeRelationship: z
    .union([z.enum(["parent", "sibling", "child", "other-close-relative", "not-sure"]), z.literal("")])
    .optional(),
  hasDependentsUnder18: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
  hasDependents18Plus: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  sponsorshipTarget: z
    .union([z.enum(["spouse-partner", "child", "parent-grandparent", "other", "not-sure"]), z.literal("")])
    .optional(),
  sponsorStatus: z.union([z.enum(["citizen", "permanent-resident", "not-sure"]), z.literal("")]).optional(),
  partnerEducation: z.boolean().optional(),
  partnerLanguageScores: z.boolean().optional(),
  partnerWorkExperience: z.boolean().optional(),
})

function getStep6Schema(primaryGoal: "pr" | "study-permit" | "work-permit" | "sponsorship" | "not-sure" | "") {
  return step6BaseSchema.superRefine((data, ctx) => {
    const isPartnerCase = data.maritalStatus === "married" || data.maritalStatus === "common-law"
    if (isPartnerCase) {
      if (!data.spouseAccompanying) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["spouseAccompanying"],
          message: "Please select an option",
        })
      }
      if (!data.spouseLocation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["spouseLocation"],
          message: "Please select an option",
        })
      }
    }

    if (data.closeRelativeInCanada === "yes" && !data.closeRelativeRelationship) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeRelativeRelationship"],
        message: "Please select the relationship",
      })
    }

    if (primaryGoal === "sponsorship") {
      if (!data.sponsorshipTarget) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sponsorshipTarget"],
          message: "Please select an option",
        })
      }
      if (!data.sponsorStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sponsorStatus"],
          message: "Please select an option",
        })
      }
    }
  })
}

export const step6Schema = getStep6Schema("")

export function validateStep6(
  primaryGoal: "pr" | "study-permit" | "work-permit" | "sponsorship" | "not-sure" | "",
  data: unknown,
) {
  return getStep6Schema(primaryGoal).safeParse(data)
}

export const step7Schema = z.object({
  priorRefusals: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  criminalCharges: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  medicalIssues: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  misrepresentation: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  multipleCountries: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  nonTraditionalEmployment: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  missingDocuments: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  statusExpiringSoon: z.union([z.enum(["yes", "no", "na", "unsure"]), z.literal("")]).optional(),
  overstayHistory: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  removalOrDeportationHistory: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  hasActiveApplication: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  employerLetterUnwilling: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
})
