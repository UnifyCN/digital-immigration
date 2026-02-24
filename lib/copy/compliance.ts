export const DISCLAIMER_SHORT = "Informational guidance based on your inputs. Not legal advice."

export const LABELS = {
  matchLevel: {
    strong: "Strong match (based on inputs)",
    possible: "Possible match (needs confirmation)",
    weak: "Weak match (exploratory)",
  },
  baseline: {
    pass: { icon: "✅", text: "Baseline met" },
    unclear: { icon: "⚠️", text: "Baseline unclear" },
    fail: { icon: "❌", text: "Baseline limited" },
  },
  fit: {
    high: "High",
    medium: "Medium",
    low: "Low",
  },
  confidence: {
    high: "High",
    medium: "Medium",
    low: "Low",
  },
} as const

export const SECTION_TITLES = {
  recommended: "Recommended BC pathways to explore",
  explore: "BC pathways you can still explore (low fit so far)",
  why: "Why this appears relevant",
  blockers: "Currently limiting factors",
  missing: "Quick questions to refine",
} as const
