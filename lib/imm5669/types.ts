export type ApplicantType = "principal" | "spouse-dependent"

export interface ParentDetails {
  familyName: string
  givenNames: string
  dateOfBirth: string
  townCityOfBirth: string
  countryOfBirth: string
  dateOfDeath: string
}

export interface BackgroundQuestions {
  a: "yes" | "no" | ""
  b: "yes" | "no" | ""
  c: "yes" | "no" | ""
  d: "yes" | "no" | ""
  e: "yes" | "no" | ""
  f: "yes" | "no" | ""
  g: "yes" | "no" | ""
  h: "yes" | "no" | ""
  i: "yes" | "no" | ""
  j: "yes" | "no" | ""
  k: "yes" | "no" | ""
}

export const BACKGROUND_QUESTION_LABELS: Record<keyof BackgroundQuestions, string> = {
  a: "Been convicted of a crime or offence in Canada for which a pardon has not been granted?",
  b: "Been convicted of, or currently charged with, on trial for, or party to a crime or offence, or subject of any criminal proceedings in any other country?",
  c: "Made previous claims for refugee protection in Canada, at a Canadian visa office abroad, in any other country, or with the UNHCR?",
  d: "Been refused refugee status, an immigrant or permanent resident visa, or visitor or temporary resident visa, to Canada or any other country?",
  e: "Been refused admission to, or ordered to leave, Canada or any other country?",
  f: "Been involved in an act of genocide, a war crime, or in the commission of a crime against humanity?",
  g: "Used, planned, or advocated the use of armed struggle or violence to reach political, religious, or social objectives?",
  h: "Been associated with a group that used, uses, advocated, or advocates the use of armed struggle or violence to reach political, religious, or social objectives?",
  i: "Been a member of an organization that is or was engaged in an activity that is part of a pattern of criminal activity?",
  j: "Been detained, incarcerated, or put in jail?",
  k: "Had any serious disease or physical or mental disorder?",
}

export interface EducationYears {
  elementary: string
  secondary: string
  university: string
  tradeSchool: string
}

export interface EducationRow {
  from: string
  to: string
  institutionName: string
  cityAndCountry: string
  certificateType: string
  fieldOfStudy: string
}

export interface PersonalHistoryRow {
  from: string
  to: string
  activity: string
  cityAndCountry: string
  statusInCountry: string
  companyOrEmployer: string
}

export interface MembershipRow {
  from: string
  to: string
  organizationName: string
  organizationType: string
  activitiesOrPositions: string
  cityAndCountry: string
}

export interface GovernmentPositionRow {
  from: string
  to: string
  countryAndJurisdiction: string
  departmentBranch: string
  activitiesOrPositions: string
}

export interface MilitaryServiceRow {
  country: string
  from: string
  to: string
  branchAndUnit: string
  ranks: string
  combatDetails: string
  reasonForEnd: string
}

export interface AddressRow {
  from: string
  to: string
  streetAndNumber: string
  cityOrTown: string
  provinceStateDistrict: string
  postalCode: string
  country: string
}

export interface Imm5669Data {
  applicantType: ApplicantType | ""
  familyName: string
  givenNames: string
  nativeScriptName: string
  dateOfBirth: string

  father: ParentDetails
  mother: ParentDetails

  backgroundQuestions: BackgroundQuestions
  backgroundDetails: string

  educationYears: EducationYears
  educationHistory: EducationRow[]

  personalHistory: PersonalHistoryRow[]

  memberships: MembershipRow[]

  governmentPositions: GovernmentPositionRow[]

  militaryService: MilitaryServiceRow[]

  addresses: AddressRow[]

  declarationDate: string
}

export const EMPTY_PARENT: ParentDetails = {
  familyName: "",
  givenNames: "",
  dateOfBirth: "",
  townCityOfBirth: "",
  countryOfBirth: "",
  dateOfDeath: "",
}

export const EMPTY_BACKGROUND_QUESTIONS: BackgroundQuestions = {
  a: "", b: "", c: "", d: "", e: "",
  f: "", g: "", h: "", i: "", j: "", k: "",
}

export const EMPTY_EDUCATION_YEARS: EducationYears = {
  elementary: "",
  secondary: "",
  university: "",
  tradeSchool: "",
}

export const EMPTY_EDUCATION_ROW: EducationRow = {
  from: "", to: "", institutionName: "", cityAndCountry: "",
  certificateType: "", fieldOfStudy: "",
}

export const EMPTY_PERSONAL_HISTORY_ROW: PersonalHistoryRow = {
  from: "", to: "", activity: "", cityAndCountry: "",
  statusInCountry: "", companyOrEmployer: "",
}

export const EMPTY_MEMBERSHIP_ROW: MembershipRow = {
  from: "", to: "", organizationName: "", organizationType: "",
  activitiesOrPositions: "", cityAndCountry: "",
}

export const EMPTY_GOVERNMENT_POSITION_ROW: GovernmentPositionRow = {
  from: "", to: "", countryAndJurisdiction: "",
  departmentBranch: "", activitiesOrPositions: "",
}

export const EMPTY_MILITARY_ROW: MilitaryServiceRow = {
  country: "", from: "", to: "", branchAndUnit: "",
  ranks: "", combatDetails: "", reasonForEnd: "",
}

export const EMPTY_ADDRESS_ROW: AddressRow = {
  from: "", to: "", streetAndNumber: "", cityOrTown: "",
  provinceStateDistrict: "", postalCode: "", country: "",
}

export const DEFAULT_IMM5669: Imm5669Data = {
  applicantType: "",
  familyName: "",
  givenNames: "",
  nativeScriptName: "",
  dateOfBirth: "",
  father: { ...EMPTY_PARENT },
  mother: { ...EMPTY_PARENT },
  backgroundQuestions: { ...EMPTY_BACKGROUND_QUESTIONS },
  backgroundDetails: "",
  educationYears: { ...EMPTY_EDUCATION_YEARS },
  educationHistory: [{ ...EMPTY_EDUCATION_ROW }],
  personalHistory: [{ ...EMPTY_PERSONAL_HISTORY_ROW }],
  memberships: [],
  governmentPositions: [],
  militaryService: [],
  addresses: [{ ...EMPTY_ADDRESS_ROW }],
  declarationDate: "",
}

export const IMM5669_SECTION_TITLES = [
  "Applicant Information",
  "Parent Details",
  "Background Questions",
  "Education",
  "Personal History",
  "Memberships & Government",
  "Military Service & Addresses",
  "Review & Generate",
] as const

export const IMM5669_TOTAL_SECTIONS = IMM5669_SECTION_TITLES.length
