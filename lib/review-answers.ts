import type { AssessmentData } from "@/lib/types"

export type ReviewFieldConfig = {
  key: keyof AssessmentData
  label: string
}

export type ReviewSectionConfig = {
  id: string
  title: string
  editStep: number
  fields: ReviewFieldConfig[]
}

export const reviewSections: ReviewSectionConfig[] = [
  {
    id: "basic-information",
    title: "Basic Information",
    editStep: 1,
    fields: [
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Last name" },
      { key: "citizenshipCountry", label: "Country of citizenship" },
      { key: "currentProvinceTerritory", label: "Current province/territory" },
      { key: "intendedProvinceTerritory", label: "Intended province/territory" },
      { key: "hasValidTemporaryStatus", label: "Has valid temporary status in Canada" },
      { key: "temporaryStatusType", label: "Temporary status type" },
      { key: "temporaryStatusExpiryDate", label: "Temporary status expiry date" },
    ],
  },
  {
    id: "goal",
    title: "Goal",
    editStep: 2,
    fields: [
      { key: "primaryGoal", label: "Primary goal" },
      { key: "timeUrgency", label: "Timeline urgency" },
      { key: "currentLocation", label: "Current location" },
      { key: "geographicFlexibility", label: "Geographic flexibility" },
      { key: "preferredProvince", label: "Preferred province/territory" },
      { key: "pnpTargetProvince", label: "PNP target province/territory" },
      { key: "deadlineTrigger", label: "Main deadline trigger" },
      { key: "deadlineDate", label: "Deadline date" },
      { key: "studyPermitHasLOA", label: "Study permit: LOA available" },
      { key: "workPermitHasJobOffer", label: "Work permit: Job offer available" },
      { key: "sponsorshipRelation", label: "Sponsorship relationship" },
      { key: "openToPNP", label: "Open to PNP if strongest option" },
    ],
  },
  {
    id: "status",
    title: "Status",
    editStep: 3,
    fields: [
      { key: "currentStatus", label: "Current status" },
      { key: "statusExpiryDate", label: "Status expiry date" },
      { key: "hasAppliedToExtendStatus", label: "Applied to extend status" },
      { key: "refusalHistory", label: "Refusal history" },
      { key: "mostRecentRefusalType", label: "Most recent refusal type" },
      { key: "priorCanadaApplicationType", label: "Prior Canada application type" },
      { key: "currentlyWorkingInCanada", label: "Currently working in Canada" },
      { key: "currentJobProvinceTerritory", label: "Current job province/territory" },
      { key: "sameEmployerForPermanentOffer", label: "Same employer for permanent offer" },
      { key: "countryOfResidence", label: "Country of residence" },
      { key: "nationality", label: "Nationality" },
      { key: "priorApplications", label: "Prior applications" },
    ],
  },
  {
    id: "work",
    title: "Work",
    editStep: 4,
    fields: [
      { key: "currentJobTitle", label: "Current/most recent job title" },
      { key: "countryOfWork", label: "Country of work" },
      { key: "totalExperience", label: "Total skilled work experience" },
      { key: "industryCategory", label: "Industry category" },
      { key: "mostRecentJobStart", label: "Most recent job start" },
      { key: "mostRecentJobEnd", label: "Most recent job end" },
      { key: "hoursPerWeekRange", label: "Hours per week range" },
      { key: "paidWorkStatus", label: "Paid work status" },
      { key: "employmentType", label: "Employment type" },
      { key: "canObtainEmployerLetter", label: "Can obtain employer letter" },
      { key: "employerLetterChallenge", label: "Employer letter challenge" },
      { key: "hasOverlappingPeriods", label: "Has overlapping periods" },
      { key: "employmentGaps", label: "Employment gaps in last 10 years" },
      { key: "hasCanadianJobOffer", label: "Has Canadian job offer" },
      { key: "jobOfferProvinceTerritory", label: "Job offer province/territory" },
      { key: "jobOfferTitle", label: "Job offer title" },
      { key: "jobOfferEmployerName", label: "Job offer employer name" },
      { key: "jobOfferCity", label: "Job offer city" },
      { key: "jobOfferFullTime", label: "Job offer full-time" },
      { key: "jobOfferPermanent", label: "Job offer permanent" },
      { key: "jobOfferCompensation", label: "Job offer compensation" },
      { key: "jobOfferCompensationType", label: "Job offer compensation type" },
      { key: "jobOfferTenure", label: "Employer tenure" },
      { key: "employerWillSupportPNP", label: "Employer supports PNP" },
      { key: "jobOfferNonSeasonal", label: "Job offer non-seasonal" },
      { key: "jobOfferSupportType", label: "Job offer support type" },
      { key: "occupationCategory", label: "Occupation category" },
      { key: "occupationCategoryOtherRole", label: "Occupation category (other)" },
      { key: "jobDuties", label: "Main job duties" },
      { key: "foreignSkilledYears", label: "Skilled work outside Canada" },
      { key: "has12MonthsCanadaSkilled", label: "Completed 12 months skilled work in Canada" },
      { key: "workRoles", label: "Detailed work roles" },
    ],
  },
  {
    id: "education",
    title: "Education",
    editStep: 5,
    fields: [
      { key: "educationLevel", label: "Highest education level" },
      { key: "fieldOfStudy", label: "Field of study" },
      { key: "educationCountry", label: "Education country" },
      { key: "graduationYear", label: "Graduation year" },
      { key: "ecaStatus", label: "ECA completed" },
      { key: "canadaEducationStatus", label: "Education completed in Canada" },
      { key: "educationCompletedInCanada", label: "Any education completed in Canada" },
      { key: "canadianEducationProvinceTerritory", label: "Canadian education province/territory" },
      { key: "canadianEducationPublicInstitution", label: "Canadian education at public institution" },
      { key: "programLength", label: "Program length" },
      { key: "hasMultipleCredentials", label: "More than one completed credential" },
      { key: "ecaValid", label: "ECA still valid" },
      { key: "educationCredentials", label: "Detailed education credentials" },
    ],
  },
  {
    id: "language",
    title: "Language",
    editStep: 6,
    fields: [
      { key: "languageTestStatus", label: "Valid language test status" },
      { key: "languageTestPlannedDate", label: "Planned test date" },
      { key: "secondOfficialLanguageIntent", label: "Second official language test intent" },
      { key: "languageTests", label: "Detailed language tests" },
    ],
  },
  {
    id: "family",
    title: "Family",
    editStep: 7,
    fields: [
      { key: "maritalStatus", label: "Marital status" },
      { key: "dependents", label: "Number of dependents" },
      { key: "spouseAccompanying", label: "Spouse/partner included in application" },
      { key: "spouseLocation", label: "Spouse/partner location" },
      { key: "closeRelativeInCanada", label: "Close relative in Canada" },
      { key: "hasCloseRelativeInCanada", label: "Has close relative in Canada" },
      { key: "relativeProvinceTerritory", label: "Relative province/territory" },
      { key: "closeRelativeRelationship", label: "Close relative relationship" },
      { key: "hasDependentsUnder18", label: "Dependents under 18" },
      { key: "hasDependents18Plus", label: "Dependents 18+" },
      { key: "sponsorshipTarget", label: "Sponsorship target" },
      { key: "sponsorStatus", label: "Sponsor status" },
      { key: "spouseLanguageTestType", label: "Spouse language test type" },
      { key: "spouseLanguageTestStream", label: "Spouse language test stream" },
      { key: "fundsFamilySize", label: "Proof-of-funds family size" },
      { key: "settlementFundsCad", label: "Settlement funds (CAD)" },
    ],
  },
  {
    id: "flags",
    title: "Flags",
    editStep: 8,
    fields: [
      { key: "priorRefusals", label: "Prior refusals" },
      { key: "criminalCharges", label: "Criminal charges/convictions" },
      { key: "medicalIssues", label: "Medical admissibility issues" },
      { key: "misrepresentation", label: "Misrepresentation concerns" },
      { key: "statusExpiringSoon", label: "Status expiring within 3 months" },
      { key: "overstayHistory", label: "Overstay/out-of-status history" },
      { key: "removalOrDeportationHistory", label: "Refused entry/removed/deported history" },
      { key: "hasActiveApplication", label: "Active application in process" },
      { key: "multipleCountries", label: "Lived in multiple countries in last 10 years" },
      { key: "nonTraditionalEmployment", label: "Non-traditional/informal employment" },
      { key: "missingDocuments", label: "Missing documents difficulty" },
      { key: "employerLetterUnwilling", label: "Employer unwilling to provide reference letter" },
      { key: "workedWithoutAuthorizationInCanada", label: "Worked in Canada without authorization" },
      { key: "refusedProvincialNomination", label: "Refused provincial nomination" },
      { key: "isSkilledTrade", label: "Occupation in skilled trade" },
    ],
  },
]

const enumLabels: Record<string, string> = {
  yes: "Yes",
  no: "No",
  unsure: "Not sure",
  "not-sure": "Not sure",
  na: "Not applicable",
  "inside-canada": "Inside Canada",
  "outside-canada": "Outside Canada",
  "yes-anywhere": "Yes, anywhere in Canada",
  "prefer-specific": "Prefer specific provinces",
  "only-specific": "Only specific provinces",
  "status-expiring": "My status is expiring soon",
  "job-offer-start": "I have a job offer start date",
  "school-intake": "I have a school intake deadline",
  "family-situation": "Family situation",
  "no-hard-deadline": "No hard deadline",
  "less-than-3": "Less than 3 months",
  "3-to-6": "3 to 6 months",
  "6-to-12": "6 to 12 months",
  flexible: "Flexible",
  pr: "Permanent residence",
  "study-permit": "Study permit",
  "work-permit": "Work permit",
  valid: "Yes",
  not_valid: "No",
  not_sure: "Not sure",
  sponsorship: "Family sponsorship",
  citizen: "Citizen",
  visitor: "Visitor",
  student: "Student",
  worker: "Worker",
  "another-country": "Another country",
  both: "Both Canada and another country",
  "not-scheduled": "Not scheduled",
  booked: "Booked",
  "english-only": "English only",
  "french-only": "French only",
  "both-languages": "Both English and French",
  completed: "Completed",
  "not-taken": "Not taken",
  "ielts-general-training": "IELTS (General Training)",
  "celpip-general": "CELPIP (General)",
  "tef-canada": "TEF Canada",
  "tcf-canada": "TCF Canada",
  "clb-4-6": "CLB 4–6 (approx.)",
  "clb-7": "CLB 7",
  "clb-8": "CLB 8",
  "clb-9-plus": "CLB 9+",
  none: "None",
  "less-than-1-year": "Less than 1 year",
  "1-year": "1 year",
  "2-years": "2 years",
  "2-plus-years": "2+ years",
  "3-plus-years": "3+ years",
  "high-school": "High school diploma",
  "one-year-diploma": "One-year diploma or certificate",
  "two-year-diploma": "Two-year diploma",
  bachelor: "Bachelor's degree",
  bachelors: "Bachelor's degree",
  "two-or-more-degrees": "Two or more degrees",
  masters: "Master's degree",
  phd: "Doctoral degree (PhD)",
  "within-1-month": "Within 1 month",
  "1-3-months": "1–3 months",
  "3-plus-months": "3+ months",
  "yes-accompanying": "Yes (accompanying)",
  "no-non-accompanying": "No (non-accompanying)",
  single: "Single",
  married: "Married",
  "common-law": "Common-law",
  separated: "Separated",
  divorced: "Divorced",
  widowed: "Widowed",
  "in-canada": "In Canada",
  "spouse-partner": "Spouse/partner",
  "parent-grandparent": "Parent/grandparent",
  "other-close-relative": "Other close relative",
  "work-permit-open": "Work permit - open",
  "work-permit-employer-specific": "Work permit - employer-specific",
  "visitor-record": "Visitor record",
  "lmia-exempt": "LMIA-exempt",
  lmia: "LMIA",
  unknown: "Unknown",
  "17-or-less": "17 or younger",
  "18-24": "18–24",
  "25-29": "25–29",
  "30-34": "30–34",
  "35-39": "35–39",
  "40-44": "40–44",
  "45+": "45 or older",
  "0-1": "0 to 1 year",
  "1-3": "1 to 3 years",
  "3-5": "3 to 5 years",
  "5+": "5+ years",
  hourly: "Hourly",
  annual: "Annual",
  "lt-6-months": "Less than 6 months",
  "6-12-months": "6-12 months",
  "1-2-years": "1-2 years",
  "business-management": "Business / Management",
  "it-software-data": "IT / Software / Data",
  healthcare: "Healthcare",
  trades: "Trades",
  "hospitality-tourism": "Hospitality / Tourism",
  "sales-marketing": "Sales / Marketing",
  "it-computer-science": "IT / Computer Science",
  health: "Health",
  "arts-social-sciences": "Arts / Social Sciences",
}

function formatMonthYear(value: string): string {
  const date = new Date(`${value}-01T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatFullDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function deriveAgeFromDateOfBirth(dateOfBirth: string): number | null {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`)
  if (Number.isNaN(birthDate.getTime())) return null

  const now = new Date()
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const birthMonth = birthDate.getUTCMonth()
  const currentDay = now.getUTCDate()
  const birthDay = birthDate.getUTCDate()

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age -= 1
  }

  if (age < 0) return null
  return age
}

function humanizeToken(value: string): string {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "number") return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return "None"
    if (typeof value[0] === "object") return `${value.length} item(s)`
    return value.join(", ")
  }
  if (typeof value !== "string") return String(value)

  if (/^\d{4}-\d{2}$/.test(value)) return formatMonthYear(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatFullDate(value)

  if (enumLabels[value]) return enumLabels[value]
  return humanizeToken(value)
}
