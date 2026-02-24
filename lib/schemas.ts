import { z } from "zod"
import {
  CANADIAN_PROVINCES_AND_TERRITORIES,
  CURRENT_PROVINCE_TERRITORY_OPTIONS,
} from "./canada-regions.js"
import { getCurrentCanadianRoleMonths, getQuickAddCanadianRoleCount } from "./work-derived.ts"

export const jobEntrySchema = z.object({
  title: z.string(),
  country: z.string(),
  yearsRange: z.string(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
  present: z.boolean().optional(),
})

const step0BaseSchema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name"),
  middleName: z.string().optional(),
  lastName: z.string().trim().min(2, "Please enter your last name"),
  dateOfBirth: z.string().min(1, "Please select your date of birth"),
  citizenshipCountry: z.string().trim().min(1, "Please enter your country of citizenship"),
  currentProvinceTerritory: z.enum(CURRENT_PROVINCE_TERRITORY_OPTIONS, {
    required_error: "Please select your current province or territory",
  }),
  intendedProvinceTerritory: z.enum(CANADIAN_PROVINCES_AND_TERRITORIES, {
    required_error: "Please select your intended province or territory",
  }),
  hasValidTemporaryStatus: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  temporaryStatusType: z
    .union([
      z.enum([
        "study-permit",
        "work-permit-open",
        "work-permit-employer-specific",
        "visitor-record",
      ]),
      z.literal(""),
    ])
    .optional(),
  temporaryStatusExpiryDate: z.string().optional(),
  exactAge: z.number().min(16, "Please enter your age.").max(70, "Please enter your age.").nullable().optional(),
  email: z
    .union([z.literal(""), z.string().email("Please enter a valid email address")])
    .optional(),
  consentAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Please confirm before continuing" }),
  }),
})

export const step0Schema = step0BaseSchema.superRefine((data, ctx) => {
  if (data.hasValidTemporaryStatus === "yes" && !data.temporaryStatusType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["temporaryStatusType"],
      message: "Please select your temporary status type",
    })
  }

  if (data.hasValidTemporaryStatus === "yes" && !data.temporaryStatusExpiryDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["temporaryStatusExpiryDate"],
      message: "Please provide your temporary status expiry date",
    })
  }
})

const step1BaseSchema = z.object({
  primaryGoal: z.enum(["pr", "study-permit", "work-permit", "sponsorship", "not-sure"], {
    required_error: "Please select a goal",
  }),
  timeUrgency: z.union([z.enum(["less-than-3", "3-to-6", "6-to-12", "flexible"]), z.literal("")]).optional(),
  currentLocation: z.enum(["inside-canada", "outside-canada"], {
    required_error: "Please select your location",
  }),
  geographicFlexibility: z.enum(["yes-anywhere", "prefer-specific", "only-specific"], {
    required_error: "Please select an option",
  }),
  preferredProvince: z.string().optional(),
  pnpTargetProvince: z.string().optional(),
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
  openToPNP: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
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

const mostRecentRefusalDateSchema = z.string().optional()

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
  mostRecentRefusalDate: mostRecentRefusalDateSchema,
  priorCanadaApplicationType: z
    .union([z.enum(["visitor", "study", "work", "pr", "sponsorship", "other", "not-sure"]), z.literal("")])
    .optional(),
  currentlyWorkingInCanada: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  currentJobProvinceTerritory: z.union([z.enum(CANADIAN_PROVINCES_AND_TERRITORIES), z.literal("")]).optional(),
  sameEmployerForPermanentOffer: z
    .union([z.enum(["yes", "no", "not-sure"]), z.literal("")])
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

  if (data.currentlyWorkingInCanada === "yes" && !data.currentJobProvinceTerritory) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentJobProvinceTerritory"],
      message: "Please select your job province or territory",
    })
  }

  if (data.currentlyWorkingInCanada === "yes" && !data.sameEmployerForPermanentOffer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sameEmployerForPermanentOffer"],
      message: "Please select an option",
    })
  }
})

function isCanadaCountry(value: string | undefined): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "canada" || normalized === "ca" || normalized === "can"
}

function hasAnyCanadianWorkEntry(data: { countryOfWork?: string; jobs?: Array<{ country?: string }> }): boolean {
  if (isCanadaCountry(data.countryOfWork)) return true
  return (data.jobs ?? []).some((job) => isCanadaCountry(job.country))
}

const step3BaseSchema = z.object({
  currentJobTitle: z.string().optional(),
  countryOfWork: z.string().optional(),
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
  hasCanadianJobOffer: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  jobOfferProvinceTerritory: z.union([z.enum(CANADIAN_PROVINCES_AND_TERRITORIES), z.literal("")]).optional(),
  jobOfferTitle: z.string().optional(),
  jobOfferEmployerName: z.string().optional(),
  jobOfferCity: z.string().optional(),
  jobOfferFullTime: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  jobOfferPermanent: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  jobOfferCompensation: z.string().optional(),
  jobOfferCompensationType: z.union([z.enum(["hourly", "annual"]), z.literal("")]).optional(),
  jobOfferTenure: z
    .union([z.enum(["lt-6-months", "6-12-months", "1-2-years", "2-plus-years"]), z.literal("")])
    .optional(),
  employerWillSupportPNP: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  occupationCategory: z
    .union([
      z.enum([
        "business-management",
        "it-software-data",
        "engineering",
        "healthcare",
        "trades",
        "hospitality-tourism",
        "sales-marketing",
        "education",
        "other",
      ]),
      z.literal(""),
    ])
    .optional(),
  occupationCategoryOtherRole: z.string().optional(),
  jobDuties: z.string().optional(),
  foreignSkilledYears: z
    .union([z.enum(["0", "1", "2", "3", "4", "5+"]), z.literal("")])
    .optional(),
  hasContinuous12MonthsSkilled: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  has12MonthsCanadaSkilled: z.union([z.enum(["yes", "no", "not_sure"]), z.literal("")]).optional(),
  canadianWorkAuthorizedAll: z
    .union([z.enum(["yes", "no", "not_sure"]), z.literal("")])
    .optional(),
  derivedCanadianSkilledYearsBand: z
    .union([z.enum(["0", "1", "2", "3", "4", "5+"]), z.literal("")])
    .optional(),
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

  if (!data.hasCanadianJobOffer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["hasCanadianJobOffer"],
      message: "Please select an option",
    })
  }

  if (!data.occupationCategory) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["occupationCategory"],
      message: "Please select an occupation",
    })
  }

  if (data.occupationCategory === "other" && !data.occupationCategoryOtherRole?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["occupationCategoryOtherRole"],
      message: "Please specify your role",
    })
  }

  const trimmedJobDuties = data.jobDuties?.trim() ?? ""
  if (!trimmedJobDuties) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["jobDuties"],
      message: "Please add more detail (minimum 120 characters).",
    })
  } else if (trimmedJobDuties.length < 120) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["jobDuties"],
      message: "Please add more detail (minimum 120 characters).",
    })
  } else if (trimmedJobDuties.length > 400) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["jobDuties"],
      message: "Maximum 400 characters reached.",
    })
  }

  if (data.hasCanadianJobOffer === "yes") {
    if (!data.jobOfferProvinceTerritory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferProvinceTerritory"],
        message: "Please select a province or territory",
      })
    }
    if (!data.jobOfferTitle?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferTitle"],
        message: "Please enter the job title",
      })
    }
    if (!data.jobOfferEmployerName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferEmployerName"],
        message: "Please enter the employer name",
      })
    }
    if (!data.jobOfferCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferCity"],
        message: "Please enter the job location city",
      })
    }
    if (!data.jobOfferFullTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferFullTime"],
        message: "Please select an option",
      })
    }
    if (!data.jobOfferPermanent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferPermanent"],
        message: "Please select an option",
      })
    }
    if (!data.jobOfferCompensation?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferCompensation"],
        message: "Please enter compensation",
      })
    }
    if (!data.jobOfferCompensationType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferCompensationType"],
        message: "Please select compensation type",
      })
    }
    if (!data.jobOfferTenure) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobOfferTenure"],
        message: "Please select an option",
      })
    }
    if (!data.employerWillSupportPNP) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employerWillSupportPNP"],
        message: "Please select an option",
      })
    }
  }

  if (!data.foreignSkilledYears) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["foreignSkilledYears"],
      message: "Select your years of experience.",
    })
  }

  const hasCanadianWorkEntries = hasAnyCanadianWorkEntry(data)

  if (hasCanadianWorkEntries && !data.has12MonthsCanadaSkilled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["has12MonthsCanadaSkilled"],
      message: "Select one option.",
    })
  }

  if (hasCanadianWorkEntries && data.has12MonthsCanadaSkilled === "yes") {
    const currentCanadianMonths = getCurrentCanadianRoleMonths(data)
    const quickAddCanadianRoles = getQuickAddCanadianRoleCount(data)
    if (currentCanadianMonths < 12 && quickAddCanadianRoles === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["jobs"],
        message: "To confirm 12+ months in Canada, add your previous Canadian role(s) or update your answer.",
      })
    }
  }

  if (hasCanadianWorkEntries && !data.canadianWorkAuthorizedAll) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["canadianWorkAuthorizedAll"],
      message: "Select one option.",
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
  fieldOfStudy: z.enum(
    [
      "business",
      "it-computer-science",
      "engineering",
      "health",
      "trades",
      "arts-social-sciences",
      "other",
    ],
    {
      required_error: "Please select a field of study",
    },
  ),
  educationCountry: z.string().optional(),
  graduationYear: z.string().optional(),
  ecaStatus: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  canadaEducationStatus: z.enum(["yes", "no", "mix-some-in-canada", "not-sure"], {
    required_error: "Please select an option",
  }),
  educationCompletedInCanada: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  canadianEducationProvinceTerritory: z
    .union([z.enum(CANADIAN_PROVINCES_AND_TERRITORIES), z.literal("")])
    .optional(),
  canadianEducationPublicInstitution: z
    .union([z.enum(["yes", "no", "not-sure"]), z.literal("")])
    .optional(),
  programLength: z.enum(["less-than-1-year", "1-year", "2-years", "3-plus-years", "not-sure"], {
    required_error: "Please select an option",
  }),
  hasMultipleCredentials: z.enum(["yes", "no", "not-sure"], {
    required_error: "Please select an option",
  }),
  additionalCredentials: z.array(additionalCredentialSchema).optional(),
  ecaValid: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
}).superRefine((data, ctx) => {
  if (data.educationCompletedInCanada === "yes" && !data.canadianEducationProvinceTerritory) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["canadianEducationProvinceTerritory"],
      message: "Please select a province or territory",
    })
  }

  if (data.educationCompletedInCanada === "yes" && !data.canadianEducationPublicInstitution) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["canadianEducationPublicInstitution"],
      message: "Please select an option",
    })
  }
})

const step5BaseSchema = z.object({
  languageTestStatus: z.union([z.enum(["valid", "not_valid", "booked"]), z.literal("")]).optional(),
  languageTestPlannedDate: z.string().optional(),
  languageTestPlan: z.union([z.enum(["english-only", "french-only", "both-languages", "not-sure"]), z.literal("")]).optional(),
  englishTestStatus: z.union([z.enum(["completed", "booked", "not-taken"]), z.literal("")]).optional(),
  englishTestType: z
    .union([z.enum(["ielts-general-training", "celpip-general"]), z.literal("")])
    .optional(),
  englishPlannedTestDate: z.string().optional(),
  frenchTestStatus: z.union([z.enum(["completed", "booked", "not-taken"]), z.literal("")]).optional(),
  frenchTestType: z.union([z.enum(["tef-canada", "tcf-canada"]), z.literal("")]).optional(),
  frenchPlannedTestDate: z.string().optional(),
  languageScores: z
    .object({
      listening: z.string().optional(),
      reading: z.string().optional(),
      writing: z.string().optional(),
      speaking: z.string().optional(),
    })
    .optional(),
  addScoresLater: z.boolean().optional(),
  ageRange: z.union([z.enum(["17-or-less", "18-24", "25-29", "30-34", "35-39", "40-44", "45+"]), z.literal("")]).optional(),
  canadianEducation: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
  canadianWorkExperience: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  canadianWorkDuration: z
    .union([z.enum(["none", "less-than-1-year", "1-year", "2-plus-years", "not-sure"]), z.literal("")])
    .optional(),
  secondOfficialLanguageIntent: z.union([z.enum(["yes", "no", "not-sure"]), z.literal("")]).optional(),
})

export const step5Schema = step5BaseSchema.superRefine((data, ctx) => {
  if (!data.languageTestStatus) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["languageTestStatus"],
      message: "Select one option.",
    })
  }

  if (data.languageTestStatus === "valid") {
    const scores = data.languageScores ?? {}
    if (!scores.listening?.trim() || !scores.reading?.trim() || !scores.writing?.trim() || !scores.speaking?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageScores", "listening"],
        message: "Enter all four scores.",
      })
    }
  }

  if (data.languageTestStatus === "booked") {
    if (!data.languageTestPlannedDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["languageTestPlannedDate"],
        message: "Select your test date.",
      })
    } else {
      const plannedDate = new Date(`${data.languageTestPlannedDate}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (Number.isNaN(plannedDate.getTime()) || plannedDate <= today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["languageTestPlannedDate"],
          message: "Select your test date.",
        })
      }
    }
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
  hasCloseRelativeInCanada: z.enum(["yes", "no"], {
    required_error: "Please select an option",
  }),
  relativeProvinceTerritory: z
    .union([z.enum(CANADIAN_PROVINCES_AND_TERRITORIES), z.literal("")])
    .optional(),
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

    if (data.hasCloseRelativeInCanada === "yes" && !data.relativeProvinceTerritory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relativeProvinceTerritory"],
        message: "Please select a province or territory",
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
  priorRefusals: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  criminalCharges: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  medicalIssues: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  misrepresentation: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  multipleCountries: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  nonTraditionalEmployment: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  missingDocuments: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  statusExpiringSoon: z.union([z.enum(["yes", "no", "na"]), z.literal("")]).optional(),
  overstayHistory: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  removalOrDeportationHistory: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  hasActiveApplication: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  employerLetterUnwilling: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
  workedWithoutAuthorizationInCanada: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  refusedProvincialNomination: z.union([z.enum(["yes", "no"]), z.literal("")]).optional(),
  isSkilledTrade: z.union([z.enum(["yes", "no", "unsure"]), z.literal("")]).optional(),
})
