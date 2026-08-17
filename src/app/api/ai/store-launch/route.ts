import { NextRequest, NextResponse } from 'next/server'

// NOTE: OPENAI_API_KEY is accessed server-side only via process.env.
// It is never passed to the client or exposed in any client bundle.

export interface StoreLaunchInput {
  whatYouSell: string
  whoIsItFor: string
  whatsIncluded: string
  priceRange: string
}

export interface LaunchKit {
  positioningStatement: string
  offerSummary: string
  targetBuyer: string
  priceReasoning: string
  firstTenSalesStrategy: string[]
  sevenDayLaunchPlan: { day: number; title: string; action: string }[]
  instagramCaptions: string[]
  reelsIdeas: string[]
  dmScripts: string[]
  emailCopy: { subject: string; body: string }[]
  productImageIdeas: string[]
  mockupPrompt: string
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
  launchKit: LaunchKit
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const SYSTEM_PROMPT = `You are SellBop's AI Launch Coach. You help people start their first online business by turning what they know into a digital product they can sell. You are both a coach and a builder. Create practical, specific outputs that can be used directly on a product page, checkout page, and launch plan. Keep the language simple, encouraging, and action-oriented. Always respond with valid JSON matching the exact schema provided. Be specific and avoid generic filler phrases.`

const USER_PROMPT = (input: StoreLaunchInput) => `
Create a complete product launch package for a creator who wants to sell:

- What they sell: ${input.whatYouSell}
- Who it is for: ${input.whoIsItFor}
- What is included: ${input.whatsIncluded || 'not specified — suggest what to include'}
- Price range: ${input.priceRange || '$20-$50'}

Return JSON with this EXACT schema (no extra fields, no missing fields):
{
  "storeName": "string — 2-4 word creator brand name",
  "storeHeadline": "string — punchy 6-10 word store tagline",
  "storeBio": "string — 2-3 sentence store bio",
  "storeSlug": "string — URL-safe slug from storeName",
  "productName": "string — compelling 3-8 word product name",
  "productSlug": "string — URL-safe product slug",
  "productType": "digital_download | service_offer | subscription | bundle",
  "shortDescription": "string — 1-2 sentence hook, max 160 chars",
  "fullDescription": "string — 3-4 paragraph description: what it is, who benefits, what's inside, outcome",
  "priceSuggestion": number (in cents, e.g. 2900 = $29),
  "compareAtPriceSuggestion": number | null (optional strikethrough price in cents),
  "ctaText": "Get Instant Access | Buy Now | Book and Pay | Join the Membership | Start Subscription | Download Now | Get the Bundle",
  "whatIsIncluded": ["string"] (3-6 bullet points of what is included),
  "faq": [{"question": "string", "answer": "string"}] (3 FAQ items),
  "checkoutCopy": "string — short persuasive checkout text, 1 sentence max",
  "marketplaceExcerpt": "string — 1 sentence for marketplace card, max 120 chars",
  "socialPost": "string — ready-to-post launch caption, 240 chars max",
  "productImagePrompt": "string — DALL-E image prompt for the product thumbnail",
  "storeBannerPrompt": "string — DALL-E banner prompt for the store header",
  "launchChecklist": ["string"] (5-7 short action items the creator should do to launch),
  "launchKit": {
    "positioningStatement": "string — 1-2 sentence statement of what the product is, who it helps, and why it matters",
    "offerSummary": "string — 2-3 sentence summary of the full offer including what buyers get",
    "targetBuyer": "string — specific description of the ideal buyer, their pain, and their goal",
    "priceReasoning": "string — 2-3 sentence explanation of why this price is right for this product and audience",
    "firstTenSalesStrategy": ["string"] (5 specific actions to get the first 10 sales),
    "sevenDayLaunchPlan": [
      {"day": 1, "title": "string", "action": "string"},
      {"day": 2, "title": "string", "action": "string"},
      {"day": 3, "title": "string", "action": "string"},
      {"day": 4, "title": "string", "action": "string"},
      {"day": 5, "title": "string", "action": "string"},
      {"day": 6, "title": "string", "action": "string"},
      {"day": 7, "title": "string", "action": "string"}
    ],
    "instagramCaptions": ["string"] (3 ready-to-post Instagram captions for launch day, teaser, and follow-up),
    "reelsIdeas": ["string"] (3 specific Reels/TikTok video ideas with hook and concept),
    "dmScripts": ["string"] (2 short DM scripts to send to warm leads or past contacts),
    "emailCopy": [
      {"subject": "string", "body": "string"}
    ] (2 launch emails: announcement and follow-up),
    "productImageIdeas": ["string"] (3 specific ideas for product cover/thumbnail visuals),
    "mockupPrompt": "string — detailed DALL-E prompt to create a product mockup image"
  }
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
      console.error('[AI Launch Coach] OpenAI error:', err)
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
    console.error('[AI Launch Coach] Error:', err)
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
      'Review and edit your product name and description',
      'Publish your product page',
      'Add a product cover image',
      'Share your product link on social media',
      'Write a launch post using the generated captions',
      'Send launch emails to your list',
      'Enable marketplace visibility to get discovered',
    ],
    launchKit: {
      positioningStatement: `The ${shortSell} Blueprint is the definitive resource for ${whoIsItFor} who want to stop guessing and start getting results. Built by someone who has been in their shoes.`,
      offerSummary: `For just $${(priceNum / 100).toFixed(0)}, you get the complete ${shortSell} Blueprint — a step-by-step system, templates, checklists, and lifetime access to everything you need to move forward with confidence. No monthly fees. No fluff.`,
      targetBuyer: `Your ideal buyer is a ${whoIsItFor} who has tried to figure out ${shortSell} on their own but feels stuck or overwhelmed. They want a clear path forward and are willing to invest in themselves to get real results.`,
      priceReasoning: `At $${(priceNum / 100).toFixed(0)}, this product is priced to be an easy decision for ${whoIsItFor}. It's affordable enough to buy without hesitation, but high enough to signal that this is a serious, well-built resource — not a freebie. This sweet spot maximizes conversions while protecting your perceived value.`,
      firstTenSalesStrategy: [
        `Send a personal message to 10 people in your audience who would benefit most from this — be specific about why you thought of them`,
        `Post your launch caption on Instagram and add the product link to your bio with a clear CTA`,
        `Share a short Reel or TikTok showing the problem this solves and tease the solution`,
        `Email your list with the announcement email and a limited-time launch offer`,
        `Post in 2-3 relevant Facebook Groups or Reddit communities where your buyer hangs out, sharing value and mentioning your launch`,
      ],
      sevenDayLaunchPlan: [
        { day: 1, title: 'Tease your launch', action: `Post a teaser on Instagram: "Something big is coming for ${whoIsItFor}… 👀 Stay tuned." Update bio link to a coming soon page or your store.` },
        { day: 2, title: 'Show the problem', action: `Share a Reel/TikTok about the biggest struggle ${whoIsItFor} face with ${shortSell}. Don't sell yet — just be real and relatable.` },
        { day: 3, title: 'Build anticipation', action: `Post 3 Instagram Stories showing a sneak peek inside the product. Ask your audience "Would this help you?" to create engagement.` },
        { day: 4, title: 'Launch day', action: `Post your launch caption, send your announcement email, and DM your warm leads personally. Pin the launch post and update your bio link.` },
        { day: 5, title: 'Share social proof', action: `Share any early feedback or screenshots. Post a "thank you" for early buyers and remind followers the product is live.` },
        { day: 6, title: 'Answer objections', action: `Post a FAQ-style Instagram carousel or Story addressing the top 3 questions buyers have before purchasing.` },
        { day: 7, title: 'Last call push', action: `Send a follow-up email, post a final Story reminder, and add a sense of urgency: "If you've been thinking about it, now is the time."` },
      ],
      instagramCaptions: [
        `🚀 Launch day! The ${shortSell} Blueprint is finally here — built specifically for ${whoIsItFor} who are ready to stop guessing and start getting results.\n\nEverything you need in one place. Link in bio 👆\n\n#launch #${whoIsItFor.replace(/\s+/g, '')} #digitalproduct`,
        `Here's what no one tells ${whoIsItFor} about ${shortSell}…\n\nYou don't need more motivation. You need a system.\n\nThat's exactly what The ${shortSell} Blueprint gives you. Tap the link in my bio to grab it.\n\n#${shortSell.replace(/\s+/g, '')} #creatoreconomy`,
        `PSA for every ${whoIsItFor} who has been stuck on ${shortSell}:\n\nYou don't have to figure this out alone anymore. I put everything I know into one guide so you can move faster and stress less. 🙌\n\nLink in bio to get it now.`,
      ],
      reelsIdeas: [
        `Hook: "If you're a ${whoIsItFor} struggling with ${shortSell}, watch this." Show 3 common mistakes in 30 seconds, then reveal your product as the solution in the last 5 seconds.`,
        `Hook: "I made $X selling my first digital product — here's exactly how I did it." Walk through your product creation journey and show the finished product at the end.`,
        `Hook: "POV: You just discovered the easiest way to [main outcome from ${shortSell}]." Screen-record or show a preview of your product, highlighting the most valuable section.`,
      ],
      dmScripts: [
        `Hey [Name]! I just launched something I think you'd love — The ${shortSell} Blueprint. It's built for ${whoIsItFor} who want to get real results without the guesswork. Thought of you immediately. Want me to send you the link?`,
        `Hi [Name], I know you've mentioned wanting to improve your ${shortSell} — I just put together a complete guide that covers exactly that. It's live now and I'd love for you to be one of the first to grab it. Here's the link: [link]. Let me know what you think!`,
      ],
      emailCopy: [
        {
          subject: `It's live: The ${shortSell} Blueprint for ${whoIsItFor}`,
          body: `Hey [First Name],\n\nI've been working on something for the past few weeks and it's finally ready.\n\nIf you're a ${whoIsItFor} who has been struggling with ${shortSell} — I built this for you.\n\nThe ${shortSell} Blueprint is a step-by-step guide that gives you everything you need to get real results, without the guesswork.\n\nHere's what's inside:\n${['Step-by-step system', 'Templates and checklists', 'Actionable roadmap'].map(i => `• ${i}`).join('\n')}\n\n→ Grab it here: [link]\n\nIt's only $${(priceNum / 100).toFixed(0)} and you get instant access.\n\nHappy to answer any questions — just reply to this email.\n\n[Your name]`,
        },
        {
          subject: `Still thinking about it? Here's what other ${whoIsItFor} said`,
          body: `Hey [First Name],\n\nI sent you an email a couple days ago about The ${shortSell} Blueprint and wanted to follow up.\n\nI know life gets busy and it's easy for emails to get buried.\n\nHere's the short version: This is a practical, no-fluff guide for ${whoIsItFor} who are serious about getting results with ${shortSell}.\n\nIf that sounds like you, grab it here: [link]\n\nIf now isn't the right time, no worries at all — just hit reply and let me know.\n\n[Your name]`,
        },
      ],
      productImageIdeas: [
        `A clean, flat-lay mockup of a digital PDF or e-book with the product title on the cover, placed on a light desk with a coffee cup and notebook. Minimal, professional aesthetic.`,
        `A device mockup showing the product open on an iPad or laptop screen, with a bright, inviting background. Include your brand colors and a subtle "Instant Access" badge.`,
        `A styled graphic with the product title in bold typography, a simple icon representing ${shortSell}, and a clean gradient background. Works well as both a product thumbnail and social media share image.`,
      ],
      mockupPrompt: `Create a professional digital product mockup for "${shortSell} Blueprint". Show an open PDF/e-book on a clean white or light grey surface. Modern, minimal design. The cover should show a bold title, clean typography, and a subtle graphic element. High quality, flat-lay perspective, soft shadows. Style: modern digital creator product.`,
    },
  }
}

function parsePriceRange(range: string): number {
  if (!range) return 2900
  const match = range.match(/\$?(\d+)/)
  if (match) return parseInt(match[1]!, 10) * 100
  return 2900
}
