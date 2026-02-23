# IMM 5669 Post-Generation Next Steps — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After IMM 5669 PDF generation, show a structured confirmation with Download + Next Steps actions, and guide PNP applicants through upload instructions on a dedicated page.

**Architecture:** Add completion state to the existing review component, a new Next.js page route for upload guidance, localStorage status tracking, and updated checklist logic. All client-side, no backend changes.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Shadcn/ui components, localStorage

---

### Task 1: Add status persistence functions to storage

**Files:**
- Modify: `lib/imm5669/storage.ts:1-105`

**Step 1: Add the STATUS_KEY constant**

After line 6 (`const PATHWAY_KEY = "unify-selected-pathway"`), add:

```typescript
const STATUS_KEY = "unify-imm5669-status"
```

**Step 2: Add status CRUD functions**

Append after the `loadSelectedPathway` function (after line 104), before the file ends:

```typescript
// ── Document status ──

export function saveImm5669Status(status: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STATUS_KEY, status)
}

export function loadImm5669Status(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STATUS_KEY)
}

export function clearImm5669Status(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STATUS_KEY)
}
```

**Step 3: Update `clearImm5669Draft` to also clear status**

In the existing `clearImm5669Draft` function (lines 63-67), add `localStorage.removeItem(STATUS_KEY)` so clearing the draft also clears the generated status:

```typescript
export function clearImm5669Draft(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_KEY)
  localStorage.removeItem(SECTION_KEY)
  localStorage.removeItem(STATUS_KEY)
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors related to storage.ts

**Step 5: Commit**

```bash
git add lib/imm5669/storage.ts
git commit -m "feat: add IMM 5669 document status persistence in localStorage"
```

---

### Task 2: Add completion state to section-review.tsx

**Files:**
- Modify: `components/documents/imm5669/section-review.tsx:1-298`

**Step 1: Add imports and state**

Add `useRouter` import at line 2:
```typescript
import { useRouter } from "next/navigation"
```

Add `ArrowRight` to the lucide-react import on line 10:
```typescript
import { Download, Pencil, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react"
```

Add `saveImm5669Status` import after line 12:
```typescript
import { saveImm5669Status } from "@/lib/imm5669/storage"
```

**Step 2: Add state variables and router**

Inside the `SectionReview` component, after line 22 (`const [isGenerating, setIsGenerating] = useState(false)`), add:

```typescript
const [pdfGenerated, setPdfGenerated] = useState(false)
const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
const [pdfFilename, setPdfFilename] = useState("")
const router = useRouter()
```

**Step 3: Modify handleGenerate to store blob URL and set completion state**

Replace the current `handleGenerate` function (lines 45-80) with:

```typescript
async function handleGenerate() {
  if (!isValid) return
  setIsGenerating(true)
  setError(null)

  try {
    const res = await fetch("/api/documents/imm5669/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataWithDate),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Server error (${res.status})`)
    }

    const blob = await res.blob()
    const lastName = data.familyName || "Applicant"
    const date = new Date().toISOString().slice(0, 10)
    const filename = `IMM5669_Filled_${lastName}_${date}.pdf`

    const url = URL.createObjectURL(blob)
    setPdfBlobUrl(url)
    setPdfFilename(filename)

    // Trigger initial download
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Persist status and show completion state
    saveImm5669Status("generated")
    setPdfGenerated(true)
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to generate PDF")
  } finally {
    setIsGenerating(false)
  }
}

function handleRedownload() {
  if (!pdfBlobUrl) return
  const a = document.createElement("a")
  a.href = pdfBlobUrl
  a.download = pdfFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
```

Note: We intentionally do NOT revoke the blob URL after first download, so re-download works. The URL is cleaned up when the component unmounts or the page navigates away.

**Step 4: Replace the bottom section (Generate button + disclaimer) with conditional rendering**

Replace lines 194-224 (from the `{error && (` block through the closing `</p>` disclaimer) with:

```tsx
{error && (
  <Alert variant="destructive">
    <AlertTriangle className="size-4" />
    <AlertDescription className="text-xs">{error}</AlertDescription>
  </Alert>
)}

{pdfGenerated ? (
  <Card className="border-tier-clean/30 bg-tier-clean/5">
    <CardContent className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="size-5 text-tier-clean shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Your IMM 5669 has been generated successfully
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            The PDF has been downloaded to your device. You can download it again or view next steps for uploading.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleRedownload}
        >
          <Download className="size-4" />
          Download PDF
        </Button>
        <Button
          className="gap-2"
          onClick={() => router.push("/documents/imm5669/next-steps")}
        >
          View Next Steps
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
) : (
  <Button
    size="lg"
    className="w-full gap-2"
    disabled={!isValid || isGenerating}
    onClick={handleGenerate}
  >
    {isGenerating ? (
      <>
        <Loader2 className="size-4 animate-spin" />
        Generating PDF...
      </>
    ) : (
      <>
        <Download className="size-4" />
        Generate PDF
      </>
    )}
  </Button>
)}

<p className="type-caption text-center text-muted-foreground">
  The generated PDF is for your records only. You may still need to sign it
  where indicated before submitting. This tool is informational — not legal advice.
</p>
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add components/documents/imm5669/section-review.tsx
git commit -m "feat: add completion state with Download + View Next Steps after PDF generation"
```

---

### Task 3: Create the next-steps guidance page

**Files:**
- Create: `app/documents/imm5669/next-steps/page.tsx`

**Step 1: Create the route directory and page**

```bash
mkdir -p app/documents/imm5669/next-steps
```

**Step 2: Write the page component**

Create `app/documents/imm5669/next-steps/page.tsx`:

```tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Upload,
  Clock,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react"

const IRCC_ACCOUNT_URL =
  "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html"

export default function Imm5669NextStepsPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => router.push("/documents/imm5669")}
        className="mb-4 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to IMM 5669
      </Button>

      <div className="mb-8">
        <h1 className="font-heading text-foreground">
          What to Do After IMM 5669
        </h1>
        <p className="mt-2 type-body text-muted-foreground">
          Your IMM 5669 (Schedule A) has been generated. Here is what to do next
          as a Provincial Nominee Program (PNP) applicant applying for permanent
          residence.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Where to Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Where to Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              IMM 5669 is uploaded through your IRCC online account — either the
              PR Portal or your GCKey account, depending on how you are applying.
            </p>
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Submitting a complete PR application after nomination:
                </span>{" "}
                IMM 5669 is included as part of the required forms you upload
                during the online permanent residence application process.
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Responding to a document request from IRCC:
                </span>{" "}
                Upload IMM 5669 in the &ldquo;Additional Documents&rdquo;
                section of your IRCC online account under the specific request
                slot.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* When to Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                When to Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs text-muted-foreground leading-relaxed">
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  Full PR application:
                </span>{" "}
                Upload immediately as part of your application package.
              </li>
              <li className="list-disc">
                <span className="font-medium text-foreground">
                  IRCC document request:
                </span>{" "}
                Upload before the deadline stated in the request. Check your IRCC
                account for the exact date.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Before You Upload */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="size-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold">
                Before You Upload
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            <ul className="flex flex-col gap-2 pl-4">
              <li className="list-disc">
                Confirm there are no time gaps in your personal history — every
                month should be accounted for.
              </li>
              <li className="list-disc">
                Ensure all sections of the form are complete and accurate.
              </li>
              <li className="list-disc">
                Verify signatures where required (the declaration section may
                need to be signed after printing).
              </li>
              <li className="list-disc">
                Confirm the correct applicant type is selected (Principal
                Applicant vs. Spouse/Dependent).
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="gap-2" asChild>
          <a href={IRCC_ACCOUNT_URL} target="_blank" rel="noopener noreferrer">
            Go to IRCC Account
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/next-steps")}
        >
          Back to Dashboard
        </Button>
      </div>

      <p className="type-caption mt-8 text-center text-muted-foreground">
        This is informational guidance, not legal advice. For case-specific
        guidance, consult a licensed immigration professional.
      </p>
    </div>
  )
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds, new route `/documents/imm5669/next-steps` is generated

**Step 4: Commit**

```bash
git add app/documents/imm5669/next-steps/page.tsx
git commit -m "feat: add PNP next-steps guidance page for IMM 5669"
```

---

### Task 4: Update checklist status logic on the dashboard

**Files:**
- Modify: `app/next-steps/page.tsx:1-91`

**Step 1: Add the `loadImm5669Status` import**

Update line 9 to add the new import:

```typescript
import { loadSelectedPathway, hasImm5669Draft, loadImm5669Status, type SelectedPathway } from "@/lib/imm5669/storage"
```

**Step 2: Update the checklist item status logic**

Replace lines 46-57 (the `hasDraft` const and `items` array) with:

```typescript
const hasDraft = hasImm5669Draft()
const docStatus = loadImm5669Status()

function getImm5669Status(): "not-started" | "in-progress" | "completed" {
  if (docStatus === "generated") return "completed"
  if (hasDraft) return "in-progress"
  return "not-started"
}

const items: ChecklistItem[] = [
  {
    id: "imm5669",
    title: "Complete IMM 5669 (Schedule A — Background/Declaration)",
    description:
      "Fill out the official background and declaration form required for your application. " +
      "We will guide you through each section and generate a filled PDF for download.",
    href: "/documents/imm5669",
    status: getImm5669Status(),
  },
]
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add app/next-steps/page.tsx
git commit -m "feat: update checklist to show completed status when IMM 5669 PDF is generated"
```

---

### Task 5: Manual smoke test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test the full flow**

1. Navigate to `/documents/imm5669` and complete all sections
2. On the Review & Generate screen, click "Generate PDF"
3. Verify: PDF downloads AND the button area transforms into a completion card with "Download PDF" (outline) and "View Next Steps" (primary) buttons
4. Click "Download PDF" — verify the same PDF downloads again
5. Click "View Next Steps" — verify navigation to `/documents/imm5669/next-steps`
6. On the next-steps page, verify:
   - Three cards render (Where to Upload, When to Upload, Before You Upload)
   - "Go to IRCC Account" button opens IRCC login page in a new tab
   - "Back to Dashboard" navigates to `/next-steps`
   - Disclaimer text is present
   - Back arrow navigates to `/documents/imm5669`
7. Navigate to `/next-steps` — verify the IMM 5669 checklist item shows "Completed" badge (green)

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found in smoke testing"
```
