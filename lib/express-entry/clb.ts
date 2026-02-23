import { addYears, isAfter } from "date-fns"
import type { AssessmentData, LanguageTestEntry } from "../types.ts"
import { LANGUAGE_VALIDITY_YEARS } from "./rules.ts"
import type { ClbByAbility, ClbResult } from "./types.ts"

function toNumber(value: string): number | null {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseDate(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function clbFromIeltsListening(score: number): number {
  if (score >= 8.5) return 10
  if (score >= 8.0) return 9
  if (score >= 7.5) return 8
  if (score >= 6.0) return 7
  if (score >= 5.5) return 6
  if (score >= 5.0) return 5
  if (score >= 4.5) return 4
  return 0
}

function clbFromIeltsReading(score: number): number {
  if (score >= 8.0) return 10
  if (score >= 7.0) return 9
  if (score >= 6.5) return 8
  if (score >= 6.0) return 7
  if (score >= 5.0) return 6
  if (score >= 4.0) return 5
  if (score >= 3.5) return 4
  return 0
}

function clbFromIeltsWritingOrSpeaking(score: number): number {
  if (score >= 7.5) return 10
  if (score >= 7.0) return 9
  if (score >= 6.5) return 8
  if (score >= 6.0) return 7
  if (score >= 5.5) return 6
  if (score >= 5.0) return 5
  if (score >= 4.0) return 4
  return 0
}

function clbFromCelpip(score: number): number {
  if (score >= 10) return 10
  if (score >= 9) return 9
  if (score >= 8) return 8
  if (score >= 7) return 7
  if (score >= 6) return 6
  if (score >= 5) return 5
  if (score >= 4) return 4
  return 0
}

function clbFromPteCore(score: number): number {
  if (score >= 89) return 10
  if (score >= 84) return 9
  if (score >= 76) return 8
  if (score >= 69) return 7
  if (score >= 60) return 6
  if (score >= 51) return 5
  if (score >= 42) return 4
  return 0
}

function clbFromTefListening(score: number): number {
  if (score >= 316) return 10
  if (score >= 298) return 9
  if (score >= 280) return 8
  if (score >= 249) return 7
  if (score >= 217) return 6
  if (score >= 181) return 5
  if (score >= 145) return 4
  return 0
}

function clbFromTefReading(score: number): number {
  if (score >= 263) return 10
  if (score >= 248) return 9
  if (score >= 233) return 8
  if (score >= 207) return 7
  if (score >= 181) return 6
  if (score >= 151) return 5
  if (score >= 121) return 4
  return 0
}

function clbFromTefWritingOrSpeaking(score: number): number {
  if (score >= 393) return 10
  if (score >= 371) return 9
  if (score >= 349) return 8
  if (score >= 310) return 7
  if (score >= 271) return 6
  if (score >= 226) return 5
  if (score >= 181) return 4
  return 0
}

function clbFromTcfListening(score: number): number {
  if (score >= 549) return 10
  if (score >= 523) return 9
  if (score >= 503) return 8
  if (score >= 458) return 7
  if (score >= 398) return 6
  if (score >= 369) return 5
  if (score >= 331) return 4
  return 0
}

function clbFromTcfReading(score: number): number {
  if (score >= 549) return 10
  if (score >= 524) return 9
  if (score >= 499) return 8
  if (score >= 453) return 7
  if (score >= 406) return 6
  if (score >= 375) return 5
  if (score >= 342) return 4
  return 0
}

function clbFromTcfWritingOrSpeaking(score: number): number {
  if (score >= 16) return 10
  if (score >= 14) return 9
  if (score >= 12) return 8
  if (score >= 10) return 7
  if (score >= 7) return 6
  if (score >= 6) return 5
  if (score >= 4) return 4
  return 0
}

function hasRequiredStream(testType: string, stream: string): boolean {
  if (testType === "ielts-general-training") return stream === "general"
  return stream !== "academic"
}

export function deriveClbFromScores(
  testType: LanguageTestEntry["testType"],
  scores: LanguageTestEntry["scores"],
): ClbByAbility {
  const listening = toNumber(scores.listening)
  const reading = toNumber(scores.reading)
  const writing = toNumber(scores.writing)
  const speaking = toNumber(scores.speaking)

  if (listening === null || reading === null || writing === null || speaking === null) {
    return { listening: null, reading: null, writing: null, speaking: null }
  }

  switch (testType) {
    case "ielts-general-training":
      return {
        listening: clbFromIeltsListening(listening),
        reading: clbFromIeltsReading(reading),
        writing: clbFromIeltsWritingOrSpeaking(writing),
        speaking: clbFromIeltsWritingOrSpeaking(speaking),
      }
    case "celpip-general":
      return {
        listening: clbFromCelpip(listening),
        reading: clbFromCelpip(reading),
        writing: clbFromCelpip(writing),
        speaking: clbFromCelpip(speaking),
      }
    case "pte-core":
      return {
        listening: clbFromPteCore(listening),
        reading: clbFromPteCore(reading),
        writing: clbFromPteCore(writing),
        speaking: clbFromPteCore(speaking),
      }
    case "tef-canada":
      return {
        listening: clbFromTefListening(listening),
        reading: clbFromTefReading(reading),
        writing: clbFromTefWritingOrSpeaking(writing),
        speaking: clbFromTefWritingOrSpeaking(speaking),
      }
    case "tcf-canada":
      return {
        listening: clbFromTcfListening(listening),
        reading: clbFromTcfReading(reading),
        writing: clbFromTcfWritingOrSpeaking(writing),
        speaking: clbFromTcfWritingOrSpeaking(speaking),
      }
    default:
      return { listening: null, reading: null, writing: null, speaking: null }
  }
}

export function getPrimaryLanguageTest(profile: AssessmentData): LanguageTestEntry | null {
  if (profile.languageTests?.length) {
    return profile.languageTests.find((test) => test.isPrimary) ?? profile.languageTests[0]
  }

  if (profile.languageTestStatus !== "valid") {
    return null
  }

  return {
    id: "legacy-primary",
    isPrimary: true,
    testType: profile.englishTestType || "",
    stream: profile.englishTestType ? "general" : "",
    testDate: "",
    registrationNumber: "",
    scores: {
      listening: profile.languageScores.listening,
      reading: profile.languageScores.reading,
      writing: profile.languageScores.writing,
      speaking: profile.languageScores.speaking,
    },
  }
}

export function derivePrimaryClb(profile: AssessmentData, asOfDate: Date): ClbResult {
  const primary = getPrimaryLanguageTest(profile)
  if (!primary || !primary.testType) {
    return {
      clb: { listening: null, reading: null, writing: null, speaking: null },
      isValid: false,
      validityReason: "Primary language test details are missing.",
    }
  }

  if (!primary.testDate) {
    return {
      clb: deriveClbFromScores(primary.testType, primary.scores),
      isValid: false,
      validityReason: "Primary language test date is missing.",
    }
  }

  if (!hasRequiredStream(primary.testType, primary.stream)) {
    return {
      clb: deriveClbFromScores(primary.testType, primary.scores),
      isValid: false,
      validityReason: "Language test stream is not eligible for Express Entry scoring.",
    }
  }

  const testDate = parseDate(primary.testDate)
  if (!testDate) {
    return {
      clb: deriveClbFromScores(primary.testType, primary.scores),
      isValid: false,
      validityReason: "Primary language test date is invalid.",
    }
  }

  const expiresOn = addYears(testDate, LANGUAGE_VALIDITY_YEARS)
  if (!isAfter(expiresOn, asOfDate)) {
    return {
      clb: deriveClbFromScores(primary.testType, primary.scores),
      isValid: false,
      validityReason: "Primary language test has expired.",
    }
  }

  const clb = deriveClbFromScores(primary.testType, primary.scores)
  const missingScore = Object.values(clb).some((value) => value === null)
  if (missingScore) {
    return {
      clb,
      isValid: false,
      validityReason: "Primary language scores are incomplete.",
    }
  }

  return { clb, isValid: true }
}
