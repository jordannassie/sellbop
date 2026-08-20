import 'server-only'

import PDFDocument from 'pdfkit'
import type { BrandContext, PdfContentInput, PdfSection } from './types'

const PAGE = { width: 612, height: 792 }
const MARGIN = 54

interface RenderPdfInput extends PdfContentInput {
  brandContext?: BrandContext
  shopName?: string | null
}

function renderSection(doc: InstanceType<typeof PDFDocument>, section: PdfSection) {
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text(section.heading, { width: PAGE.width - MARGIN * 2 })
  doc.moveDown(0.35)

  if (section.body?.trim()) {
    doc.font('Helvetica').fontSize(11).fillColor('#333333').text(section.body.trim(), {
      width: PAGE.width - MARGIN * 2,
      lineGap: 4,
    })
    doc.moveDown(0.25)
  }

  if (section.bullets?.length) {
    doc.font('Helvetica').fontSize(11).fillColor('#333333')
    for (const bullet of section.bullets) {
      doc.text(`• ${bullet}`, { width: PAGE.width - MARGIN * 2, indent: 12, lineGap: 3 })
    }
    doc.moveDown(0.25)
  }

  if (section.callout?.trim()) {
    const y = doc.y
    doc.roundedRect(MARGIN, y, PAGE.width - MARGIN * 2, 56, 6).fillAndStroke('#f5f5f5', '#e5e5e5')
    doc.fillColor('#222222').font('Helvetica-Bold').fontSize(10).text('Note', MARGIN + 12, y + 10)
    doc.font('Helvetica').fontSize(10).fillColor('#444444').text(section.callout.trim(), MARGIN + 12, y + 24, {
      width: PAGE.width - MARGIN * 2 - 24,
    })
    doc.y = y + 68
  }
}

function parseSectionsFromBrief(input: RenderPdfInput): PdfSection[] {
  if (input.sections?.length) return input.sections
  const brief = input.content_brief?.trim()
  if (!brief) {
    return [{
      heading: 'Overview',
      body: 'This premium digital guide was created for your audience. Replace this section with structured content supplied by your creative workflow.',
    }]
  }

  const chunks = brief.split(/\n{2,}/).map(s => s.trim()).filter(Boolean)
  return chunks.map((chunk, i) => {
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean)
    const heading = lines[0]?.length && lines[0].length < 80 ? lines[0] : `Section ${i + 1}`
    const rest = lines[0]?.length && lines[0].length < 80 ? lines.slice(1) : lines
    const bullets = rest.filter(l => /^[-*•]/.test(l)).map(l => l.replace(/^[-*•]\s*/, ''))
    const bodyLines = rest.filter(l => !/^[-*•]/.test(l))
    return {
      heading,
      body: bodyLines.join('\n') || undefined,
      bullets: bullets.length ? bullets : undefined,
    }
  })
}

export async function renderProductPdf(input: RenderPdfInput): Promise<Buffer> {
  const brand = input.brandContext
  const creator = input.author_name ?? brand?.brand_name ?? input.shopName ?? 'SellBop Creator'
  const sections = parseSectionsFromBrief(input)

  const doc = new PDFDocument({ size: 'LETTER', margin: MARGIN, autoFirstPage: false })
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk as Buffer))

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  // Cover
  doc.addPage()
  doc.rect(0, 0, PAGE.width, PAGE.height).fill('#111111')
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28)
    .text(input.title, MARGIN, 220, { width: PAGE.width - MARGIN * 2, align: 'center' })
  if (input.subtitle?.trim()) {
    doc.font('Helvetica').fontSize(14).fillColor('#dddddd')
      .text(input.subtitle.trim(), MARGIN, doc.y + 16, { width: PAGE.width - MARGIN * 2, align: 'center' })
  }
  doc.font('Helvetica').fontSize(11).fillColor('#bbbbbb')
    .text(creator, MARGIN, PAGE.height - 120, { width: PAGE.width - MARGIN * 2, align: 'center' })
  if (input.audience?.trim() || brand?.audience) {
    doc.fontSize(10).fillColor('#999999')
      .text(`For ${input.audience ?? brand?.audience}`, MARGIN, doc.y + 8, { width: PAGE.width - MARGIN * 2, align: 'center' })
  }

  // Content pages
  doc.addPage()
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(20).text(input.title, { width: PAGE.width - MARGIN * 2 })
  if (input.content_brief && !input.sections?.length) {
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(11).fillColor('#444444').text(input.content_brief.slice(0, 1200), {
      width: PAGE.width - MARGIN * 2,
      lineGap: 4,
    })
  }

  for (const section of sections) {
    if (doc.y > PAGE.height - 140) doc.addPage()
    renderSection(doc, section)
  }

  if (input.include_health_disclaimer) {
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text('Disclaimer')
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text(
      'This guide is for general educational purposes only and is not medical advice. Consult qualified professionals before making health, nutrition, or fitness decisions.',
      { width: PAGE.width - MARGIN * 2, lineGap: 4 },
    )
  }

  // Footer page numbers
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    if (i === 0) continue
    doc.font('Helvetica').fontSize(9).fillColor('#888888')
      .text(`${i} / ${range.count - 1}`, PAGE.width - MARGIN - 40, PAGE.height - MARGIN + 10, { lineBreak: false })
  }

  doc.end()
  return finished
}

export function isPdfGenerationAvailable(): boolean {
  return true
}
