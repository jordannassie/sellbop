/**
 * SellBop Agentic AI — shared TypeScript types.
 * Phase 1: data structures only; no backend logic here.
 */

export type AgenticMode = 'on' | 'off'

export type AgentActionType =
  | 'CREATE_PRODUCT_DRAFT'
  | 'GENERATE_PRODUCT_PAGE'
  | 'SUGGEST_PRICING'
  | 'CREATE_FAQ'
  | 'CREATE_LAUNCH_PLAN'
  | 'GENERATE_SOCIAL_POSTS'
  | 'GENERATE_EMAIL'
  | 'STORE_AUDIT'
  | 'CREATE_BUNDLE'
  | 'CREATE_MEMBERSHIP_PLAN'
  | 'CONNECT_PAYMENTS'
  | 'PUBLISH_STORE'
  | 'GENERAL_GUIDANCE'

export interface AgentRecommendation {
  id: string
  type: AgentActionType
  title: string
  description: string
  creditCost: number
  priority: 'high' | 'medium' | 'low'
  requiresApproval: boolean
  status?: 'ready' | 'waiting_approval' | 'completed'
}

export interface AgentActivity {
  id: string
  title: string
  description?: string
  status: 'completed' | 'in_progress' | 'waiting_approval' | 'failed'
  createdAt: string
}

export interface SellBopAccountSnapshot {
  user: {
    id: string | null
    name: string | null
    email: string | null
    plan: string
    creditsRemaining: number
  }
  store: {
    exists: boolean
    published: boolean
    name: string | null
    slug: string | null
    hasAvatar: boolean
    hasBio: boolean
    hasHeadline: boolean
    hasBanner: boolean
  }
  products: {
    count: number
    liveCount: number
    draftCount: number
  }
  payments: {
    stripeConnected: boolean
  }
  sales: {
    totalRevenue: number
    totalOrders: number
  }
  missingSteps: string[]
}

export interface AgentRunRequest {
  prompt: string
  agenticMode: boolean
}

export interface AgentRunResponse {
  message: string
  recommendations: AgentRecommendation[]
  activity: AgentActivity[]
  snapshot: SellBopAccountSnapshot
}
