# Digital Immigration Agent 

A **Next.js (App Router)** web app that helps Canadian immigration applicants understand their situation: complete a short assessment, get personalized pathway recommendations, risk flags, and next steps. Optional flows include filling **Schedule A (IMM 5669)** with prefill from your assessment and generating a PDF.

**Disclaimer:** This tool is for informational use only. It does not provide legal advice or guarantee eligibility. For official requirements, always refer to [IRCC](https://www.canada.ca/en/immigration-refugees-citizenship.html).

---

## Features

- **7-step assessment wizard** — Goal/timeline, current status, work history, education, language/CRS, family, and red-flag questions. All client-side with draft saved to `localStorage`.
- **Results dashboard** — Tier classification (Clean / Moderate / Complex), recommended pathways, risk flags, and prioritized next actions.
- **Pathway detail pages** — Deeper breakdown per pathway (e.g. PNP, Express Entry–related streams).
- **Next-steps checklist** — After choosing a pathway, a checklist guides you through tasks (e.g. language test, documents).
- **Schedule A (IMM 5669)** — Multi-section form that prefills from your assessment. Draft is stored in `localStorage`; you can generate a filled PDF via the API.
- **Optional AI support** — Results page can offer an AI chat (OpenRouter) for questions about your situation; requires env configuration.

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4**, **Shadcn/ui** (Radix UI)
- **React Hook Form** + **Zod** for forms and validation
- **pdf-lib** for IMM 5669 PDF generation

---

## Getting started

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

### Install and run

```bash
git clone https://github.com/UnifyCN/digital-immigration.git
cd digital-immigration
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other commands

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Dev server (localhost:3000)|
| `npm run build`| Production build           |
| `npm run lint` | ESLint                     |
| `npm start`    | Run production build       |

---

## Environment variables (optional)

Create `.env.local` in the project root if you use optional features:

| Variable              | Required | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `OPENROUTER_API_KEY`  | No       | Enables AI support chat on the results page      |
| `OPENROUTER_MODEL`    | No       | Model for AI chat (default: `openai/gpt-4o-mini`)|

IMM 5669 PDF generation and the assessment flow work without any env vars.

---

## Project structure (high level)

```
app/
  page.tsx                 # Landing
  assessment/page.tsx      # 7-step wizard
  assessment/results/      # Legacy results entry
  results/page.tsx         # Main results (tier, pathways, risks, next actions)
  results/.../pathways/[slug]  # Pathway detail
  next-steps/page.tsx      # Post-pathway checklist
  documents/imm5669/       # IMM 5669 form UI
  api/
    documents/imm5669/generate/  # POST: fill IMM 5669 PDF
    ai/results-chat/              # POST: optional AI chat

lib/
  types.ts, schemas.ts     # Assessment types and Zod schemas
  scoring.ts               # Tier, pathways, risk flags
  storage.ts               # Assessment localStorage + migrations
  next-steps.ts            # Next-step recommendations
  review-answers.ts        # Format answers for review UI
  imm5669/                 # IMM 5669 types, schemas, storage, prefill, PDF mapping

components/
  assessment/              # One component per wizard step + stepper
  results/                 # Tier, pathway cards, risk flags, next actions, review
  next-steps/              # Checklist
  documents/imm5669/       # Form sections and stepper
  pathways/                # Pathway detail view
  ui/                      # Shadcn primitives
```

See **CLAUDE.md** in the repo for detailed architecture, key files, and conventions (e.g. adding new assessment options, storage migrations, scoring).

---

## Data flow (assessment → results)

1. **Landing** (`/`) — Start assessment or resume draft; optional “auto-fill demo.”
2. **Assessment** (`/assessment`) — React Hook Form holds full `AssessmentData`; each step transition saves to `localStorage` (`clarity-assessment-draft`). Zod validates on blur; conditional logic in `superRefine()`.
3. **Submit** — `computeResults()` in `lib/scoring.ts` runs in the browser: tier, pathways, risk flags, next actions. No server call.
4. **Results** (`/results`) — Renders tier, pathway cards, risk panel, next actions, review-your-answers. Optional AI chat if configured.
5. **Pathway choice** → **Next steps** (`/next-steps`) — Checklist; can lead to **IMM 5669** (`/documents/imm5669`) and PDF generation.

---

## License

Private. All rights reserved (or add your license).
