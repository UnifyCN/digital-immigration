import type { CombinedPNPSignals } from "../../pathways/pnpProvinceScope.ts"

export type RefinementAnswerType = "single_select" | "text" | "number"

export type RefinementQuestion = {
  id: string
  title: string
  helperText?: string
  answerType: RefinementAnswerType
  options?: Array<{ value: string; label: string }>
  shouldAsk: (ctx: { signals: CombinedPNPSignals & Record<string, unknown> }) => boolean
  signalKeys: string[]
}

function isUnknown(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "not_sure" ||
    value === "not-sure" ||
    value === "unsure" ||
    value === "unknown"
  )
}

function hasJobOffer(signals: CombinedPNPSignals & Record<string, unknown>): boolean {
  return signals.hasJobOfferRefined === "yes" || signals.hasJobOffer === "yes"
}

function hasCanadianEducation(signals: CombinedPNPSignals & Record<string, unknown>): boolean {
  return signals.anyEducationInCanada === "yes" || signals.educationInCanada === "yes"
}

export const BC_REFINEMENT_QUESTION_BANK: RefinementQuestion[] = [
  {
    id: "teer_or_noc",
    title: "Do you know your job’s NOC code or TEER level?",
    helperText:
      "If you don’t know your NOC code, select the TEER level that best matches your role.",
    answerType: "single_select",
    options: [
      { value: "teer_0", label: "TEER 0" },
      { value: "teer_1", label: "TEER 1" },
      { value: "teer_2", label: "TEER 2" },
      { value: "teer_3", label: "TEER 3" },
      { value: "teer_4", label: "TEER 4" },
      { value: "teer_5", label: "TEER 5" },
      { value: "not_sure", label: "Not sure" },
    ],
    shouldAsk: ({ signals }) => {
      const teerKnown = !isUnknown(signals.teer) || !isUnknown(signals.teerSkillBand)
      const nocKnown = !isUnknown(signals.nocCode) || !isUnknown(signals.provinceFinder?.nocCode)
      return !teerKnown && !nocKnown
    },
    signalKeys: ["teer", "nocCode"],
  },
  {
    id: "job_full_time",
    title: "Is your job offer full-time (30+ hours/week)?",
    answerType: "single_select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
    shouldAsk: ({ signals }) => hasJobOffer(signals) && isUnknown(signals.jobOfferFullTime) && isUnknown(signals.jobFullTime),
    signalKeys: ["jobFullTime"],
  },
  {
    id: "job_permanent",
    title: "Is your job offer permanent/ongoing (no end date)?",
    answerType: "single_select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
    shouldAsk: ({ signals }) => hasJobOffer(signals) && isUnknown(signals.jobOfferPermanent) && isUnknown(signals.jobPermanent),
    signalKeys: ["jobPermanent"],
  },
  {
    id: "institution_type",
    title: "Was your institution public or private?",
    answerType: "single_select",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "not_sure", label: "Not sure" },
    ],
    shouldAsk: ({ signals }) =>
      hasCanadianEducation(signals) &&
      (isUnknown(signals.institutionType) || signals.institutionType === "unsure"),
    signalKeys: ["institutionType"],
  },
  {
    id: "language_test_status",
    title: "What’s your language test status?",
    helperText: "This helps confirm readiness for some pathways.",
    answerType: "single_select",
    options: [
      { value: "valid", label: "I have a valid test result" },
      { value: "booked", label: "I have a test booked" },
      { value: "not_ready", label: "Not yet" },
    ],
    shouldAsk: ({ signals }) => isUnknown(signals.languageReady) && isUnknown(signals.languageTestStatus),
    signalKeys: ["languageTestStatus"],
  },
  {
    id: "job_offer_exists",
    title: "Do you currently have a job offer from a BC employer?",
    answerType: "single_select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
    shouldAsk: ({ signals }) => isUnknown(signals.hasJobOfferRefined) && isUnknown(signals.hasJobOffer),
    signalKeys: ["hasJobOffer"],
  },
  {
    id: "job_province",
    title: "Which province is your job located in?",
    answerType: "single_select",
    options: [
      { value: "BC", label: "British Columbia" },
      { value: "other_not_sure", label: "Other / Not sure" },
    ],
    shouldAsk: ({ signals }) => hasJobOffer(signals) && isUnknown(signals.jobProvinceCode),
    signalKeys: ["jobProvinceCode", "jobProvinceLabel"],
  },
]
