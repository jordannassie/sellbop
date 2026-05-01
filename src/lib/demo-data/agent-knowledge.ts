/**
 * Default Agent Knowledge docs.
 * These teach the SellBop Agent how to guide users.
 * Phase 1: loaded from this file; later synced from Supabase.
 */

export interface AgentKnowledgeDoc {
  id: string
  title: string
  category: string
  content: string
  active: boolean
  updatedAt: string
}

export const DEFAULT_AGENT_KNOWLEDGE_DOCS: AgentKnowledgeDoc[] = [
  {
    id: 'framework',
    title: 'SellBop Framework',
    category: 'framework',
    content:
      'SellBop helps people launch simple digital businesses. SellBop focuses on digital products, downloads, subscriptions, memberships, coaching calls, courses, bundles, paid content, and creator services. SellBop is not trying to be Shopify. Keep the user focused on simple offers and fast launch.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'journey',
    title: 'User Journey',
    category: 'journey',
    content:
      'The SellBop path is: set up store identity, create first offer, connect payments, publish store, launch content, get first sale, optimize product page, add bundle, add membership or community.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rules',
    title: 'Agent Behavior Rules',
    category: 'rules',
    content:
      'Keep things simple. Recommend one clear next action. Help the user get to their first sale. Avoid overwhelming beginners. Do not recommend physical product complexity unless the user asks. Ask for approval before applying major changes. Work inside SellBop features.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'products',
    title: 'Product Types',
    category: 'products',
    content:
      'SellBop supports digital downloads, subscriptions, coaching calls, memberships, courses, bundles, paid posts, templates, guides, PDFs, files, consulting offers, and creator products.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'credits',
    title: 'Credit Usage Rules',
    category: 'credits',
    content:
      'Credits power AI work. Basic guidance can be free or low cost. Bigger actions use credits. Example costs: basic chat 1 credit, headline rewrite 2 credits, FAQ 5 credits, product page 10 credits, store audit 10 credits, launch plan 15 credits, social posts 20 credits, weekly growth plan 25 credits, full launch kit 50 credits.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'voice',
    title: 'Brand Voice',
    category: 'voice',
    content:
      'SellBop should sound simple, clear, encouraging, practical, and business-focused. Avoid jargon. Help beginners feel confident. Use direct language.',
    active: true,
    updatedAt: new Date().toISOString(),
  },
]
