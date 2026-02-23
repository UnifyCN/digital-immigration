# Landing Page Redesign — ClearPath Immigration

**Date**: 2026-02-22
**Goal**: Revamp landing page to match TurboTax Canada's "clean + official + trusted" aesthetic.

## Design Direction

- **Vibe**: Government-adjacent professional — credible without being corporate or heavy
- **Palette**: Brand red `#D8492C` as single primary accent, neutral grays, white/cream backgrounds
- **Typography**: Anek Latin for headings, Funnel Sans for body (existing fonts)
- **Spacing**: Generous whitespace, soft borders, subtle shadows, consistent rounded corners (`rounded-xl`)
- **Pattern**: Confidence headline → trust signals → clarity → price comparison → CTA

## Sections

### 1. Hero (min-height ~80vh, centered)

- Pill badge: "ClearPath Immigration"
- Headline (large, Anek Latin): "Your immigration plan, done right."
- Subtext: "Get a personalized Canadian immigration roadmap based on official IRCC criteria. Private. No payment required."
- Primary CTA (brand red, rounded, arrow icon): "Get My Free Plan"
- Muted text: "Takes 5–8 minutes"
- No decorative blobs. Clean whitespace carries the section.

### 2. Trust Bar (light gray band, horizontal row of 3)

1. Shield icon — "Based on official IRCC criteria"
2. Lock icon — "Private & secure. No data shared."
3. CheckCircle icon — "Free assessment. No commitment."

Small icons in brand red, text in dark gray. Compact section.

### 3. How It Works (3 cards, horizontal row)

Heading: "How it works"

1. **Answer questions** — "Tell us about your background, goals, and timeline."
2. **Get your plan** — "Receive a personalized pathway assessment in minutes."
3. **Take action** — "Know exactly what to do next — with confidence."

White cards, soft border, subtle shadow, rounded-xl. Step numbers in red circles.

### 4. Price Comparison Slider (showpiece)

Heading: "See what you save"
Subtext: "Drag to compare our assessment vs. a typical immigration consultant."

Before/after drag slider applied to a pricing table:

**Left (ClearPath)** — white bg, green-tinted prices:
- Personalized Assessment — Free
- Pathway Recommendations — Free
- Document Checklist — Free
- CRS Score Analysis — Free
- **Total: $0**

**Right (Consultant)** — warmer/darker bg:
- Initial Consultation — $200–$500
- Pathway Assessment — $500–$1,500
- Document Review — $300–$800
- CRS Analysis — $150–$400
- **Total: $1,150–$3,200**

Draggable vertical divider with grip handle and left/right arrows.

### 5. Final CTA (centered, generous padding)

- Headline: "Ready to start your immigration journey?"
- Subtext: "Join thousands of applicants who planned with confidence."
- Primary CTA: "Get My Free Plan"
- Below: "No account required. Results in minutes."

## Technical Notes

- All client-side, no API calls
- Keep existing draft detection + demo button (moved to less prominent position)
- Preserve resume-draft and reset functionality
- Use existing Shadcn/ui Button, lucide-react icons
- Price comparison slider: pure CSS + React state (mouse/touch drag events)
- Mobile: all horizontal layouts stack vertically, slider works with touch
