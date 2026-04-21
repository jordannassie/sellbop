'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Send, ShoppingBag, Store } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType    = 'seller' | 'buyer'
type TicketStatus = 'open' | 'pending' | 'resolved'

interface SupportMessage {
  id: string
  from: 'user' | 'admin'
  text: string
  timestamp: string
}

interface SupportConversation {
  id: string
  userId: string
  userName: string
  userEmail: string
  userType: UserType
  storeSlug?: string
  status: TicketStatus
  subject: string
  lastMessage: string
  lastMessageAt: string
  unread: boolean
  messages: SupportMessage[]
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_CONVERSATIONS: SupportConversation[] = [
  // ── Sellers ──
  {
    id: 'conv-s1',
    userId: 'user-creator-1',
    userName: 'Alex Johnson',
    userEmail: 'creator@sellbop.demo',
    userType: 'seller',
    storeSlug: 'alexjohnson',
    status: 'open',
    subject: 'My Printify products are not syncing',
    lastMessage: 'I clicked Sync but the products are not showing up on my store.',
    lastMessageAt: '2026-04-21T14:32:00Z',
    unread: true,
    messages: [
      { id: 'm1', from: 'user', text: "Hey, I just connected my Printify account and clicked Sync but the products are not showing up on my store. Is there something I'm missing?", timestamp: '2026-04-21T14:20:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Alex! Thanks for reaching out. Can you check if the Printify connection shows "Connected" status on the Clothing page? Sometimes a page refresh helps after the first sync.', timestamp: '2026-04-21T14:25:00Z' },
      { id: 'm3', from: 'user', text: 'I clicked Sync but the products are not showing up on my store.', timestamp: '2026-04-21T14:32:00Z' },
    ],
  },
  {
    id: 'conv-s2',
    userId: 'user-creator-2',
    userName: 'Marcus Williams',
    userEmail: 'marcus@createwithmarcus.com',
    userType: 'seller',
    storeSlug: 'marcuswilliams',
    status: 'pending',
    subject: 'Can I add a custom domain?',
    lastMessage: 'Will this be available on the Pro plan?',
    lastMessageAt: '2026-04-20T09:10:00Z',
    unread: false,
    messages: [
      { id: 'm1', from: 'user', text: 'Hi! I want to connect my own domain to my SellBop store. Is that possible?', timestamp: '2026-04-19T16:00:00Z' },
      { id: 'm2', from: 'admin', text: "Hey Marcus! Custom domains are on our roadmap and planned for Pro users. I'll flag your interest for the product team.", timestamp: '2026-04-19T17:30:00Z' },
      { id: 'm3', from: 'user', text: 'Will this be available on the Pro plan?', timestamp: '2026-04-20T09:10:00Z' },
    ],
  },
  {
    id: 'conv-s3',
    userId: 'user-creator-3',
    userName: 'Priya Sharma',
    userEmail: 'priya@priyacreates.co',
    userType: 'seller',
    storeSlug: 'priyasharma',
    status: 'resolved',
    subject: 'Payout not received',
    lastMessage: 'Got it, thank you for resolving this!',
    lastMessageAt: '2026-04-18T11:00:00Z',
    unread: false,
    messages: [
      { id: 'm1', from: 'user', text: "I was expecting a payout on April 15 but haven't received it yet. Can you look into this?", timestamp: '2026-04-17T08:00:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Priya, I can see the payout was queued. There was a small delay on our payment processor side. It should arrive within 24 hours. Apologies for the inconvenience!', timestamp: '2026-04-17T09:00:00Z' },
      { id: 'm3', from: 'user', text: 'Got it, thank you for resolving this!', timestamp: '2026-04-18T11:00:00Z' },
    ],
  },
  // ── Buyers ──
  {
    id: 'conv-b1',
    userId: 'cust-1',
    userName: 'Sarah Mitchell',
    userEmail: 'sarah.m@gmail.com',
    userType: 'buyer',
    status: 'open',
    subject: 'I purchased the wrong product',
    lastMessage: 'I bought the wrong bundle by mistake. Can I get a refund?',
    lastMessageAt: '2026-04-21T12:45:00Z',
    unread: true,
    messages: [
      { id: 'm1', from: 'user', text: 'Hi, I accidentally purchased the wrong product. I meant to buy the Notion Template but ended up buying the Writing Bundle instead. Can I get a refund or swap?', timestamp: '2026-04-21T12:30:00Z' },
      { id: 'm2', from: 'admin', text: 'Hi Sarah! I can see your order. No problem at all, let me check the order details and process that for you right away.', timestamp: '2026-04-21T12:40:00Z' },
      { id: 'm3', from: 'user', text: 'I bought the wrong bundle by mistake. Can I get a refund?', timestamp: '2026-04-21T12:45:00Z' },
    ],
  },
  {
    id: 'conv-b2',
    userId: 'cust-2',
    userName: 'Jared Kim',
    userEmail: 'jared.k@outlook.com',
    userType: 'buyer',
    status: 'resolved',
    subject: 'Download link not working',
    lastMessage: 'The new link worked perfectly, thanks!',
    lastMessageAt: '2026-04-19T15:20:00Z',
    unread: false,
    messages: [
      { id: 'm1', from: 'user', text: "Hey, I can't download my product. The link keeps saying 'expired.'", timestamp: '2026-04-19T13:00:00Z' },
      { id: 'm2', from: 'admin', text: "Hi Jared, I've regenerated your download link and extended the expiry. Check your email or visit your purchases page.", timestamp: '2026-04-19T14:00:00Z' },
      { id: 'm3', from: 'user', text: 'The new link worked perfectly, thanks!', timestamp: '2026-04-19T15:20:00Z' },
    ],
  },
  {
    id: 'conv-b3',
    userId: 'cust-4',
    userName: 'Maya Chen',
    userEmail: 'maya.c@icloud.com',
    userType: 'buyer',
    status: 'pending',
    subject: 'Question about membership access',
    lastMessage: 'When does the new content drop each month?',
    lastMessageAt: '2026-04-20T17:00:00Z',
    unread: true,
    messages: [
      { id: 'm1', from: 'user', text: 'Hi! I just subscribed to the Creator Membership. When does the new content drop each month?', timestamp: '2026-04-20T17:00:00Z' },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH = diffMs / 3600000
  if (diffH < 24) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${AVATAR_COLORS[idx]}`}>
      {initials}
    </div>
  )
}

const STATUS_CFG: Record<TicketStatus, { label: string; cls: string }> = {
  open:     { label: 'Open',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, cls } = STATUS_CFG[status]
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  )
}

function TypeBadge({ type }: { type: UserType }) {
  if (type === 'seller') {
    return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-violet-50 text-violet-700 border-violet-200">Seller</span>
  }
  return <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Buyer</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SupportSection() {
  type FilterTab = 'sellers' | 'buyers' | 'all'
  const [filter, setFilter]           = useState<FilterTab>('sellers')
  const [conversations, setConvs]     = useState<SupportConversation[]>(DEMO_CONVERSATIONS)
  const [activeId, setActiveId]       = useState<string | null>(DEMO_CONVERSATIONS[0].id)
  const [reply, setReply]             = useState('')
  const messagesEndRef                = useRef<HTMLDivElement>(null)

  const filtered = conversations.filter(c =>
    filter === 'all'     ? true :
    filter === 'sellers' ? c.userType === 'seller' :
                           c.userType === 'buyer',
  )

  const active = conversations.find(c => c.id === activeId) ?? null

  // Auto-select first in filtered list when filter changes
  useEffect(() => {
    if (!filtered.find(c => c.id === activeId)) {
      setActiveId(filtered[0]?.id ?? null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Scroll to bottom when active conversation changes or new message added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, active?.messages.length])

  function selectConv(id: string) {
    setActiveId(id)
    // Mark as read
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread: false } : c))
  }

  function sendReply() {
    if (!reply.trim() || !activeId) return
    const msg: SupportMessage = {
      id: `m-${Date.now()}`,
      from: 'admin',
      text: reply.trim(),
      timestamp: new Date().toISOString(),
    }
    setConvs(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastMessageAt: msg.timestamp }
        : c,
    ))
    setReply('')
  }

  function updateStatus(id: string, status: TicketStatus) {
    setConvs(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: 'sellers', label: 'Sellers', count: conversations.filter(c => c.userType === 'seller').length },
    { id: 'buyers',  label: 'Buyers',  count: conversations.filter(c => c.userType === 'buyer').length },
    { id: 'all',     label: 'All',     count: conversations.length },
  ]

  return (
    <div className="space-y-4 -mx-8 -mt-0">
      {/* Header */}
      <div className="px-8 pt-1 pb-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-bold text-black">Support Inbox</h1>
          <span className="text-sm text-neutral-400">
            {conversations.filter(c => c.unread).length > 0
              ? `${conversations.filter(c => c.unread).length} unread`
              : 'all caught up'}
          </span>
        </div>
      </div>

      {/* Tab filter */}
      <div className="px-8">
        <div className="inline-flex items-center bg-neutral-100 rounded-xl p-1 gap-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5',
                filter === t.id
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-500 hover:text-black',
              ].join(' ')}
            >
              {t.label}
              <span className={['text-[10px] font-bold px-1.5 py-0.5 rounded-full', filter === t.id ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-200 text-neutral-500'].join(' ')}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2-column inbox */}
      <div className="px-8">
        <div className="flex bg-white border border-neutral-200 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>

          {/* ── LEFT: Conversation list ── */}
          <div className="w-80 flex-shrink-0 border-r border-neutral-100 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-50">
              {filtered.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-12">No conversations.</p>
              )}
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConv(c.id)}
                  className={[
                    'w-full text-left px-4 py-3.5 transition-colors',
                    activeId === c.id
                      ? 'bg-neutral-50 border-l-2 border-l-black'
                      : 'hover:bg-neutral-50 border-l-2 border-l-transparent',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar name={c.userName} size="sm" />
                      {c.unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={['text-sm truncate', c.unread ? 'font-bold text-black' : 'font-semibold text-black'].join(' ')}>
                          {c.userName}
                        </p>
                        <p className="text-[10px] text-neutral-400 flex-shrink-0">{fmt(c.lastMessageAt)}</p>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mb-1.5">{c.subject}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TypeBadge type={c.userType} />
                        <StatusBadge status={c.status} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Active conversation ── */}
          {active ? (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Conversation header */}
              <div className="border-b border-neutral-100 px-5 py-3 flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={active.userName} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-black text-sm">{active.userName}</p>
                      <TypeBadge type={active.userType} />
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{active.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Status selector */}
                  <select
                    value={active.status}
                    onChange={e => updateStatus(active.id, e.target.value as TicketStatus)}
                    className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 text-black focus:outline-none focus:border-black bg-white cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  {/* View Store — sellers only */}
                  {active.userType === 'seller' && active.storeSlug && (
                    <Link
                      href={`/store/${active.storeSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Store size={12} />
                      View Store
                    </Link>
                  )}

                  {/* View Orders — buyers */}
                  {active.userType === 'buyer' && (
                    <button
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
                      title="View Orders (not wired yet)"
                    >
                      <ShoppingBag size={12} />
                      Orders
                    </button>
                  )}
                </div>
              </div>

              {/* Subject bar */}
              <div className="border-b border-neutral-50 px-5 py-2 flex-shrink-0 bg-neutral-50/50">
                <p className="text-xs font-semibold text-neutral-500">{active.subject}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {active.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={['flex gap-3', msg.from === 'admin' ? 'flex-row-reverse' : 'flex-row'].join(' ')}
                  >
                    {msg.from === 'user' ? (
                      <Avatar name={active.userName} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        A
                      </div>
                    )}
                    <div className={['max-w-[70%]', msg.from === 'admin' ? 'items-end' : 'items-start'].join(' flex flex-col ')}>
                      <div className={[
                        'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                        msg.from === 'admin'
                          ? 'bg-black text-white rounded-tr-sm'
                          : 'bg-neutral-100 text-black rounded-tl-sm',
                      ].join(' ')}>
                        {msg.text}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 px-1">{fmtFull(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply area */}
              <div className="border-t border-neutral-100 p-4 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={2}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply()
                    }}
                    placeholder={`Reply to ${active.userName}… (⌘+Enter to send)`}
                    className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none leading-relaxed"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim()}
                    className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-neutral-400">
              Select a conversation to view
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
