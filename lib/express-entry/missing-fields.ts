import type { MissingFieldRef } from "./types"

const MISSING_FIELD_MAP: Record<string, Omit<MissingFieldRef, "key">> = {
  "language.primary.type": { label: "Primary language test type", step: 6, href: "/assessment?step=6" },
  "language.primary.date": { label: "Primary language test date", step: 6, href: "/assessment?step=6" },
  "language.primary.stream": { label: "Primary language test stream", step: 6, href: "/assessment?step=6" },
  "language.primary.scores": { label: "Primary language test scores", step: 6, href: "/assessment?step=6" },
  "education.credentials": { label: "Education credential details", step: 5, href: "/assessment?step=5" },
  "education.eca.issueDate": { label: "ECA issue date", step: 5, href: "/assessment?step=5" },
  "education.eca.equivalency": { label: "ECA equivalency result", step: 5, href: "/assessment?step=5" },
  "work.roles": { label: "Detailed work role history", step: 4, href: "/assessment?step=4" },
  "work.roles.noc": { label: "NOC 2021 code for work roles", step: 4, href: "/assessment?step=4" },
  "work.roles.teer": { label: "TEER level for work roles", step: 4, href: "/assessment?step=4" },
  "work.roles.dates": { label: "Exact work role dates", step: 4, href: "/assessment?step=4" },
  "work.roles.hours": { label: "Work role hours per week", step: 4, href: "/assessment?step=4" },
  "work.roles.authorization": { label: "Canadian work authorization details", step: 4, href: "/assessment?step=4" },
  "spouse.language": { label: "Spouse language test details", step: 7, href: "/assessment?step=7" },
  "spouse.education": { label: "Spouse education details", step: 7, href: "/assessment?step=7" },
  "funds.familySize": { label: "Proof-of-funds family size", step: 7, href: "/assessment?step=7" },
  "funds.available": { label: "Available settlement funds", step: 7, href: "/assessment?step=7" },
  "fst.offerOrCert": { label: "FST job offer or trade certificate", step: 4, href: "/assessment?step=4" },
  "jobOffer.validity": { label: "Job offer validity details", step: 4, href: "/assessment?step=4" },
}

export function toMissingFieldRef(key: string): MissingFieldRef {
  const mapped = MISSING_FIELD_MAP[key]
  if (!mapped) {
    return {
      key,
      label: key,
      step: 1,
      href: "/assessment?step=1",
    }
  }
  return { key, ...mapped }
}

export function uniqueMissingFields(keys: string[]): MissingFieldRef[] {
  const unique = Array.from(new Set(keys.filter(Boolean)))
  return unique.map(toMissingFieldRef)
}
