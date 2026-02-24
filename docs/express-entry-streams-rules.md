# Express Entry Streams Rules

## Source of truth

The deterministic stream classifier lives in:
- `lib/immigration/expressEntry/streamsEngine.ts`
- `lib/immigration/expressEntry/followUpQuestions.ts`
- `lib/immigration/expressEntry/workHours.ts`
- `lib/immigration/expressEntry/nocLookup.ts`

## Ruleset date

Update the `RULESET_DATE` constant in `streamsEngine.ts` when rule logic changes.

## Follow-up generation

Program checks return `missingFields` keys.
`classifyExpressEntryStreams()` unions those keys and `buildFollowUpQuestions()` maps them to UI question specs.

Shared missing keys (e.g., Quebec intent, primary language test metadata) are deduped before rendering.

## Compatibility

Existing legacy Express Entry eligibility logic remains in `lib/express-entry/eligibility.ts`.
A compatibility export (`computeExpressEntryEligibilityFromStreamsEngine`) is available for incremental migration.
