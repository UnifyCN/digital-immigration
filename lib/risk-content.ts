import type { RiskId } from "./types"

export interface RiskDetailContent {
  whatThisMeans: string
  whyItMatters: string[]
  whatToDoNext: { text: string }[]
  aiOpenerQuestion: string
}

const riskContentMap: Record<RiskId, RiskDetailContent> = {
  employment_gaps: {
    whatThisMeans:
      "Your employment history appears to have periods without documented work. Immigration officers review employment continuity closely, especially for economic immigration programs like Express Entry. Gaps do not automatically disqualify you, but unexplained gaps can raise questions about your application\u2019s credibility.",
    whyItMatters: [
      "Officers may request explanation letters for any period not accounted for",
      "Gaps longer than 6 months are more likely to trigger additional scrutiny",
      "Unexplained gaps can reduce your overall application credibility score",
      "Some Provincial Nominee Programs (PNPs) require continuous employment history",
    ],
    whatToDoNext: [
      { text: "List every gap period with start and end dates" },
      { text: "Draft a brief explanation letter for each gap (e.g., education, caregiving, health)" },
      { text: "Gather supporting documents for each gap period (transcripts, medical notes, etc.)" },
      { text: "If self-employed during gaps, collect invoices, contracts, or tax returns" },
    ],
    aiOpenerQuestion:
      "I have employment gaps in my work history. How should I explain these gaps in my immigration application, and what supporting documents would strengthen my case?",
  },

  language_test_missing: {
    whatThisMeans:
      "You have not yet completed an approved language test (IELTS, CELPIP, or TEF) or your test is still pending. Most Canadian immigration programs require valid language test results as a mandatory document. Without scores, your application cannot be submitted or accurately assessed for CRS points.",
    whyItMatters: [
      "Express Entry requires valid language test results before a profile can be submitted",
      "Language scores directly impact your CRS score \u2014 often by 100+ points",
      "Test results are valid for only 2 years from the test date",
      "Booking delays can push your application timeline by 1\u20133 months",
    ],
    whatToDoNext: [
      { text: "Book an approved language test (IELTS General, CELPIP, or TEF)" },
      { text: "Confirm your test date falls within the validity window for your application" },
      { text: "Practice with official sample tests to target CLB 7+ scores" },
      { text: "Consider both official languages if pursuing additional CRS points" },
    ],
    aiOpenerQuestion:
      "I don't have language test scores yet. Which test should I take, what CLB level do I need for my pathway, and how long does it take to get results?",
  },

  prior_refusal: {
    whatThisMeans:
      "You have indicated a prior application refusal from Canada or another country. A refusal does not permanently bar you from future applications, but it must be disclosed and properly addressed. Officers will review your refusal history and assess whether the grounds for refusal have been resolved.",
    whyItMatters: [
      "All prior refusals must be disclosed \u2014 failure to disclose is misrepresentation",
      "Officers will review your previous refusal reasons against your new application",
      "A refusal can affect the officer\u2019s assessment of your application credibility",
      "Some refusal grounds (e.g., misrepresentation) carry multi-year bans",
      "Professional guidance is strongly recommended for refusal recovery strategies",
    ],
    whatToDoNext: [
      { text: "Obtain your refusal letter and GCMS notes from the previous application" },
      { text: "Identify the specific grounds for refusal cited by the officer" },
      { text: "Address each refusal ground with new evidence or changed circumstances" },
      { text: "Consider consulting a licensed immigration consultant or lawyer" },
      { text: "Prepare a detailed cover letter explaining what has changed since the refusal" },
    ],
    aiOpenerQuestion:
      "I have a prior immigration refusal on my record. How does this affect my current application, and what steps should I take to address it?",
  },

  missing_documents: {
    whatThisMeans:
      "Based on your answers, there may be documents you cannot readily obtain or that are difficult to secure. Missing documents can delay processing or lead to an incomplete application being returned or refused. Identifying these gaps early gives you time to source alternatives.",
    whyItMatters: [
      "Incomplete applications may be returned without processing",
      "Some documents (police certificates, ECA) take weeks or months to obtain",
      "Officers may issue a procedural fairness letter for missing evidence",
      "Alternative documentation may be accepted if originals are unavailable",
    ],
    whatToDoNext: [
      { text: "Create a full document checklist for your target immigration program" },
      { text: "Identify which documents you already have and which are missing" },
      { text: "Request documents with long lead times immediately (police certificates, ECA, etc.)" },
      { text: "For unobtainable documents, prepare a statutory declaration explaining why" },
    ],
    aiOpenerQuestion:
      "I may have difficulty obtaining some required documents. What are the typical documents needed for my pathway, and what alternatives exist if I can\u2019t get the originals?",
  },

  status_expiring: {
    whatThisMeans:
      "Your current immigration status in Canada is expiring soon. If your status lapses before you apply for an extension or new status, you may fall out of status, which limits your options and can create complications for future applications. Maintaining valid status is critical while any application is in progress.",
    whyItMatters: [
      "Losing status means you cannot legally work or study in Canada",
      "Implied status only applies if you apply to extend BEFORE your current status expires",
      "Out-of-status periods must be disclosed in future applications",
      "Restoration of status is possible but adds cost, time, and uncertainty",
      "Some programs require valid status at the time of application",
    ],
    whatToDoNext: [
      { text: "Calculate the exact number of days remaining on your current status" },
      { text: "Apply for an extension or change of status BEFORE your current status expires" },
      { text: "If already expired, consult an immigration professional about restoration options" },
      { text: "Gather documents needed for your extension application immediately" },
      { text: "Consider whether bridging open work permit (BOWP) eligibility applies" },
    ],
    aiOpenerQuestion:
      "My immigration status is expiring soon. What are my options to maintain status, and what happens if it expires before I can apply?",
  },

  eca_incomplete: {
    whatThisMeans:
      "Your Education Credential Assessment (ECA) has not been completed or you are unsure of its status. An ECA is required for Express Entry programs to verify that your foreign education is equivalent to a Canadian credential. Without it, your education points cannot be counted toward your CRS score.",
    whyItMatters: [
      "Express Entry Federal Skilled Worker program requires a valid ECA",
      "ECA results can take 4\u20138 weeks (or longer) from designated organizations",
      "Education points can contribute significantly to your CRS score",
      "ECAs are valid for 5 years from the date of issuance",
    ],
    whatToDoNext: [
      { text: "Apply for an ECA from a designated organization (WES, IQAS, etc.)" },
      { text: "Send your transcripts and degree certificates to the assessing body" },
      { text: "Track your ECA application status regularly" },
      { text: "Plan your Express Entry profile submission around the ECA timeline" },
    ],
    aiOpenerQuestion:
      "I haven\u2019t completed my Education Credential Assessment (ECA). Which organization should I use, how long does it take, and is it required for my pathway?",
  },

  criminal_charges: {
    whatThisMeans:
      "You have indicated criminal charges or convictions. Criminal inadmissibility is one of the most serious grounds that can prevent entry to or status in Canada. The impact depends on the nature of the offence, its Canadian equivalent, and how much time has passed. Some offences may be overcome through rehabilitation or a record suspension.",
    whyItMatters: [
      "Criminal inadmissibility can result in application refusal or removal from Canada",
      "Even minor offences (e.g., DUI) can trigger inadmissibility under Canadian law",
      "The Canadian equivalent of the offence determines the admissibility impact",
      "Professional legal representation is strongly recommended for these cases",
      "Rehabilitation applications or Temporary Resident Permits may be available",
    ],
    whatToDoNext: [
      { text: "Obtain certified copies of all court records and dispositions" },
      { text: "Consult a licensed immigration lawyer about criminal inadmissibility" },
      { text: "Determine if you are eligible for deemed rehabilitation (10+ years since completion of sentence)" },
      { text: "If eligible, prepare a criminal rehabilitation application" },
      { text: "Obtain police clearance certificates from all countries of residence" },
    ],
    aiOpenerQuestion:
      "I have a criminal record. How does criminal inadmissibility work in Canada, and what options do I have to overcome it for my immigration application?",
  },

  medical_issues: {
    whatThisMeans:
      "You have indicated a medical condition that could affect your admissibility to Canada. Canada conducts medical examinations for most immigration applications. Certain conditions that pose a danger to public health or would cause excessive demand on Canadian health or social services can result in medical inadmissibility.",
    whyItMatters: [
      "A designated panel physician must conduct the immigration medical exam",
      "Conditions posing danger to public health (e.g., active TB) can cause inadmissibility",
      "The \u2018excessive demand\u2019 threshold is reviewed periodically by IRCC",
      "Some conditions are exempt from excessive demand assessment (e.g., for sponsored spouses)",
      "Medical results are valid for 12 months",
    ],
    whatToDoNext: [
      { text: "Review the medical inadmissibility criteria on the IRCC website" },
      { text: "Schedule an exam with an IRCC-designated panel physician" },
      { text: "Gather medical records and specialist reports for your condition" },
      { text: "Consult a licensed immigration lawyer about mitigation plans if needed" },
    ],
    aiOpenerQuestion:
      "I have a medical condition that might affect my immigration application. How does medical admissibility work, and what should I prepare for the medical exam?",
  },

  misrepresentation: {
    whatThisMeans:
      "A misrepresentation concern has been flagged. Misrepresentation under Canadian immigration law (IRPA s.40) is extremely serious. It includes providing false information, withholding material facts, or submitting fraudulent documents. A finding of misrepresentation results in a 5-year ban from most immigration applications and can void existing status.",
    whyItMatters: [
      "A misrepresentation finding results in a 5-year application ban",
      "It can void an existing permanent residence or citizenship if discovered later",
      "Even unintentional errors can be treated as misrepresentation if material",
      "IRCC must issue a procedural fairness letter before making a finding",
      "Legal representation is essential if misrepresentation is alleged",
    ],
    whatToDoNext: [
      { text: "Review all previous applications for any inaccuracies or omissions" },
      { text: "Consult a licensed immigration lawyer immediately" },
      { text: "If you received a procedural fairness letter, respond within the deadline with legal counsel" },
      { text: "Gather evidence to demonstrate the error was unintentional, if applicable" },
      { text: "Do not submit any new applications until you have received legal advice" },
    ],
    aiOpenerQuestion:
      "A misrepresentation concern has been flagged in my case. What exactly counts as misrepresentation, and what should I do next?",
  },

  multiple_countries: {
    whatThisMeans:
      "You have lived in multiple countries over the past 10 years. Most Canadian immigration programs require police clearance certificates from every country where you have lived for 6 months or more. This is a documentation requirement rather than a risk factor, but it can add significant time to your application preparation.",
    whyItMatters: [
      "Police certificates are required from each country where you lived 6+ months",
      "Processing times vary widely by country (from 1 week to 6+ months)",
      "Some countries require in-person applications or apostille authentication",
      "Certificates typically expire 6\u201312 months after issuance",
    ],
    whatToDoNext: [
      { text: "List every country where you lived for 6 months or more in the last 10 years" },
      { text: "Research the police certificate process for each country" },
      { text: "Request certificates from countries with the longest processing times first" },
      { text: "Check if any certificates require translation or authentication" },
    ],
    aiOpenerQuestion:
      "I\u2019ve lived in multiple countries. Which police certificates do I need, and how do I obtain them from each country?",
  },
}

const genericFallback: RiskDetailContent = {
  whatThisMeans:
    "This item has been flagged based on your assessment answers. While it may not be a barrier, it is worth reviewing to ensure your application is as strong as possible.",
  whyItMatters: [
    "Flagged items may require additional documentation or explanation",
    "Addressing concerns proactively strengthens your application",
    "An immigration professional can provide case-specific guidance",
  ],
  whatToDoNext: [
    { text: "Review the specific concern and gather relevant documentation" },
    { text: "Consider consulting a licensed immigration professional" },
    { text: "Address this item before submitting your application" },
  ],
  aiOpenerQuestion:
    "Can you help me understand this risk flag and what I should do about it?",
}

export function getRiskContent(id: string): RiskDetailContent {
  if (id in riskContentMap) return riskContentMap[id as RiskId]
  return genericFallback
}
