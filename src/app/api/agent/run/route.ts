import { NextRequest, NextResponse } from 'next/server'
import { buildSellBopAccountSnapshot } from '@/lib/agent/sellbop-context'
import { getActiveKnowledgeText } from '@/lib/agent/agent-knowledge'
import type {
  AgentRunRequest,
  AgentRunResponse,
  AgentRecommendation,
  AgentActivity,
  SellBopAccountSnapshot,
} from '@/lib/agent/types'

// ── Demo activity items ───────────────────────────────────────────────────────

const DEMO_ACTIVITY: AgentActivity[] = [
  {
    id: 'act-1',
    title: 'Generated product page draft',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-2',
    title: 'Suggested price: $29',
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-3',
    title: 'Added FAQ section',
    status: 'completed',
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-4',
    title: 'Waiting for approval',
    description: 'Product page copy',
    status: 'waiting_approval',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
]

// ── Recommendation builder ────────────────────────────────────────────────────

function buildRecommendations(
  snapshot: SellBopAccountSnapshot,
  prompt: string,
): AgentRecommendation[] {
  const recs: AgentRecommendation[] = []
  const p = prompt.toLowerCase()

  const { store, products, sales } = snapshot

  // ── Prompt-driven additions ───────────────────────────────
  if (p.includes('membership')) {
    recs.push({
      id: 'rec-membership',
      type: 'CREATE_MEMBERSHIP_PLAN',
      title: 'Build a membership offer',
      description: 'Create a recurring subscription your audience can join.',
      creditCost: 15,
      priority: 'high',
      requiresApproval: true,
      status: 'ready',
    })
  }

  if (p.includes('price') || p.includes('pricing')) {
    recs.push({
      id: 'rec-pricing',
      type: 'SUGGEST_PRICING',
      title: 'Suggest optimal pricing',
      description: 'Analyse your product and recommend the best price point.',
      creditCost: 5,
      priority: 'high',
      requiresApproval: false,
      status: 'ready',
    })
  }

  if (p.includes('launch')) {
    recs.push(
      {
        id: 'rec-launch-plan',
        type: 'CREATE_LAUNCH_PLAN',
        title: 'Create your launch plan',
        description: 'Step-by-step guide to launch your store this week.',
        creditCost: 15,
        priority: 'high',
        requiresApproval: false,
        status: 'ready',
      },
      {
        id: 'rec-social-posts',
        type: 'GENERATE_SOCIAL_POSTS',
        title: 'Generate 10 launch posts',
        description: 'Ready-to-publish social content to drive your first sales.',
        creditCost: 20,
        priority: 'medium',
        requiresApproval: false,
        status: 'ready',
      },
    )
  }

  if (p.includes('product')) {
    if (products.count === 0) {
      recs.push({
        id: 'rec-create-product',
        type: 'CREATE_PRODUCT_DRAFT',
        title: 'Create your first digital product',
        description: 'I will draft a product page, pricing, and FAQ for you.',
        creditCost: 10,
        priority: 'high',
        requiresApproval: true,
        status: 'ready',
      })
    } else {
      recs.push({
        id: 'rec-product-page',
        type: 'GENERATE_PRODUCT_PAGE',
        title: 'Rewrite your product page',
        description: 'Improve headline, description, and conversion copy.',
        creditCost: 10,
        priority: 'medium',
        requiresApproval: true,
        status: 'ready',
      })
    }
  }

  if (p.includes('audit') || p.includes('improve')) {
    recs.push({
      id: 'rec-audit',
      type: 'STORE_AUDIT',
      title: 'Run a store audit',
      description: 'Find conversion, copy, and setup improvements.',
      creditCost: 10,
      priority: 'medium',
      requiresApproval: false,
      status: 'ready',
    })
  }

  // ── Account-state-driven additions ───────────────────────
  if (products.count === 0 && !recs.find(r => r.type === 'CREATE_PRODUCT_DRAFT')) {
    recs.push({
      id: 'rec-first-product',
      type: 'CREATE_PRODUCT_DRAFT',
      title: 'Create your first digital product',
      description: 'I will draft a product page, pricing, and FAQ for you.',
      creditCost: 10,
      priority: 'high',
      requiresApproval: true,
      status: 'ready',
    })
    recs.push({
      id: 'rec-suggest-price',
      type: 'SUGGEST_PRICING',
      title: 'Suggest a price',
      description: 'Get a data-backed pricing recommendation for your offer.',
      creditCost: 5,
      priority: 'high',
      requiresApproval: false,
      status: 'ready',
    })
  }

  if (!store.hasAvatar || !store.hasBio || !store.hasHeadline) {
    recs.push({
      id: 'rec-store-profile',
      type: 'STORE_AUDIT',
      title: 'Complete your store identity',
      description: 'Add a photo, bio, and headline to build trust with buyers.',
      creditCost: 5,
      priority: 'high',
      requiresApproval: false,
      status: 'ready',
    })
  }

  if (store.published && sales.totalOrders === 0) {
    if (!recs.find(r => r.type === 'GENERATE_SOCIAL_POSTS')) {
      recs.push(
        {
          id: 'rec-launch-content',
          type: 'GENERATE_SOCIAL_POSTS',
          title: 'Create launch content',
          description: 'Generate 10 posts, 3 emails, and 5 ad ideas.',
          creditCost: 20,
          priority: 'high',
          requiresApproval: false,
          status: 'ready',
        },
        {
          id: 'rec-launch-email',
          type: 'GENERATE_EMAIL',
          title: 'Write a launch email',
          description: 'A compelling first email to send your audience.',
          creditCost: 5,
          priority: 'medium',
          requiresApproval: true,
          status: 'ready',
        },
      )
    }
  }

  if (sales.totalOrders > 0) {
    recs.push(
      {
        id: 'rec-bundle',
        type: 'CREATE_BUNDLE',
        title: 'Build an upsell bundle',
        description: 'Increase average order value with a product bundle.',
        creditCost: 15,
        priority: 'medium',
        requiresApproval: true,
        status: 'ready',
      },
      {
        id: 'rec-growth-plan',
        type: 'GENERAL_GUIDANCE',
        title: 'Weekly growth plan',
        description: 'Get a simple plan to grow sales this week.',
        creditCost: 25,
        priority: 'low',
        requiresApproval: false,
        status: 'ready',
      },
    )
  }

  // ── Fallback defaults (always show at least 4 cards) ─────
  const defaults: AgentRecommendation[] = [
    {
      id: 'def-optimize',
      type: 'GENERATE_PRODUCT_PAGE',
      title: 'Optimize your product page',
      description: 'I found 3 conversion improvements to apply.',
      creditCost: 10,
      priority: 'high',
      requiresApproval: true,
      status: 'ready',
    },
    {
      id: 'def-launch-content',
      type: 'GENERATE_SOCIAL_POSTS',
      title: 'Create launch content',
      description: 'Generate 10 posts, 3 emails, and 5 ad ideas.',
      creditCost: 20,
      priority: 'medium',
      requiresApproval: false,
      status: 'ready',
    },
    {
      id: 'def-bundle',
      type: 'CREATE_BUNDLE',
      title: 'Build an upsell bundle',
      description: 'Increase average order value with a bundle.',
      creditCost: 15,
      priority: 'medium',
      requiresApproval: true,
      status: 'ready',
    },
    {
      id: 'def-growth',
      type: 'GENERAL_GUIDANCE',
      title: 'Weekly growth plan',
      description: 'Get a simple plan to grow sales this week.',
      creditCost: 25,
      priority: 'low',
      requiresApproval: false,
      status: 'ready',
    },
  ]

  // Merge: deduplicate by id, prefer prompt/account recs, pad with defaults
  const existing = new Set(recs.map(r => r.id))
  for (const d of defaults) {
    if (!existing.has(d.id) && recs.length < 6) recs.push(d)
  }

  // Sort by priority
  const order = { high: 0, medium: 1, low: 2 }
  return recs.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 6)
}

// ── Message builder ───────────────────────────────────────────────────────────

function buildMessage(snapshot: SellBopAccountSnapshot, prompt: string): string {
  const { store, products, sales } = snapshot
  const p = prompt.trim().toLowerCase()

  if (products.count === 0) {
    return "You don't have a product yet. I recommend creating your first simple digital offer and a launch plan. I've prepared the next actions below — start with creating your product and we will build from there."
  }

  if (store.published && sales.totalOrders === 0) {
    return `Your store is live but hasn't had a sale yet. The fastest path is launch content — social posts, a launch email, and getting eyes on your store. I've prepared content and strategy recommendations below.`
  }

  if (sales.totalOrders > 0) {
    return `Great — you have sales coming in. Now it is time to grow. Adding a bundle or membership can significantly increase your average order value. I've prepared growth recommendations below.`
  }

  if (!store.published) {
    return `Your store isn't published yet. Once you complete your store identity and create a product, you can publish and start selling. I've prepared the key next steps below.`
  }

  if (p.includes('membership')) {
    return "Building a membership is a great way to create recurring revenue. I've prepared a membership plan recommendation and the next steps to launch it."
  }

  if (p.includes('launch')) {
    return "Let's build your launch. I've prepared a launch plan, social post ideas, and email copy to help you get your first sales fast."
  }

  if (p.includes('price') || p.includes('pricing')) {
    return "Pricing your product correctly makes a big difference in conversions. I've prepared a pricing recommendation based on your product type and market."
  }

  return "I reviewed your account. Here are the most valuable next actions to move your store forward. Start with the top recommendation and work down."
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AgentRunRequest>
    const prompt = body.prompt?.trim() ?? ''

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required.' }, { status: 400 })
    }

    // Get authenticated user ID from Supabase session (best-effort)
    let userId: string | null = null
    try {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch { /* Supabase not configured — continue with demo snapshot */ }

    const [snapshot] = await Promise.all([
      buildSellBopAccountSnapshot(userId),
    ])

    // Load knowledge (server always gets defaults in Phase 1)
    const _knowledge = getActiveKnowledgeText()

    const recommendations = buildRecommendations(snapshot, prompt)
    const message = buildMessage(snapshot, prompt)

    const response: AgentRunResponse = {
      message,
      recommendations,
      activity: DEMO_ACTIVITY,
      snapshot,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[agent/run]', err)
    return NextResponse.json(
      { error: 'Agent encountered an error. Please try again.' },
      { status: 500 },
    )
  }
}
