# IMM 5669 Post-Generation Next Steps — Design

**Date:** 2026-02-22
**Status:** Approved

## Problem

After generating the IMM 5669 PDF, users have no guidance on what to do next. The PDF simply downloads and the user is left on the review screen with no clear call to action.

## Solution

### 1. Review Screen Completion State (`section-review.tsx`)

After successful PDF generation, transition the bottom section from "Generate PDF" to a confirmation card:

- Success alert: "Your IMM 5669 has been generated successfully"
- Two buttons:
  - **"Download PDF"** (outline) — re-triggers download from stored blob URL
  - **"View Next Steps"** (primary) — navigates to `/documents/imm5669/next-steps`
- Existing review cards and declaration date remain visible above

State: Add `pdfGenerated` boolean + `pdfBlobUrl` string to store the generated PDF blob URL for re-download.

### 2. New Route: `/documents/imm5669/next-steps/page.tsx`

Matches Unify design system (`mx-auto max-w-2xl px-4 py-8`, `font-heading`, soft cards).

**Header:** "What to Do After IMM 5669" + back button to `/documents/imm5669`

**Three card sections:**

1. **Where to Upload** — IRCC online account / PR Portal. Two scenarios: (a) part of complete PR application package after nomination, (b) response to IRCC document request under "Additional Documents"

2. **When to Upload** — Full PR application: upload immediately. IRCC document request: before stated deadline.

3. **Before You Upload (Checklist)** — No time gaps, all sections complete, signatures verified, correct applicant type.

**Footer:**
- "Go to IRCC Account" (primary, opens new tab) → `https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html`
- "Back to Dashboard" (outline) → `/next-steps`
- Disclaimer: "This is informational guidance, not legal advice."

### 3. Storage (`lib/imm5669/storage.ts`)

New localStorage key: `unify-imm5669-status`

```typescript
saveImm5669Status(status: "generated"): void
loadImm5669Status(): string | null
clearImm5669Status(): void  // called with clearImm5669Draft()
```

### 4. Checklist Update (`app/next-steps/page.tsx`)

Status logic: `loadImm5669Status() === "generated"` → completed, `hasImm5669Draft()` → in-progress, else → not-started.

## Files Changed

| File | Change |
|------|--------|
| `components/documents/imm5669/section-review.tsx` | Add completion state with Download + View Next Steps |
| `app/documents/imm5669/next-steps/page.tsx` | New route — PNP next-steps guidance page |
| `lib/imm5669/storage.ts` | Add status persistence functions |
| `app/next-steps/page.tsx` | Update checklist status logic |
