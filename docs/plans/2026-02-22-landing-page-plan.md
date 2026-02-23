# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Revamp `app/page.tsx` into a 5-section TurboTax-style landing page with hero, trust bar, how-it-works, price comparison slider, and final CTA.

**Architecture:** Replace the current single-section hero with 5 vertically-stacked full-width sections. Extract the price comparison slider into its own component. Keep all existing functionality (draft detection, demo button, reset) but relocate them to less prominent positions.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4, Shadcn/ui Button, lucide-react icons. No new dependencies.

---

### Task 1: Scaffold the new section structure

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Step 1: Replace `app/page.tsx` with the new 5-section scaffold**

Rewrite `app/page.tsx` with the full landing page. Keep the `"use client"` directive, all existing imports, and all existing state/effect logic (draft detection, demo autofill, reset). Remove the rotating message animation system entirely — it's being replaced by a static headline.

The new layout structure:

```tsx
return (
  <>
    {/* Section 1: Hero */}
    <section className="...">...</section>

    {/* Section 2: Trust Bar */}
    <section className="...">...</section>

    {/* Section 3: How It Works */}
    <section className="...">...</section>

    {/* Section 4: Price Comparison */}
    <section className="...">...</section>

    {/* Section 5: Final CTA */}
    <section className="...">...</section>
  </>
)
```

Remove these from the current page:
- `rotatingMessages` array and all rotation state (`currentIndex`, `isVisible`, `isPaused`, `prefersReducedMotion`, `longestMessage`, `safeIndex`, `activeMessage`, word-splitting logic)
- All rotation effects (the two `useEffect`s for motion preference and interval)
- Decorative gradient blobs (the two `pointer-events-none` divs)
- The `onMouseEnter`/`onMouseLeave`/`onFocusCapture`/`onBlurCapture` handlers

Keep these:
- `draftExists` state + `useEffect` for `hasDraft()`
- `handleReset()` function
- `handleAutoFill()` function
- All imports from `@/lib/storage`

**Step 2: Run `npm run build` to verify no build errors**

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: scaffold 5-section landing page layout"
```

---

### Task 2: Build Section 1 — Hero

**Files:**
- Modify: `app/page.tsx`

**Step 1: Implement the hero section**

```tsx
{/* Section 1: Hero */}
<section className="flex min-h-[85vh] flex-col items-center justify-center px-6 py-24 text-center">
  <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
    {/* Pill badge */}
    <span className="rounded-full border border-border bg-card px-5 py-1.5 text-sm font-medium tracking-wide text-muted-foreground">
      ClearPath Immigration
    </span>

    {/* Headline */}
    <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.1] tracking-tight text-foreground">
      Your immigration plan, done right.
    </h1>

    {/* Subtext */}
    <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
      Get a personalized Canadian immigration roadmap based on official IRCC criteria. Private. No payment required.
    </p>

    {/* Primary CTA */}
    <Button
      asChild
      size="lg"
      className="mt-2 h-14 rounded-full bg-[#D8492C] px-10 text-lg font-semibold text-white shadow-md hover:bg-[#C63F25]"
    >
      <Link href="/assessment">
        Get My Free Plan
        <ArrowRight className="ml-2 size-5" />
      </Link>
    </Button>

    {/* Supporting text */}
    <p className="text-sm text-muted-foreground">Takes 5–8 minutes</p>

    {/* Secondary actions: demo + resume (less prominent) */}
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="ghost" size="sm" onClick={handleAutoFill} className="gap-1.5 text-xs text-muted-foreground">
        <Zap className="size-3" />
        Try demo
      </Button>
      {draftExists && (
        <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
          <Link href="/assessment">Resume draft</Link>
        </Button>
      )}
      {draftExists && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs text-muted-foreground">
          <RotateCcw className="size-3" />
          Reset
        </Button>
      )}
    </div>
  </div>
</section>
```

**Step 2: Run `npm run dev`, check hero renders correctly at localhost:3000**

Expected: Clean centered hero, large headline, red CTA button, no decorative blobs.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add hero section with clean TurboTax-style layout"
```

---

### Task 3: Build Section 2 — Trust Bar

**Files:**
- Modify: `app/page.tsx`

**Step 1: Add trust bar icons to imports**

Add `Shield`, `Lock`, `CheckCircle` to the lucide-react import line.

**Step 2: Implement the trust bar section**

```tsx
{/* Section 2: Trust Bar */}
<section className="border-y border-border/50 bg-muted/30 px-6 py-10">
  <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
    {[
      { icon: Shield, text: "Based on official IRCC criteria" },
      { icon: Lock, text: "Private & secure. No data shared." },
      { icon: CheckCircle, text: "Free assessment. No commitment." },
    ].map(({ icon: Icon, text }) => (
      <div key={text} className="flex items-center justify-center gap-3 text-center sm:text-left">
        <Icon className="size-5 shrink-0 text-[#D8492C]" />
        <span className="text-sm font-medium text-foreground/80">{text}</span>
      </div>
    ))}
  </div>
</section>
```

**Step 3: Verify in browser — should show a light gray band with 3 icon+text pairs**

**Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add trust bar section with IRCC, privacy, and free signals"
```

---

### Task 4: Build Section 3 — How It Works

**Files:**
- Modify: `app/page.tsx`

**Step 1: Implement the how-it-works section**

```tsx
{/* Section 3: How It Works */}
<section className="px-6 py-20">
  <div className="mx-auto max-w-4xl">
    <h2 className="mb-12 text-center font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
      How it works
    </h2>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {[
        { step: 1, title: "Answer questions", desc: "Tell us about your background, goals, and timeline." },
        { step: 2, title: "Get your plan", desc: "Receive a personalized pathway assessment in minutes." },
        { step: 3, title: "Take action", desc: "Know exactly what to do next — with confidence." },
      ].map(({ step, title, desc }) => (
        <div key={step} className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#D8492C] text-sm font-bold text-white">
            {step}
          </span>
          <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Step 2: Verify in browser — 3 cards in a row on desktop, stacked on mobile**

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add how-it-works section with 3-step cards"
```

---

### Task 5: Build Section 4 — Price Comparison Slider

**Files:**
- Create: `components/landing/price-comparison-slider.tsx`
- Modify: `app/page.tsx` (import and use the component)

This is the most complex section. The slider is a before/after reveal: a container with two overlapping sides. A draggable vertical divider controls how much of each side is visible via `clip-path` or `overflow` + absolute positioning.

**Step 1: Create the PriceComparisonSlider component**

Create `components/landing/price-comparison-slider.tsx`:

```tsx
"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { GripVertical } from "lucide-react"

const services = [
  { name: "Personalized Assessment", ours: "Free", theirs: "$200–$500" },
  { name: "Pathway Recommendations", ours: "Free", theirs: "$500–$1,500" },
  { name: "Document Checklist", ours: "Free", theirs: "$300–$800" },
  { name: "CRS Score Analysis", ours: "Free", theirs: "$150–$400" },
]

const totals = { ours: "$0", theirs: "$1,150–$3,200" }

export function PriceComparisonSlider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50) // percentage from left
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = Math.max(10, Math.min(90, (x / rect.width) * 100))
    setPosition(pct)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }, [isDragging, updatePosition])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Table row component for consistency
  const Row = ({ name, price, isTotal }: { name: string; price: string; isTotal?: boolean }) => (
    <div className={`flex items-center justify-between px-6 py-4 ${isTotal ? "border-t-2 border-current/10 font-bold" : "border-b border-current/5"}`}>
      <span className={isTotal ? "text-base" : "text-sm"}>{name}</span>
      <span className={isTotal ? "text-xl" : "text-base font-semibold"}>{price}</span>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-3xl cursor-col-resize select-none overflow-hidden rounded-2xl border border-border shadow-lg"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Left side: ClearPath (our prices) */}
      <div
        className="absolute inset-0 z-10 overflow-hidden bg-white"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold text-emerald-700">ClearPath Immigration</h3>
          <p className="text-xs text-emerald-600/70">What you pay with us</p>
        </div>
        {services.map((s) => (
          <Row key={s.name} name={s.name} price={s.ours} />
        ))}
        <div className="text-emerald-700">
          <Row name="Total" price={totals.ours} isTotal />
        </div>
      </div>

      {/* Right side: Consultant (their prices) */}
      <div className="bg-stone-50">
        <div className="px-6 py-5">
          <h3 className="text-lg font-bold text-stone-700">Typical Consultant</h3>
          <p className="text-xs text-stone-500">What most people pay</p>
        </div>
        {services.map((s) => (
          <Row key={s.name} name={s.name} price={s.theirs} />
        ))}
        <div className="text-stone-700">
          <Row name="Total" price={totals.theirs} isTotal />
        </div>
      </div>

      {/* Divider handle */}
      <div
        className="absolute top-0 z-20 flex h-full -translate-x-1/2 cursor-col-resize items-center"
        style={{ left: `${position}%` }}
        onPointerDown={handlePointerDown}
      >
        <div className="h-full w-0.5 bg-[#D8492C]" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D8492C] bg-white p-2 shadow-md">
          <GripVertical className="size-5 text-[#D8492C]" />
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Add the section wrapper in `app/page.tsx`**

Import `PriceComparisonSlider` and add between how-it-works and final CTA:

```tsx
import { PriceComparisonSlider } from "@/components/landing/price-comparison-slider"

{/* Section 4: Price Comparison */}
<section className="bg-muted/20 px-6 py-20">
  <div className="mx-auto max-w-4xl">
    <h2 className="mb-3 text-center font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
      See what you save
    </h2>
    <p className="mb-12 text-center text-muted-foreground">
      Drag to compare our assessment vs. a typical immigration consultant.
    </p>
    <PriceComparisonSlider />
  </div>
</section>
```

**Step 3: Verify in browser — slider should render with draggable divider, left/right panels**

Test: drag the handle left and right. Both mouse and touch should work (using pointer events).

**Step 4: Commit**

```bash
git add components/landing/price-comparison-slider.tsx app/page.tsx
git commit -m "feat: add price comparison slider with drag-to-reveal"
```

---

### Task 6: Build Section 5 — Final CTA

**Files:**
- Modify: `app/page.tsx`

**Step 1: Implement the final CTA section**

```tsx
{/* Section 5: Final CTA */}
<section className="px-6 py-24 text-center">
  <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
    <h2 className="font-heading text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-tight text-foreground">
      Ready to start your immigration journey?
    </h2>
    <p className="text-muted-foreground">
      Join thousands of applicants who planned with confidence.
    </p>
    <Button
      asChild
      size="lg"
      className="mt-2 h-14 rounded-full bg-[#D8492C] px-10 text-lg font-semibold text-white shadow-md hover:bg-[#C63F25]"
    >
      <Link href="/assessment">
        Get My Free Plan
        <ArrowRight className="ml-2 size-5" />
      </Link>
    </Button>
    <p className="text-sm text-muted-foreground">No account required. Results in minutes.</p>
  </div>
</section>
```

**Step 2: Verify full page flow in browser — all 5 sections render correctly**

Scroll through: Hero → Trust → How It Works → Pricing → CTA. Check mobile responsiveness.

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add final CTA section to complete landing page"
```

---

### Task 7: Polish and verify

**Files:**
- Modify: `app/page.tsx` (minor tweaks if needed)
- Modify: `components/landing/price-comparison-slider.tsx` (minor tweaks if needed)

**Step 1: Run `npm run build`**

Expected: Build succeeds with no errors.

**Step 2: Run `npm run lint`**

Expected: No lint errors.

**Step 3: Visual check — verify all sections on desktop and mobile widths**

Check:
- Hero: centered, generous whitespace, no blobs
- Trust bar: 3 badges in a row on desktop, stacked on mobile
- How it works: 3 cards side-by-side on desktop, stacked on mobile
- Price slider: draggable, both sides visible, touch-friendly
- Final CTA: clean, centered
- All text is readable, buttons are clickable, no overflow issues

**Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "polish: landing page visual refinements"
```
