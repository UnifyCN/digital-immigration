import type { CandidateProfile, FollowUpQuestionSpec } from "./types.ts"

const APPROVED_LANGUAGE_TEST_OPTIONS = [
  { value: "ielts-general-training", label: "IELTS General" },
  { value: "celpip-general", label: "CELPIP General" },
  { value: "tef-canada", label: "TEF Canada" },
  { value: "tcf-canada", label: "TCF Canada" },
  { value: "pte-core", label: "PTE Core" },
]

function roleFromField(field: string): string | null {
  const match = field.match(/^work\.roles\.([^\.]+)\./)
  return match ? match[1] : null
}

function addQuestion(collection: FollowUpQuestionSpec[], next: FollowUpQuestionSpec) {
  if (collection.some((item) => item.id === next.id)) return
  collection.push(next)
}

function roleLabel(profile: CandidateProfile, roleId: string): string {
  const role = profile.workRoles.find((item) => item.id === roleId)
  if (!role) return "this job"
  return role.title?.trim() || role.employerName?.trim() || "this job"
}

export function buildFollowUpQuestions(missingFields: string[], profile: CandidateProfile): FollowUpQuestionSpec[] {
  const questions: FollowUpQuestionSpec[] = []

  for (const field of missingFields) {
    if (field === "shared.intentOutsideQuebec") {
      addQuestion(questions, {
        id: "shared.intentOutsideQuebec",
        program: "shared",
        fieldKey: field,
        prompt: "Do you intend to live outside Quebec when applying under Express Entry?",
        controlType: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure yet" },
        ],
      })
      continue
    }

    if (field === "language.primary.testType") {
      addQuestion(questions, {
        id: "language.primary.testType",
        program: "shared",
        fieldKey: field,
        prompt: "Which approved language test did you take?",
        controlType: "select",
        required: true,
        options: APPROVED_LANGUAGE_TEST_OPTIONS,
      })
      continue
    }

    if (field === "language.primary.testDate") {
      addQuestion(questions, {
        id: "language.primary.testDate",
        program: "shared",
        fieldKey: field,
        prompt: "What is the test date?",
        controlType: "date",
        required: true,
      })
      continue
    }

    if (field === "language.primary.stream") {
      addQuestion(questions, {
        id: "language.primary.stream",
        program: "shared",
        fieldKey: field,
        prompt: "Which stream is this result from?",
        controlType: "radio",
        required: true,
        options: [
          { value: "general", label: "General" },
          { value: "n/a", label: "N/A" },
        ],
      })
      continue
    }

    if (field === "language.primary.scores") {
      addQuestion(questions, {
        id: "language.primary.scores",
        program: "shared",
        fieldKey: field,
        prompt: "Enter Listening, Reading, Writing, and Speaking scores.",
        controlType: "text",
        required: true,
      })
      continue
    }

    if (field === "auth.currentlyAuthorizedToWorkInCanada") {
      addQuestion(questions, {
        id: field,
        program: "shared",
        fieldKey: field,
        prompt: "Are you currently legally authorized to work in Canada?",
        controlType: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
      })
      continue
    }

    if (field === "fsw.primaryOccupationRoleId") {
      addQuestion(questions, {
        id: field,
        program: "FSW",
        fieldKey: field,
        prompt: "Which job are you using as your primary occupation for FSW?",
        controlType: "select",
        required: true,
        options: profile.workRoles.map((role) => ({
          value: role.id,
          label: `${role.title || "Role"} (${role.nocCode || "NOC missing"})`,
        })),
      })
      continue
    }

    if (field === "funds.familySize") {
      addQuestion(questions, {
        id: field,
        program: "shared",
        fieldKey: field,
        prompt: "How many people are in your family size for settlement funds?",
        controlType: "number",
        required: true,
      })
      continue
    }

    if (field === "funds.available") {
      addQuestion(questions, {
        id: field,
        program: "shared",
        fieldKey: field,
        prompt: "How much settlement funds do you currently have available (CAD)?",
        controlType: "number",
        required: true,
      })
      continue
    }

    if (field === "jobOffer.validity") {
      addQuestion(questions, {
        id: field,
        program: "FSW",
        fieldKey: field,
        prompt: "Do you have a valid qualifying job offer for Express Entry purposes?",
        controlType: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
      })
      continue
    }

    if (field === "fst.offer.path") {
      addQuestion(questions, {
        id: field,
        program: "FST",
        fieldKey: field,
        prompt: "Do you have a Canadian certificate of qualification or a valid 1-year full-time job offer in your trade?",
        controlType: "radio",
        required: true,
        options: [
          { value: "certificate", label: "Certificate of qualification" },
          { value: "job-offer", label: "Valid job offer" },
          { value: "neither", label: "Neither" },
        ],
      })
      continue
    }

    if (field.startsWith("fst.offer.employer")) {
      addQuestion(questions, {
        id: field,
        program: "FST",
        fieldKey: field,
        prompt: "Add FST trade offer details (up to two employers): paid, continuous, full-time (30+ hrs/week), and at least 1 year.",
        controlType: "text",
        required: true,
      })
      continue
    }

    const roleId = roleFromField(field)
    if (!roleId) continue

    const roleName = roleLabel(profile, roleId)

    const roleQuestionConfig: Array<{ suffix: string; prompt: string; controlType: FollowUpQuestionSpec["controlType"]; options?: FollowUpQuestionSpec["options"]; helpText?: string; program: FollowUpQuestionSpec["program"] }> = [
      {
        suffix: "nocCode",
        prompt: `Select the NOC 2021 code for ${roleName}.`,
        controlType: "text",
        program: "shared",
      },
      {
        suffix: "nocDutiesMatchConfirmed",
        prompt: `Confirm your duties for ${roleName} match the NOC lead statement and most main duties.`,
        controlType: "checkbox",
        program: "shared",
      },
      {
        suffix: "startDate",
        prompt: `Enter the exact start date for ${roleName}.`,
        controlType: "date",
        program: "shared",
      },
      {
        suffix: "endDate",
        prompt: `Enter the exact end date for ${roleName}, or mark it as present.`,
        controlType: "date",
        program: "shared",
      },
      {
        suffix: "hoursPerWeek",
        prompt: `Enter average hours per week for ${roleName}.`,
        controlType: "number",
        program: "shared",
      },
      {
        suffix: "paid",
        prompt: `Was ${roleName} paid work?`,
        controlType: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
        program: "shared",
      },
      {
        suffix: "employmentType",
        prompt: `What was the employment type for ${roleName}?`,
        controlType: "select",
        options: [
          { value: "employee", label: "Employee" },
          { value: "self-employed", label: "Self-employed" },
          { value: "contractor", label: "Contractor" },
        ],
        program: "shared",
      },
      {
        suffix: "wasAuthorizedInCanada",
        prompt: "Were you authorized to work for the entire period of this Canadian job?",
        controlType: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
        program: "CEC",
      },
      {
        suffix: "wasFullTimeStudent",
        prompt: `Were you a full-time student during any part of ${roleName}?`,
        controlType: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
        program: "shared",
      },
      {
        suffix: "physicallyInCanada",
        prompt: `If remote, were you physically in Canada while working ${roleName}?`,
        controlType: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
        program: "CEC",
      },
      {
        suffix: "qualifiedToPracticeInCountry",
        prompt: `Were you qualified to practice this trade where you gained ${roleName} experience?`,
        controlType: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not-sure", label: "Not sure" },
        ],
        program: "FST",
      },
    ]

    for (const config of roleQuestionConfig) {
      if (!field.endsWith(`.${config.suffix}`)) continue
      addQuestion(questions, {
        id: `role.${roleId}.${config.suffix}`,
        program: config.program,
        fieldKey: field,
        roleId,
        prompt: config.prompt,
        controlType: config.controlType,
        required: true,
        options: config.options,
        helpText: config.helpText,
      })
    }
  }

  return questions
}
