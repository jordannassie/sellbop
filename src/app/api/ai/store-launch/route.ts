import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.

export interface StoreLaunchInput {
  whatYouSell: string
  whoIsItFor: string
  whatsIncluded: string
  priceRange: string
}

export interface StoreLaunchOutput {
  storeName: string
  storeHeadline: string
  storeBio: string
  storeSlug: string
  productName: string
  productSlug: string
  productType: string
  shortDescription: string
  fullDescription: string
  priceSuggestion: number
  compareAtPriceSuggestion: number | null
  ctaText: string
  whatIsIncluded: string[]
  faq: { question: string; answer: string }[]
  checkoutCopy: string
  marketplaceExcerpt: string
  socialPost: string
  productImagePrompt: string
  storeBannerPrompt: string
  launchChecklist: string[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SYSTEM_PROMPT = `You are an expert brand and product strategist for SellBop, a creator commerce platform.
You help creators launch their store and first product with compelling copy and smart positioning.
Always respond with valid JSON matching the exact schema provided.
Be specific, benefit-focused, and compelling. Avoid generic filler phrases.
Write in the creator's voice — confident, direct, and helpful.`

const USER_PROMPT = (input: StoreLaunchInput) => `
Create a complete store and product launch plan for a creator who wants to sell:

- What they sell: ${input.whatYouSell}
- Who it is for: ${input.whoIsItFor}
- What is included: ${input.whatsIncluded || 'not specified'}
- Price range: ${input.priceRange || '$20-$50'}

Return JSON with this EXACT schema:
{
  "storeName": "string — 2-4 word creator brand name",
  "storeHeadline": "string — punchy 6-10 word store tagline",
  "storeBio": "string — 2-3 sentence store bio (about the creator and what they help people with)",
  "storeSlug": "string — URL-safe slug from storeName",
  "productName": "string — compelling 3-8 word product name",
  "productSlug": "string — URL-safe product slug",
  "productType": "digital_download | service_offer | subscription | bundle",
  "shortDescription": "string — 1-2 sentence hook, max 160 chars",
  "fullDescription": "string — 3-4 paragraph description covering: what it is, who benefits, what's inside, outcome",
  "priceSuggestion": number (in cents, e.g. 2900 = $29),
  "compareAtPriceSuggestion": number | null (optional strikethrough price in cents),
  "ctaText": "string — one of: Get Instant Access | Buy Now | Book and Pay | Join the Membership | Start Subscription | Download Now | Get the Bundle",
  "whatIsIncluded": ["string", ...] (3-6 bullet points of what is included),
  "faq": [{"question": "string", "answer": "string"}, ...] (3 FAQ items),
  "checkoutCopy": "string — short persuasive text shown at checkout, 1 sentence max",
  "marketplaceExcerpt": "string — 1 sentence for marketplace card, max 120 chars",
  "socialPost": "string — ready-to-post launch caption, 240 chars max",
  "productImagePrompt": "string — DALL-E image prompt for the product thumbnail",
  "storeBannerPrompt": "string — DALL-E banner prompt for the store header",
  "launchChecklist": ["string", ...] (5-7 short action items the creator should do to launch)
}
`

export async function POST(req: NextRequest) {
  const body = (await req.json()) as StoreLaunchInput

  const { whatYouSell, whoIsItFor } = body

  if (!whatYouSell?.trim() || !whoIsItFor?.trim()) {
    return NextResponse.json(
      { error: 'whatYouSell and whoIsItFor are required.' },
      { status: 400 },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(generateMockResponse(body))
  }

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
          { role: 'user', content: USER_PROMPT(body) },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[AI Store Launch] OpenAI error:', err)
      return NextResponse.json(
        { error: 'AI generation failed. Check your OPENAI_API_KEY.' },
        { status: 500 },
      )
    }

    const json = (await response.json()) as {
      choices: { message: { content: string } }[]
    }

    const raw = json.choices?.[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw) as StoreLaunchOutput

    if (result.storeName && !result.storeSlug) {
      result.storeSlug = slugify(result.storeName)
    }
    if (result.productName && !result.productSlug) {
      result.productSlug = slugify(result.productName)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI Store Launch] Error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 },
    )
  }
}

// ── Smart mock response when OPENAI_API_KEY is not configured ────────────────

function generateMockResponse(input: StoreLaunchInput): StoreLaunchOutput {
  const { whatYouSell, whoIsItFor, priceRange } = input
  const shortSell = whatYouSell.slice(0, 40)
  const priceNum = parsePriceRange(priceRange)

  return {
    storeName: `${whoIsItFor.split(' ')[0]} Hub`,
    storeHeadline: `Everything ${whoIsItFor} needs to succeed`,
    storeBio: `I help ${whoIsItFor} master ${shortSell} with clear, practical resources that actually work. No fluff — just results. Join thousands who have already leveled up.`,
    storeSlug: slugify(`${whoIsItFor.split(' ')[0]}-hub`),
    productName: `The ${shortSell} Blueprint`,
    productSlug: slugify(`the-${shortSell}-blueprint`),
    productType: 'digital_download',
    shortDescription: `The step-by-step system ${whoIsItFor} use to get results with ${shortSell}. Instant access.`,
    fullDescription: `Are you a ${whoIsItFor} who wants to get real results with ${shortSell}?\n\nMost people struggle because they waste time on approaches that don't work. This blueprint gives you a proven system — built from real experience — so you can skip the guesswork and get straight to results.\n\nInside, you'll find everything organized into clear, actionable steps. Each section builds on the last, so you always know exactly what to do next.\n\nThis is the resource I wish I had when I started. Built for ${whoIsItFor} who are serious about making progress.`,
    priceSuggestion: priceNum,
    compareAtPriceSuggestion: Math.round(priceNum * 1.67),
    ctaText: 'Get Instant Access',
    whatIsIncluded: [
      `Complete ${shortSell} guide (PDF + video)`,
      'Step-by-step implementation roadmap',
      'Templates and checklists you can use today',
      'Bonus resources and tools list',
      'Lifetime access + future updates',
    ],
    faq: [
      {
        question: `Who is this for?`,
        answer: `This is built specifically for ${whoIsItFor} who want to get results with ${shortSell} without wasting time on trial and error.`,
      },
      {
        question: `How do I get access?`,
        answer: `Instantly after purchase. You'll get an email with your download link and access details within seconds.`,
      },
      {
        question: `What if it's not right for me?`,
        answer: `If you go through the material and don't feel it delivered value, reach out within 30 days and we'll make it right.`,
      },
    ],
    checkoutCopy: `Join ${whoIsItFor} who have already transformed how they approach ${shortSell}.`,
    marketplaceExcerpt: `The complete ${shortSell} system for ${whoIsItFor}. Practical, proven, instant access.`,
    socialPost: `Just launched: The ${shortSell} Blueprint — built specifically for ${whoIsItFor}. Everything I know in one place. Link below 👇`,
    productImagePrompt: `Clean, minimal digital product mockup for "${shortSell}". White background, modern typography, professional design. Flat lay style.`,
    storeBannerPrompt: `Modern creator store banner for a brand helping ${whoIsItFor} with ${shortSell}. Clean, white, minimal, professional. Subtle gradient.`,
    launchChecklist: [
      'Review and edit your store name and bio',
      'Publish your first product page',
      'Add a product image or cover',
      'Share your store link on social media',
      'Write a launch post using the generated social copy',
      'Set up your Stripe account to collect payments',
      'Enable marketplace visibility to get discovered',
    ],
  }
}

function parsePriceRange(range: string): number {
  if (!range) return 2900
  const match = range.match(/\$?(\d+)/)
  if (match) return parseInt(match[1]!, 10) * 100
  return 2900
}
