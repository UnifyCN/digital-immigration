# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
npm start        # Run production build
```

No test suite is configured.

## Architecture

This is a **Next.js (App Router) immigration assessment wizard** that guides Canadian immigration applicants through a 7-step questionnaire and generates personalized pathway recommendations — entirely client-side, no external API calls.

### Data Flow

```
/ (landing) → /assessment (7-step wizard) → /results (computed recommendations)
```

1. **Form state**: React Hook Form manages the entire `AssessmentData` object across 7 steps
2. **Persistence**: Each step transition auto-saves to localStorage (`clarity-assessment-draft`)
3. **Validation**: Zod schemas (one per step) run on blur (`mode: "onTouched"`); conditional logic lives in `superRefine()`
4. **Computation**: On final submit, `computeResults()` in `lib/scoring.ts` produces tier classification, pathway cards, risk flags, and next actions — no server round-trip

### Key Files

| File | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces (`AssessmentData`, `AssessmentResults`, etc.) |
| `lib/schemas.ts` | Zod schemas for all 7 steps + conditional validation via `superRefine()` |
| `lib/scoring.ts` | Scoring engine: `computeTier()`, `getPathways()`, risk flag detection |
| `lib/storage.ts` | localStorage CRUD + legacy data migration (normalizes old field values) |
| `lib/review-answers.ts` | Formats raw form data for the review-your-answers display |
| `app/assessment/page.tsx` | Wizard orchestration: step routing, form provider, back/next nav |
| `app/results/page.tsx` | Reads computed results and renders all result components |

### Component Structure

- `components/assessment/` — One component per wizard step (step-goal-timeline, step-current-status, step-work-history, step-education, step-language-crs, step-family, step-red-flags) + `wizard-stepper.tsx`
- `components/results/` — tier-classification, pathway-cards, risk-flags-panel, next-actions, review-answers
- `components/ui/` — Shadcn/ui primitives (60+ components, do not edit directly)

### Conventions

- **UI**: Shadcn/ui built on Radix UI primitives + Tailwind CSS v4. Add new UI components with `npx shadcn@latest add <component>`.
- **Styling**: CSS variables for theming in `styles/brand-tokens.css`; dark mode via `dark` Tailwind variant
- **Validation**: All form field options are string literal union types defined in `lib/types.ts`. Adding a new option requires updating the type, the Zod schema, the scoring logic, and `review-answers.ts`.
- **Storage**: `lib/storage.ts` handles browser-only checks (`typeof window`). The migration function there normalizes legacy field values — add new migrations there if field option values change.
- **Scoring**: Tier classification (1=Clean, 2=Moderate, 3=Complex) drives which pathways and risk flags are shown. Changes to assessment questions require corresponding updates to `lib/scoring.ts`.
- **`next.config.mjs`**: TypeScript build errors are suppressed (`ignoreBuildErrors: true`) — rely on the editor/`tsc` for type checking during development.
