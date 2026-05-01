/**
 * Agent knowledge loader.
 * Phase 1: reads from localStorage (client admin page) or defaults (server/API route).
 * Later: replace with Supabase DB fetch.
 */

import { DEFAULT_AGENT_KNOWLEDGE_DOCS, type AgentKnowledgeDoc } from '@/lib/demo-data/agent-knowledge'

const LOCAL_STORAGE_KEY = 'sellbop_agent_knowledge_docs'

/**
 * Load the active agent knowledge docs.
 * - On the server (API route): always returns defaults (localStorage unavailable).
 * - On the client: reads from localStorage if admin has customised docs.
 */
export function loadAgentKnowledgeDocs(): AgentKnowledgeDoc[] {
  if (typeof window === 'undefined') {
    return DEFAULT_AGENT_KNOWLEDGE_DOCS
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return DEFAULT_AGENT_KNOWLEDGE_DOCS
    const parsed = JSON.parse(raw) as AgentKnowledgeDoc[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_AGENT_KNOWLEDGE_DOCS
  } catch {
    return DEFAULT_AGENT_KNOWLEDGE_DOCS
  }
}

export function saveAgentKnowledgeDocs(docs: AgentKnowledgeDoc[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(docs))
  } catch { /* storage unavailable */ }
}

/**
 * Returns a combined text block of all active docs — for inclusion in AI prompts.
 */
export function getActiveKnowledgeText(docs?: AgentKnowledgeDoc[]): string {
  const source = docs ?? loadAgentKnowledgeDocs()
  return source
    .filter(d => d.active)
    .map(d => `## ${d.title}\n${d.content}`)
    .join('\n\n')
}
