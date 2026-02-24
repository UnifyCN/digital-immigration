import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib"
import { buildEligibilityAuditDiagrams, type DiagramSpec } from "./diagramSpecs.ts"
import type {
  AuditGap,
  AuditSection,
  DecisionNode,
  EligibilityAuditModel,
  RuleAssumption,
} from "./reportModel.ts"

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 42
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const COLORS = {
  text: rgb(0.11, 0.11, 0.13),
  muted: rgb(0.35, 0.35, 0.4),
  border: rgb(0.73, 0.73, 0.78),
  heading: rgb(0.04, 0.16, 0.38),
  process: rgb(0.9, 0.95, 1),
  decision: rgb(1, 0.97, 0.87),
  pass: rgb(0.89, 0.98, 0.89),
  fail: rgb(1, 0.91, 0.91),
  needsInfo: rgb(1, 0.96, 0.88),
  gap: rgb(0.93, 0.93, 0.93),
}

interface PdfContext {
  doc: PDFDocument
  fontRegular: PDFFont
  fontBold: PDFFont
}

interface TocEntry {
  title: string
  pageNumber: number
}

interface WrappedLine {
  text: string
  width: number
}

interface TableColumn {
  key: string
  label: string
  width: number
}

function newPage(doc: PDFDocument): PDFPage {
  return doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
}

function toDateString(iso: string): string {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toISOString().slice(0, 10)
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): WrappedLine[] {
  const normalized = (text || "").replace(/\s+/g, " ").trim()
  if (!normalized) return [{ text: "", width: 0 }]

  const words = normalized.split(" ")
  const lines: WrappedLine[] = []
  let current = words[0] ?? ""

  for (let index = 1; index < words.length; index++) {
    const word = words[index]
    const candidate = `${current} ${word}`
    const candidateWidth = font.widthOfTextAtSize(candidate, fontSize)
    if (candidateWidth <= maxWidth) {
      current = candidate
      continue
    }
    lines.push({
      text: current,
      width: font.widthOfTextAtSize(current, fontSize),
    })
    current = word
  }

  lines.push({
    text: current,
    width: font.widthOfTextAtSize(current, fontSize),
  })
  return lines
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  options: {
    x: number
    y: number
    width: number
    font: PDFFont
    size: number
    color: ReturnType<typeof rgb>
    lineHeight?: number
  },
): number {
  const lineHeight = options.lineHeight ?? options.size * 1.35
  const lines = wrapText(text, options.font, options.size, options.width)
  let y = options.y
  for (const line of lines) {
    page.drawText(line.text, {
      x: options.x,
      y,
      size: options.size,
      font: options.font,
      color: options.color,
    })
    y -= lineHeight
  }
  return y
}

function drawSection(page: PDFPage, section: AuditSection, ctx: PdfContext): PDFPage {
  let currentPage = page
  let y = PAGE_HEIGHT - MARGIN

  currentPage.drawText(section.title, {
    x: MARGIN,
    y,
    size: 18,
    font: ctx.fontBold,
    color: COLORS.heading,
  })
  y -= 28

  y = drawWrappedText(currentPage, section.summary, {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    font: ctx.fontRegular,
    size: 10,
    color: COLORS.text,
  })
  y -= 8

  currentPage.drawText(`Layer: ${section.layer}`, {
    x: MARGIN,
    y,
    size: 9,
    font: ctx.fontBold,
    color: COLORS.muted,
  })
  y -= 16

  for (const ref of section.sourceRefs) {
    y = drawWrappedText(currentPage, `Source: ${ref.filePath} :: ${ref.symbol}`, {
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      font: ctx.fontRegular,
      size: 8.5,
      color: COLORS.muted,
    })
  }
  y -= 10

  for (const item of section.decisionConditions) {
    const lineWidth = CONTENT_WIDTH - 20
    const blockLines = [
      wrapText(`Condition: ${item.condition}`, ctx.fontRegular, 8.8, lineWidth),
      wrapText(`Thresholds: ${item.thresholds.length ? item.thresholds.join("; ") : "None"}`, ctx.fontRegular, 8.8, lineWidth),
      wrapText(`Outcome: ${item.outcome}`, ctx.fontRegular, 8.8, lineWidth),
      wrapText(`Fail State: ${item.failState}`, ctx.fontRegular, 8.8, lineWidth),
      wrapText(`Missing-Data State: ${item.missingDataState}`, ctx.fontRegular, 8.8, lineWidth),
    ]
    const blockLineCount = blockLines.reduce((sum, lines) => sum + lines.length, 0)
    const blockHeight = 34 + blockLineCount * 12 + 10

    if (y < MARGIN + blockHeight + 20) {
      currentPage = newPage(ctx.doc)
      y = PAGE_HEIGHT - MARGIN
      currentPage.drawText(`${section.title} (continued)`, {
        x: MARGIN,
        y,
        size: 14,
        font: ctx.fontBold,
        color: COLORS.heading,
      })
      y -= 24
    }

    currentPage.drawRectangle({
      x: MARGIN,
      y: y - blockHeight,
      width: CONTENT_WIDTH,
      height: blockHeight - 4,
      borderColor: COLORS.border,
      borderWidth: 0.8,
      color: rgb(1, 1, 1),
    })

    y -= 16
    currentPage.drawText(item.title, {
      x: MARGIN + 10,
      y,
      size: 10.5,
      font: ctx.fontBold,
      color: COLORS.text,
    })
    y -= 14
    y = drawWrappedText(currentPage, `Condition: ${item.condition}`, {
      x: MARGIN + 10,
      y,
      width: lineWidth,
      font: ctx.fontRegular,
      size: 8.8,
      color: COLORS.text,
      lineHeight: 12,
    })
    y = drawWrappedText(currentPage, `Thresholds: ${item.thresholds.length ? item.thresholds.join("; ") : "None"}`, {
      x: MARGIN + 10,
      y,
      width: lineWidth,
      font: ctx.fontRegular,
      size: 8.8,
      color: COLORS.text,
      lineHeight: 12,
    })
    y = drawWrappedText(currentPage, `Outcome: ${item.outcome}`, {
      x: MARGIN + 10,
      y,
      width: lineWidth,
      font: ctx.fontRegular,
      size: 8.8,
      color: COLORS.text,
      lineHeight: 12,
    })
    y = drawWrappedText(currentPage, `Fail State: ${item.failState}`, {
      x: MARGIN + 10,
      y,
      width: lineWidth,
      font: ctx.fontRegular,
      size: 8.8,
      color: COLORS.text,
      lineHeight: 12,
    })
    y = drawWrappedText(currentPage, `Missing-Data State: ${item.missingDataState}`, {
      x: MARGIN + 10,
      y,
      width: lineWidth,
      font: ctx.fontRegular,
      size: 8.8,
      color: COLORS.text,
      lineHeight: 12,
    })
    y -= 14
  }

  return currentPage
}

function nodeFill(node: DecisionNode): ReturnType<typeof rgb> {
  if (node.type === "decision") return COLORS.decision
  if (node.type === "terminal-pass") return COLORS.pass
  if (node.type === "terminal-fail") return COLORS.fail
  if (node.type === "terminal-needs-info") return COLORS.needsInfo
  if (node.type === "gap") return COLORS.gap
  if (node.type === "data") return rgb(0.92, 0.95, 0.92)
  return COLORS.process
}

function drawArrow(page: PDFPage, fromX: number, fromY: number, toX: number, toY: number) {
  page.drawLine({
    start: { x: fromX, y: fromY },
    end: { x: toX, y: toY },
    thickness: 1,
    color: COLORS.border,
  })

  const angle = Math.atan2(toY - fromY, toX - fromX)
  const headLength = 5
  const leftAngle = angle + Math.PI - Math.PI / 7
  const rightAngle = angle + Math.PI + Math.PI / 7
  page.drawLine({
    start: { x: toX, y: toY },
    end: { x: toX + headLength * Math.cos(leftAngle), y: toY + headLength * Math.sin(leftAngle) },
    thickness: 1,
    color: COLORS.border,
  })
  page.drawLine({
    start: { x: toX, y: toY },
    end: { x: toX + headLength * Math.cos(rightAngle), y: toY + headLength * Math.sin(rightAngle) },
    thickness: 1,
    color: COLORS.border,
  })
}

function drawDiamond(page: PDFPage, x: number, y: number, width: number, height: number, color: ReturnType<typeof rgb>) {
  const cx = x + width / 2
  const cy = y + height / 2
  const path = `M ${cx} ${y + height} L ${x + width} ${cy} L ${cx} ${y} L ${x} ${cy} Z`
  page.drawSvgPath(path, {
    color,
    borderWidth: 1,
    borderColor: COLORS.border,
  })
}

function drawDiagram(page: PDFPage, spec: DiagramSpec, ctx: PdfContext) {
  page.drawText(spec.title, {
    x: MARGIN,
    y: PAGE_HEIGHT - MARGIN,
    size: 17,
    font: ctx.fontBold,
    color: COLORS.heading,
  })

  drawWrappedText(page, spec.summary, {
    x: MARGIN,
    y: PAGE_HEIGHT - MARGIN - 24,
    width: CONTENT_WIDTH,
    font: ctx.fontRegular,
    size: 9.5,
    color: COLORS.text,
  })

  const canvasX = MARGIN
  const canvasY = MARGIN + 40
  const canvasWidth = CONTENT_WIDTH
  const canvasHeight = PAGE_HEIGHT - MARGIN * 2 - 92

  page.drawRectangle({
    x: canvasX,
    y: canvasY,
    width: canvasWidth,
    height: canvasHeight,
    borderColor: rgb(0.85, 0.87, 0.91),
    borderWidth: 0.8,
    color: rgb(1, 1, 1),
  })

  const nodeRects = new Map<string, { x: number; y: number; width: number; height: number }>()
  for (const node of spec.nodes) {
    const layout = spec.layout[node.id]
    if (!layout) continue
    const width = layout.width * canvasWidth
    const height = layout.height * canvasHeight
    const x = canvasX + layout.x * canvasWidth
    const y = canvasY + layout.y * canvasHeight - height
    nodeRects.set(node.id, { x, y, width, height })
  }

  for (const edge of spec.edges) {
    const fromRect = nodeRects.get(edge.from)
    const toRect = nodeRects.get(edge.to)
    if (!fromRect || !toRect) continue
    const fromX = fromRect.x + fromRect.width / 2
    const fromY = fromRect.y
    const toX = toRect.x + toRect.width / 2
    const toY = toRect.y + toRect.height
    drawArrow(page, fromX, fromY, toX, toY)
    if (edge.label) {
      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2
      page.drawText(edge.label, {
        x: midX + 4,
        y: midY + 3,
        size: 7.5,
        font: ctx.fontRegular,
        color: COLORS.muted,
      })
    }
  }

  for (const node of spec.nodes) {
    const rect = nodeRects.get(node.id)
    if (!rect) continue

    if (node.type === "decision") {
      drawDiamond(page, rect.x, rect.y, rect.width, rect.height, nodeFill(node))
    } else {
      page.drawRectangle({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        borderColor: COLORS.border,
        borderWidth: 0.9,
        color: nodeFill(node),
      })
    }

    const labelY = drawWrappedText(page, node.label, {
      x: rect.x + 5,
      y: rect.y + rect.height - 12,
      width: rect.width - 10,
      font: ctx.fontBold,
      size: 7.2,
      color: COLORS.text,
      lineHeight: 9.2,
    })

    if (node.detail) {
      drawWrappedText(page, node.detail, {
        x: rect.x + 5,
        y: labelY - 1,
        width: rect.width - 10,
        font: ctx.fontRegular,
        size: 6.7,
        color: COLORS.muted,
        lineHeight: 8.5,
      })
    }
  }
}

function rowLines(row: Record<string, string>, columns: TableColumn[], ctx: PdfContext): Record<string, WrappedLine[]> {
  const lines: Record<string, WrappedLine[]> = {}
  for (const col of columns) {
    lines[col.key] = wrapText(row[col.key] ?? "", ctx.fontRegular, 8, col.width - 8)
  }
  return lines
}

function rowHeight(lines: Record<string, WrappedLine[]>): number {
  let maxLines = 1
  for (const key of Object.keys(lines)) {
    maxLines = Math.max(maxLines, lines[key].length)
  }
  return maxLines * 10 + 8
}

function drawTableHeader(page: PDFPage, y: number, columns: TableColumn[], ctx: PdfContext): number {
  let x = MARGIN
  page.drawRectangle({
    x: MARGIN,
    y: y - 18,
    width: CONTENT_WIDTH,
    height: 18,
    color: rgb(0.94, 0.96, 0.99),
    borderColor: COLORS.border,
    borderWidth: 0.8,
  })

  for (const col of columns) {
    page.drawText(col.label, {
      x: x + 3,
      y: y - 13,
      size: 8,
      font: ctx.fontBold,
      color: COLORS.text,
    })
    page.drawLine({
      start: { x, y: y - 18 },
      end: { x, y: y },
      thickness: 0.5,
      color: COLORS.border,
    })
    x += col.width
  }
  page.drawLine({
    start: { x: MARGIN + CONTENT_WIDTH, y: y - 18 },
    end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 0.5,
    color: COLORS.border,
  })
  return y - 18
}

function drawRow(
  page: PDFPage,
  y: number,
  columns: TableColumn[],
  lines: Record<string, WrappedLine[]>,
  rowHeightValue: number,
  ctx: PdfContext,
) {
  page.drawRectangle({
    x: MARGIN,
    y: y - rowHeightValue,
    width: CONTENT_WIDTH,
    height: rowHeightValue,
    color: rgb(1, 1, 1),
    borderColor: COLORS.border,
    borderWidth: 0.6,
  })

  let x = MARGIN
  for (const col of columns) {
    const cellLines = lines[col.key] ?? []
    let lineY = y - 12
    for (const line of cellLines) {
      page.drawText(line.text, {
        x: x + 3,
        y: lineY,
        size: 8,
        font: ctx.fontRegular,
        color: COLORS.text,
      })
      lineY -= 10
    }
    page.drawLine({
      start: { x, y: y - rowHeightValue },
      end: { x, y },
      thickness: 0.5,
      color: COLORS.border,
    })
    x += col.width
  }
  page.drawLine({
    start: { x: MARGIN + CONTENT_WIDTH, y: y - rowHeightValue },
    end: { x: MARGIN + CONTENT_WIDTH, y },
    thickness: 0.5,
    color: COLORS.border,
  })
}

function rulesAndGapRows(assumptions: RuleAssumption[], gaps: AuditGap[]): Record<string, string>[] {
  const assumptionRows = assumptions.map((item) => ({
    domain: item.domain,
    rule: item.rule,
    implementation: item.currentImplementation,
    source: item.source,
    status: item.status,
    note: item.validationNote,
  }))

  const gapRows = gaps.map((gap) => ({
    domain: gap.domain,
    rule: gap.title,
    implementation: gap.currentBehavior,
    source: gap.sourceRefs.map((ref) => `${ref.filePath}::${ref.symbol}`).join(" | "),
    status: gap.status,
    note: gap.impact,
  }))

  return [...assumptionRows, ...gapRows]
}

function drawToc(page: PDFPage, entries: TocEntry[], ctx: PdfContext) {
  let y = PAGE_HEIGHT - MARGIN
  page.drawText("Table of Contents", {
    x: MARGIN,
    y,
    size: 20,
    font: ctx.fontBold,
    color: COLORS.heading,
  })
  y -= 28

  for (const entry of entries) {
    if (y < MARGIN + 12) break
    page.drawText(entry.title, {
      x: MARGIN,
      y,
      size: 10,
      font: ctx.fontRegular,
      color: COLORS.text,
    })
    const pageLabel = `${entry.pageNumber}`
    const width = ctx.fontBold.widthOfTextAtSize(pageLabel, 10)
    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - width,
      y,
      size: 10,
      font: ctx.fontBold,
      color: COLORS.text,
    })
    y -= 14
  }
}

function drawFooter(page: PDFPage, pageIndex: number, pageCount: number, ctx: PdfContext) {
  const text = `${pageIndex + 1} / ${pageCount}`
  const width = ctx.fontRegular.widthOfTextAtSize(text, 8)
  page.drawText(text, {
    x: PAGE_WIDTH / 2 - width / 2,
    y: 16,
    size: 8,
    font: ctx.fontRegular,
    color: COLORS.muted,
  })
}

export async function renderEligibilityAuditPdf(model: EligibilityAuditModel): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx: PdfContext = { doc, fontRegular, fontBold }
  const tocEntries: TocEntry[] = []

  const cover = newPage(doc)
  cover.drawText("Eligibility Engine Audit Report", {
    x: MARGIN,
    y: PAGE_HEIGHT - 96,
    size: 30,
    font: fontBold,
    color: COLORS.heading,
  })
  drawWrappedText(
    cover,
    "Decision-logic audit of currently implemented eligibility behavior (calculation and presentation layers), with deterministic flowcharts and gap tracking.",
    {
      x: MARGIN,
      y: PAGE_HEIGHT - 136,
      width: CONTENT_WIDTH,
      font: fontRegular,
      size: 12,
      color: COLORS.text,
      lineHeight: 16,
    },
  )

  const metaLines = [
    `Generated Date: ${toDateString(model.generatedAt)}`,
    `Git Commit: ${model.gitCommit}`,
    `Legacy EE Rules Version: ${model.rulesetVersion.legacyExpressEntry}`,
    `Streams Ruleset Date: ${model.rulesetVersion.streamsEngine}`,
    "Scope Note: Implementation audit artifact only. Not legal advice.",
  ]
  let metaY = PAGE_HEIGHT - 226
  for (const line of metaLines) {
    cover.drawText(line, {
      x: MARGIN,
      y: metaY,
      size: 11,
      font: fontRegular,
      color: COLORS.text,
    })
    metaY -= 18
  }

  const tocPage = newPage(doc)

  for (const section of model.sections) {
    const startPage = doc.getPageCount() + 1
    tocEntries.push({ title: section.title, pageNumber: startPage })
    const page = newPage(doc)
    drawSection(page, section, ctx)
  }

  const diagramSpecMap = new Map<string, DiagramSpec>(
    buildEligibilityAuditDiagrams().map((item) => [item.id, item]),
  )
  for (const tree of model.decisionTrees) {
    const spec = diagramSpecMap.get(tree.id)
    if (!spec) continue
    tocEntries.push({ title: `${tree.title} (Diagram)`, pageNumber: doc.getPageCount() + 1 })
    const page = newPage(doc)
    drawDiagram(page, spec, ctx)
  }

  tocEntries.push({
    title: "Rule Assumptions & Gaps Summary Table",
    pageNumber: doc.getPageCount() + 1,
  })
  let tablePage = newPage(doc)
  let y = PAGE_HEIGHT - MARGIN
  tablePage.drawText("Rule Assumptions & Gaps Summary", {
    x: MARGIN,
    y,
    size: 16,
    font: fontBold,
    color: COLORS.heading,
  })
  y -= 24
  y = drawWrappedText(
    tablePage,
    "Columns: Domain | Rule | Current Implementation | Source | Status | Validation Note.",
    {
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      font: fontRegular,
      size: 9,
      color: COLORS.text,
    },
  )
  y -= 6

  const columns: TableColumn[] = [
    { key: "domain", label: "Domain", width: 68 },
    { key: "rule", label: "Rule", width: 86 },
    { key: "implementation", label: "Current Implementation", width: 115 },
    { key: "source", label: "Source", width: 110 },
    { key: "status", label: "Status", width: 52 },
    { key: "note", label: "Validation Note", width: CONTENT_WIDTH - (68 + 86 + 115 + 110 + 52) },
  ]

  y = drawTableHeader(tablePage, y, columns, ctx)
  const rows = rulesAndGapRows(model.assumptions, model.gaps)

  for (const row of rows) {
    const lines = rowLines(row, columns, ctx)
    const h = rowHeight(lines)
    if (y - h < MARGIN + 12) {
      tablePage = newPage(doc)
      y = PAGE_HEIGHT - MARGIN
      tablePage.drawText("Rule Assumptions & Gaps Summary (continued)", {
        x: MARGIN,
        y,
        size: 12,
        font: fontBold,
        color: COLORS.heading,
      })
      y -= 18
      y = drawTableHeader(tablePage, y, columns, ctx)
    }
    drawRow(tablePage, y, columns, lines, h, ctx)
    y -= h
  }

  drawToc(tocPage, tocEntries, ctx)

  const pages = doc.getPages()
  for (let index = 0; index < pages.length; index++) {
    drawFooter(pages[index], index, pages.length, ctx)
  }

  return doc.save()
}
