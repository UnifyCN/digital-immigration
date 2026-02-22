import { z } from "zod"

export const jobEntrySchema = z.object({
  title: z.string(),
  country: z.string(),
  yearsRange: z.string(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  present: z.boolean().optional(),
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

export const step1Schema = step1BaseSchema
  .superRefine((data, ctx) => {
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

export const step2Schema = step2BaseSchema
  .superRefine((data, ctx) => {
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
  employmentType: z.union([z.enum(["employee", "self-employed-contractor", "mix", "not-sure"]), z.literal("")]).optional(),
  canObtainEmployerLetter: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  employerLetterChallenge: z.union([
    z.enum([
      "employer-wont-include-duties",
      "employer-closed-cant-contact",
      "self-employed",
      "informal-work-no-records",
      "other-not-sure",
    ]),
    z.literal(""),
  ]).optional(),
  hasOverlappingPeriods: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
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

  if (data.canObtainEmployerLetter !== "yes" && !data.employerLetterChallenge) {
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

export const step4Schema = z.object({
  educationLevel: z.enum([
    "none", "high-school", "one-year-diploma", "two-year-diploma",
    "bachelors", "two-or-more-degrees", "masters", "phd",
  ]).optional(),
  educationCountry: z.string().optional(),
  graduationYear: z.string().optional(),
  ecaStatus: z.enum(["yes", "no", "not-sure"]).optional(),
})

export const step5Schema = z.object({
  languageTestStatus: z.enum(["yes", "no", "planning"]).optional(),
  languageScores: z.object({
    listening: z.string().optional(),
    reading: z.string().optional(),
    writing: z.string().optional(),
    speaking: z.string().optional(),
  }).optional(),
  addScoresLater: z.boolean().optional(),
  plannedTestDate: z.string().optional(),
  ageRange: z.enum(["17-or-less", "18-24", "25-29", "30-34", "35-39", "40-44", "45+"]).optional(),
  canadianEducation: z.enum(["yes", "no", "unsure"]).optional(),
  canadianWorkExperience: z.enum(["yes", "no", "unsure"]).optional(),
})

export const step6Schema = z.object({
  maritalStatus: z.enum(["single", "married", "common-law", "separated", "divorced", "widowed"]).optional(),
  dependents: z.number().min(0).optional(),
  partnerEducation: z.boolean().optional(),
  partnerLanguageScores: z.boolean().optional(),
  partnerWorkExperience: z.boolean().optional(),
})

export const step7Schema = z.object({
  priorRefusals: z.enum(["yes", "no", "unsure"]).optional(),
  criminalCharges: z.enum(["yes", "no", "unsure"]).optional(),
  medicalIssues: z.enum(["yes", "no", "unsure"]).optional(),
  misrepresentation: z.enum(["yes", "no", "unsure"]).optional(),
  multipleCountries: z.enum(["yes", "no", "unsure"]).optional(),
  nonTraditionalEmployment: z.enum(["yes", "no", "unsure"]).optional(),
  missingDocuments: z.enum(["yes", "no", "unsure"]).optional(),
})

export const fullAssessmentSchema = z.object({
  ...step1BaseSchema.shape,
  ...step2BaseSchema.shape,
  ...step3BaseSchema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
  ...step6Schema.shape,
  ...step7Schema.shape,
})
