import { z } from "zod"

export const jobEntrySchema = z.object({
  title: z.string(),
  country: z.string(),
  yearsRange: z.string(),
})

export const step1Schema = z.object({
  primaryGoal: z.enum(["pr", "study-permit", "work-permit", "sponsorship", "not-sure"], {
    required_error: "Please select a goal",
  }),
  timeUrgency: z.enum(["less-than-3", "3-to-6", "6-to-12", "flexible"], {
    required_error: "Please select a timeline",
  }),
  currentLocation: z.enum(["inside-canada", "outside-canada"], {
    required_error: "Please select your location",
  }),
})

export const step2Schema = z.object({
  currentStatus: z.enum(["citizen", "pr", "visitor", "student", "worker", "other"], {
    required_error: "Please select your status",
  }),
  statusExpiryDate: z.string().optional(),
  countryOfResidence: z.string().min(1, "Please enter your country of residence"),
  nationality: z.string().min(1, "Please enter your nationality"),
  priorApplications: z.enum(["yes", "no", "unsure"], {
    required_error: "Please select an option",
  }),
})

export const step3Schema = z.object({
  currentJobTitle: z.string().optional(),
  countryOfWork: z.string().optional(),
  totalExperience: z.enum(["0-1", "1-3", "3-5", "5+", "not-sure"]).optional(),
  industryCategory: z.string().optional(),
  employmentGaps: z.enum(["yes", "no", "unsure"]).optional(),
  jobs: z.array(jobEntrySchema).optional(),
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
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
  ...step5Schema.shape,
  ...step6Schema.shape,
  ...step7Schema.shape,
})
