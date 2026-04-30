import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.

interface BuilderInput {
  whatAreYouSelling: string
  whoIsItFor: string
  productType: string
  priceRange: string
  toneStyle: string
  whatsIncluded: string
}

interface BuilderOutput {
  productName: string
  slugSuggestion: string
  shortDescription: string
  fullDescription: string
  productType: string
  priceSuggestion: number
  compareAtPriceSuggestion: number | null
  ctaText: string
  whatIsIncluded: string[]
  faq: { question: string; answer: string }[]
  checkoutCopy: string
  socialPost: string
  marketplaceExcerpt: string
  imagePrompt: string
  bannerPrompt: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SYSTEM_PROMPT = `You are an expert digital product copywriter for SellBop, a creator commerce platform. 
You help creators write compelling product listings that convert.
Always respond with valid JSON matching the exact schema provided.
Be specific, benefit-focused, and compelling. Never use filler phrases like "comprehensive" or "game-changing".
Use the creator's voice and the specified tone/style.`

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BuilderInput

  const { whatAreYouSelling, whoIsItFor, productType, priceRange, toneStyle, whatsIncluded } = body

  if (!whatAreYouSelling || !whoIsItFor) {
    return NextResponse.json(
      { error: 'whatAreYouSelling and whoIsItFor are required.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY

  // If no API key configured, return a smart mock response
  if (!apiKey) {
    const mockResult = generateMockResponse(body)
    return NextResponse.json(mockResult)
  }

  const userPrompt = `
Create a complete product listing for:
- What: ${whatAreYouSelling}
- For: ${whoIsItFor}
- Type: ${productType || 'digital download'}
- Price range: ${priceRange || '$20-$50'}
- Tone/style: ${toneStyle || 'professional, clear, friendly'}
- What's included: ${whatsIncluded || 'not specified'}

Return JSON with this exact schema:
{
  "productName": "string — compelling 3-8 word product name",
  "slugSuggestion": "string — URL-safe slug",
  "shortDescription": "string — 1-2 sentence hook, max 160 chars",
  "fullDescription": "string — 3-4 paragraph description with benefits, for whom, what's inside",
  "productType": "digital_download | service_offer | subscription | bundle",
  "priceSuggestion": number (in cents, e.g. 2900 = $29),
  "compareAtPriceSuggestion": number | null (original price for discount, in cents),
  "ctaText": "string — one of: Get Instant Access | Buy Now | Book and Pay | Join the Membership | Start Subscription | Download Now | Get the Bundle",
  "whatIsIncluded": ["string", ...] — 3-6 bullet points of what's included,
  "faq": [{"question": "string", "answer": "string"}, ...] — 3 FAQ items,
  "checkoutCopy": "string — short persuasive text shown at checkout, 1 sentence",
  "socialPost": "string — ready-to-post launch tweet/caption, 240 chars max",
  "marketplaceExcerpt": "string — 1 sentence shown on marketplace card, max 120 chars",
  "imagePrompt": "string — DALL-E image generation prompt for the product thumbnail",
  "bannerPrompt": "string — DALL-E banner generation prompt for the store banner"
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[AI Product Builder] OpenAI error:', err)
      return NextResponse.json(
        { error: 'AI generation failed. Check your OPENAI_API_KEY.' },
        { status: 500 },
      )
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[]
    }

    const raw = json.choices?.[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw) as BuilderOutput

    // Ensure slug is valid
    if (result.productName && !result.slugSuggestion) {
      result.slugSuggestion = slugify(result.productName)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI Product Builder] Error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 },
    )
  }
}

// ── Mock response when OPENAI_API_KEY is not configured ──────────────────────

function generateMockResponse(input: BuilderInput): BuilderOutput {
  const { whatAreYouSelling, whoIsItFor, productType, priceRange } = input
  const name = whatAreYouSelling.slice(0, 50)
  const priceNum = parsePriceRange(priceRange)

  return {
    productName: `The ${name} System`,
    slugSuggestion: slugify(`the-${name}-system`),
    shortDescription: `Everything ${whoIsItFor} needs to succeed with ${name}. Instant access, no fluff.`,
    fullDescription: `Are you a ${whoIsItFor} looking to master ${name}?\n\nThis product gives you a proven, step-by-step system built specifically for people in your position. No guesswork — just results.\n\nInside, you'll find everything you need to get started immediately, implement confidently, and see real outcomes. Designed to be practical, actionable, and effective.\n\nWhether you're just starting out or looking to level up, this is the resource you've been waiting for.`,
    productType: productType || 'digital_download',
    priceSuggestion: priceNum,
    compareAtPriceSuggestion: Math.round(priceNum * 1.5),
    ctaText: productType === 'subscription' ? 'Start Subscription' : productType === 'service_offer' ? 'Book and Pay' : 'Get Instant Access',
    whatIsIncluded: [
      `Complete ${name} guide (PDF)`,
      'Step-by-step implementation checklist',
      'Templates and frameworks you can use today',
      'Bonus resource library',
      'Lifetime updates',
    ],
    faq: [
      {
        question: 'Who is this for?',
        answer: `This is designed specifically for ${whoIsItFor} who want results with ${name}.`,
      },
      {
        question: 'How do I access it?',
        answer: 'You get instant access after purchase. Check your email for the download link.',
      },
      {
        question: 'Do I need any prior experience?',
        answer: `No prior experience needed. Everything is explained clearly from the ground up.`,
      },
    ],
    checkoutCopy: `Join hundreds of ${whoIsItFor} who already use this system.`,
    socialPost: `Just launched: ${name} — the system I built for ${whoIsItFor}. Get it now 👇`,
    marketplaceExcerpt: `The complete ${name} system for ${whoIsItFor}.`,
    imagePrompt: `Clean, minimal product mockup for a digital product about "${name}". White background, modern design, professional.`,
    bannerPrompt: `Modern creator banner for a digital product brand focused on "${name}". Clean, white, minimal, professional.`,
  }
}

function parsePriceRange(range: string): number {
  if (!range) return 2900
  const match = range.match(/\$?(\d+)/)
  if (match) {
    const val = parseInt(match[1], 10)
    return val * 100
  }
  return 2900
}
