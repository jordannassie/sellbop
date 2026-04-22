'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronUp, MessageSquare, Pin, Plus, Check, ArrowRight,
  Trophy, X, Send, Clock, Users, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type PostCategory = 'Feature Requests' | 'Wins' | 'Questions' | 'Store Feedback' | 'Announcements'
type Sort = 'Top' | 'New' | 'Trending'

interface Post {
  id: number
  category: PostCategory
  title: string
  body: string
  upvotes: number
  comments: number
  author: string   // key into DEMO_PROFILES
  time: string
  pinned?: boolean
}

interface Profile {
  displayName: string
  handle: string
  // DiceBear illustrated portrait — looks personalized, not generic initials.
  // Source: api.dicebear.com/7.x/lorelei — stable CDN, no API key required.
  // Falls back to initials + color if avatarUrl is null.
  avatarUrl: string | null
  color: string
  initials: string
  role?: 'Official' | 'Founder' | 'Beta Member' | 'Creator'
  online?: boolean
  stat?: string   // e.g. "12 posts · 84 votes"
}

// ═══════════════════════════════════════════════════════════════
// DEMO DATA
// All data below is mock/demo — structured for real API swap-in.
// ═══════════════════════════════════════════════════════════════

const AV = 'https://api.dicebear.com/7.x/lorelei/svg?seed='

// Mock profiles — wire to real user table when backend is ready
const DEMO_PROFILES: Record<string, Profile> = {
  'SellBop': {
    displayName: 'SellBop', handle: 'SellBop',
    avatarUrl: null, color: '#6d28d9', initials: 'SB',
    role: 'Official', online: true, stat: 'Official account',
  },
  'sarahcreates': {
    displayName: 'Sarah Creates', handle: 'sarahcreates',
    avatarUrl: `${AV}SarahCreates`, color: '#2563EB', initials: 'SC',
    role: 'Founder', online: true, stat: '14 posts · 127 votes',
  },
  'alexjohnson': {
    displayName: 'Alex Builds', handle: 'alexjohnson',
    avatarUrl: `${AV}AlexBuilds`, color: '#7C3AED', initials: 'AB',
    role: 'Founder', online: true, stat: '9 posts · 84 votes',
  },
  'collab_fan': {
    displayName: 'Jordan Studio', handle: 'collab_fan',
    avatarUrl: `${AV}JordanStudio`, color: '#059669', initials: 'JS',
    role: 'Beta Member', online: false, stat: '6 posts · 61 votes',
  },
  'videopro_j': {
    displayName: 'Maya Digital', handle: 'videopro_j',
    avatarUrl: `${AV}MayaDigital`, color: '#D97706', initials: 'MD',
    role: 'Creator', online: true, stat: '4 posts · 47 votes',
  },
  'markd': {
    displayName: 'Mark Davidson', handle: 'markd',
    avatarUrl: `${AV}MarkDavidson`, color: '#DC2626', initials: 'MD',
    role: 'Beta Member', online: false, stat: '3 posts · 21 votes',
  },
  'bundlebuilder': {
    displayName: 'Bundle Builder', handle: 'bundlebuilder',
    avatarUrl: `${AV}BundleBuilder`, color: '#0891B2', initials: 'BB',
    role: 'Creator', online: false, stat: '5 posts · 29 votes',
  },
  'noah_maker': {
    displayName: 'Noah Maker', handle: 'noah_maker',
    avatarUrl: `${AV}NoahMaker`, color: '#7C3AED', initials: 'NM',
    role: 'Founder', online: true, stat: '8 posts · 53 votes',
  },
  'emma_launch': {
    displayName: 'Emma Launch', handle: 'emma_launch',
    avatarUrl: `${AV}EmmaLaunch`, color: '#e11d48', initials: 'EL',
    role: 'Beta Member', online: true, stat: '5 posts · 38 votes',
  },
  'chloe_store': {
    displayName: 'Chloe Store', handle: 'chloe_store',
    avatarUrl: `${AV}ChloeStore`, color: '#0d9488', initials: 'CS',
    role: 'Creator', online: false, stat: '3 posts · 17 votes',
  },
  'ryan_growth': {
    displayName: 'Ryan Growth', handle: 'ryan_growth',
    avatarUrl: `${AV}RyanGrowth`, color: '#ea580c', initials: 'RG',
    role: 'Founder', online: true, stat: '7 posts · 62 votes',
  },
}

// Online-now subset — mock demo (replace with presence API later)
const ONLINE_MEMBERS = ['sarahcreates', 'alexjohnson', 'videopro_j', 'noah_maker', 'emma_launch', 'ryan_growth'] as const

// Top contributors for sidebar — mock demo
const TOP_CONTRIBUTORS = [
  { key: 'sarahcreates', posts: 14, votes: 127 },
  { key: 'alexjohnson',  posts: 9,  votes: 84  },
  { key: 'noah_maker',   posts: 8,  votes: 53  },
  { key: 'ryan_growth',  posts: 7,  votes: 62  },
  { key: 'collab_fan',   posts: 6,  votes: 61  },
] as const

// Demo online-stats (mock)
const ONLINE_STATS = { online: 27, founders: 8, weekly: 142 }

// Mock posts — wire to real community posts table when ready
const SEED_POSTS: Post[] = [
  {
    id: 5, category: 'Announcements', pinned: true,
    title: 'Founder Creators Program is live — apply now',
    body: '$0 platform fees during beta for early creators. Join the program, get the Founder badge on your profile, and help shape what we build next. Limited founding spots available.',
    upvotes: 156, comments: 42, author: 'SellBop', time: '2d ago',
  },
  {
    id: 1, category: 'Feature Requests',
    title: 'Add custom domain support for creator stores',
    body: 'Would love to connect my own domain like shop.myname.com to my SellBop store. This would make it feel way more professional for buyers and help with SEO.',
    upvotes: 47, comments: 12, author: 'alexjohnson', time: '2h ago',
  },
  {
    id: 2, category: 'Wins',
    title: 'My first 10 sales on SellBop 🎉',
    body: 'Hit 10 sales this week selling my digital art bundle. The checkout flow is so clean — buyers compliment it every time. Worth every minute setting this up.',
    upvotes: 93, comments: 28, author: 'sarahcreates', time: '5h ago',
  },
  {
    id: 7, category: 'Questions',
    title: 'Community idea: creator collabs board',
    body: 'What if there was a section where creators could post looking for collab partners? Like a SellBop-native collab matching board. Anyone else want this?',
    upvotes: 61, comments: 19, author: 'collab_fan', time: '4d ago',
  },
  {
    id: 4, category: 'Feature Requests',
    title: 'Should featured products support video previews?',
    body: 'For digital creators, a short video preview in the product card would massively increase conversion. I know Gumroad has this — would SellBop consider it?',
    upvotes: 38, comments: 9, author: 'videopro_j', time: '1d ago',
  },
  {
    id: 3, category: 'Store Feedback',
    title: 'Feedback on my storefront layout — looking for advice',
    body: 'Just launched my store and wanted some eyes on the layout. Not sure if featured products should be at the top or after the header section. What do you all think?',
    upvotes: 21, comments: 14, author: 'markd', time: '8h ago',
  },
  {
    id: 6, category: 'Feature Requests',
    title: 'Add product bundles to homepage sections',
    body: 'Being able to group products into a bundle directly from the store editor would be a game changer. Right now I have to create a separate bundle product manually.',
    upvotes: 29, comments: 7, author: 'bundlebuilder', time: '3d ago',
  },
  {
    id: 8, category: 'Wins',
    title: 'Just crossed $5k this month — SellBop + consistency works',
    body: 'Started 6 weeks ago with zero audience. Posted every day, tweaked my store layout, and this week hit $5k in total sales. The store editor is incredibly easy to use.',
    upvotes: 77, comments: 23, author: 'ryan_growth', time: '3h ago',
  },
  {
    id: 9, category: 'Feature Requests',
    title: 'Analytics dashboard — conversion rate by product?',
    body: 'Would love to see per-product conversion rates in the dashboard. Right now I can only see total visits and total sales. Knowing which products convert best would be huge.',
    upvotes: 34, comments: 11, author: 'emma_launch', time: '12h ago',
  },
]

const CATEGORIES: (PostCategory | 'All')[] = [
  'All', 'Feature Requests', 'Wins', 'Questions', 'Store Feedback', 'Announcements',
]
const SORTS: Sort[] = ['Top', 'New', 'Trending']

const CAT_PILL: Record<PostCategory, string> = {
  'Feature Requests': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Wins':             'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Questions':        'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Store Feedback':   'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Announcements':    'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const ROLE_BADGE: Record<string, string> = {
  'Official':    'bg-white text-black',
  'Founder':     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  'Beta Member': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'Creator':     'bg-zinc-700/60 text-zinc-300 border border-zinc-600/40',
}

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

// Fully functional client-side countdown.
// null = not yet computed (avoids 00:00:00 flash on first paint).
function useMonthCountdown() {
  const [time, setTime] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    function compute() {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const diff = Math.max(0, end.getTime() - now.getTime())
      return {
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000)  / 60_000),
        seconds: Math.floor((diff % 60_000)      / 1_000),
      }
    }
    setTime(compute())
    const id = setInterval(() => setTime(compute()), 1_000)
    return () => clearInterval(id)
  }, [])

  return time
}

// ═══════════════════════════════════════════════════════════════
// AVATAR — shows DiceBear illustrated portrait, falls back to initials
// ═══════════════════════════════════════════════════════════════

function Avatar({
  author,
  size = 'md',
  showOnline = false,
}: {
  author: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showOnline?: boolean
}) {
  const profile = DEMO_PROFILES[author] ?? {
    displayName: author,
    handle: author,
    avatarUrl: null,
    color: '#525252',
    initials: author.charAt(0).toUpperCase(),
  }

  const dimCls = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  }[size]

  const dotSz = {
    xs: 'w-1.5 h-1.5 -bottom-px -right-px',
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5',
    md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
    lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
  }[size]

  return (
    <div className="relative flex-shrink-0">
      {profile.avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          width={48}
          height={48}
          className={cn('rounded-xl object-cover bg-zinc-800', dimCls)}
        />
      ) : (
        <div
          className={cn('rounded-xl flex items-center justify-center text-white font-black shadow-sm', dimCls)}
          style={{ backgroundColor: profile.color }}
        >
          {profile.initials}
        </div>
      )}
      {showOnline && profile.online && (
        <span className={cn('absolute bg-emerald-400 rounded-full border-2 border-zinc-950', dotSz)} />
      )}
    </div>
  )
}

// Stacked avatar row (facepile)
function FacePile({ keys, max = 5 }: { keys: readonly string[]; max?: number }) {
  const shown = keys.slice(0, max)
  const extra = keys.length - max
  return (
    <div className="flex items-center">
      {shown.map((k, i) => (
        <div key={k} className={cn('relative', i > 0 && '-ml-2.5')}>
          <Avatar author={k} size="sm" />
        </div>
      ))}
      {extra > 0 && (
        <div className="-ml-2.5 w-8 h-8 rounded-xl bg-zinc-700 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-zinc-300">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ONLINE NOW CARD — mock demo data, wire to presence API later
// ═══════════════════════════════════════════════════════════════

function OnlineNowCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <p className="text-xs font-bold text-white">Active right now</p>
        </div>
        <span className="text-[10px] text-zinc-500 font-medium">{ONLINE_STATS.online} online</span>
      </div>

      {/* Facepile */}
      <div className="flex items-center gap-3 mb-3">
        <FacePile keys={ONLINE_MEMBERS} max={5} />
        <p className="text-[11px] text-zinc-500 leading-tight">
          {ONLINE_MEMBERS.slice(0, 2).map(k => DEMO_PROFILES[k]?.displayName.split(' ')[0]).join(', ')} and others
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <Users size={9} className="text-zinc-500" />
          <span>{ONLINE_STATS.founders} founders active</span>
        </span>
        <span>·</span>
        <span>{ONLINE_STATS.weekly} members this week</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOP VOTED FEATURE COUNTDOWN — fully functional client-side
// ═══════════════════════════════════════════════════════════════

function CountdownCard({ topPost }: { topPost: Post | undefined }) {
  const time = useMonthCountdown()
  const { days, hours, minutes, seconds } = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const isExpired = time !== null && days === 0 && hours === 0 && minutes === 0 && seconds === 0

  return (
    <div className="bg-zinc-900 border border-violet-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-violet-950/60 px-4 py-3 border-b border-violet-500/20 flex items-center gap-2">
        <Trophy size={13} className="text-violet-400 shrink-0" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-300">
          Top Voted Feature — This Month
        </p>
      </div>

      <div className="p-4">
        {/* Current leader */}
        {topPost && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Current Leader</p>
            <div className="bg-zinc-950 rounded-lg px-3 py-2.5 border border-zinc-800">
              <p className="text-xs font-semibold text-white leading-snug line-clamp-2 mb-1.5">
                {topPost.title}
              </p>
              <span className="text-emerald-400 text-[11px] font-bold">▲ {topPost.upvotes} votes</span>
            </div>
          </div>
        )}

        {/* Countdown */}
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2.5 flex items-center gap-1">
          <Clock size={9} />
          {isExpired ? 'Voting closed — winner selected' : 'Voting ends in'}
        </p>

        {!isExpired && (
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {[
              { val: days,    label: 'Days' },
              { val: hours,   label: 'Hrs'  },
              { val: minutes, label: 'Min'  },
              { val: seconds, label: 'Sec'  },
            ].map(({ val, label }) => (
              <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 text-center">
                {time ? (
                  <p className="text-xl font-black text-white tabular-nums leading-none tracking-tight">
                    {String(val).padStart(2, '0')}
                  </p>
                ) : (
                  <div className="h-6 bg-zinc-800 rounded animate-pulse mx-2" />
                )}
                <p className="text-[9px] text-zinc-600 font-semibold mt-1 uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
          At the end of each month, the top-voted feature is selected to improve creator stores on SellBop. A win-win roadmap, built with creators.
        </p>

        <div className="flex gap-2">
          <button
            className="flex-1 h-8 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[11px] font-semibold rounded-lg hover:bg-violet-600/30 transition-colors"
            onClick={() => {}}
          >
            Vote on Features
          </button>
          <button
            className="flex-1 h-8 bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => {}}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TOP CONTRIBUTORS — mock data, wire to real leaderboard later
// ═══════════════════════════════════════════════════════════════

function TopContributorsCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-amber-400" />
        <h3 className="text-xs font-bold text-white">Top Contributors</h3>
      </div>
      <div className="space-y-3">
        {TOP_CONTRIBUTORS.map(({ key, posts, votes }, idx) => {
          const p = DEMO_PROFILES[key]
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className="text-[10px] font-black text-zinc-600 w-4 text-center shrink-0">
                {idx + 1}
              </div>
              <Avatar author={key} size="sm" showOnline />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-200 truncate">{p.displayName}</p>
                <p className="text-[10px] text-zinc-600">{posts} posts · {votes} votes</p>
              </div>
              {p.role && (
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                  ROLE_BADGE[p.role],
                )}>
                  {p.role}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// CREATE POST MODAL — functional frontend, no backend yet
// ═══════════════════════════════════════════════════════════════

function CreatePostModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (post: Post) => void
}) {
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [category, setCategory]   = useState<PostCategory>('Feature Requests')
  const [authorName, setAuthorName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setTimeout(() => {
      const name   = authorName.trim() || 'You'
      const handle = name.toLowerCase().replace(/\s+/g, '_')
      if (!DEMO_PROFILES[handle]) {
        DEMO_PROFILES[handle] = {
          displayName: name,
          handle,
          avatarUrl: `${AV}${encodeURIComponent(name)}`,
          color: '#6366f1',
          initials: name.charAt(0).toUpperCase(),
          role: 'Beta Member',
          online: true,
        }
      }
      onSubmit({
        id: Date.now(),
        category,
        title: title.trim(),
        body: body.trim(),
        upvotes: 1,
        comments: 0,
        author: handle,
        time: 'just now',
      })
    }, 350)
  }

  const previewName = authorName.trim() || 'You'
  const previewHandle = previewName.toLowerCase().replace(/\s+/g, '_')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-sm font-bold text-white">Create Post</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* "Posting as" preview */}
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-950/60 border-b border-zinc-800 shrink-0">
          <Avatar author={previewHandle} size="sm" />
          <div>
            <p className="text-[11px] text-zinc-500">Posting as</p>
            <p className="text-xs font-semibold text-white leading-tight">{previewName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Your name
            </label>
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Sarah Creates"
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as PostCategory)}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/60 transition-colors cursor-pointer"
            >
              {CATEGORIES.slice(1).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={300}
              required
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
            <p className="text-right text-[10px] text-zinc-600 mt-1">{title.length}/300</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Body <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share more detail, context, or ideas..."
              rows={4}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors resize-none"
            />
          </div>

          <p className="text-[11px] text-zinc-600 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-zinc-500 font-semibold">Demo mode:</span> Your post appears live in the feed immediately. Backend persistence coming soon.
          </p>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="flex-1 h-10 bg-violet-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={12} />
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// POST CARD — richer author identity row
// ═══════════════════════════════════════════════════════════════

function PostCard({
  post, upvoted, count, onUpvote,
}: {
  post: Post; upvoted: boolean; count: number; onUpvote: () => void
}) {
  const profile = DEMO_PROFILES[post.author] ?? {
    displayName: post.author,
    handle: post.author,
    avatarUrl: null,
    color: '#525252',
    initials: post.author.charAt(0).toUpperCase(),
  }

  return (
    <div className={cn(
      'border rounded-xl p-4 sm:p-5 transition-all cursor-pointer group',
      post.pinned
        ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
    )}>
      <div className="flex gap-3 sm:gap-4">

        {/* Upvote column */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
          <button
            onClick={e => { e.stopPropagation(); onUpvote() }}
            aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              upvoted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'hover:bg-white/10 text-zinc-600 border border-transparent hover:text-zinc-300',
            )}
          >
            <ChevronUp size={15} strokeWidth={2.5} />
          </button>
          <span className={cn('text-xs font-bold tabular-nums', upvoted ? 'text-emerald-400' : 'text-zinc-500')}>
            {count}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Tags row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                <Pin size={8} /> Pinned
              </span>
            )}
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
              CAT_PILL[post.category] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600',
            )}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-[15px] font-semibold text-zinc-100 leading-snug mb-1.5 group-hover:text-white transition-colors">
            {post.title}
          </h3>

          {/* Body preview */}
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed line-clamp-2 mb-3.5">
            {post.body}
          </p>

          {/* Rich author row */}
          <div className="flex items-center gap-2.5">
            <Avatar author={post.author} size="sm" showOnline />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-zinc-200 leading-tight">
                  {profile.displayName}
                </span>
                {profile.role && (
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none',
                    ROLE_BADGE[profile.role] ?? 'bg-zinc-700 text-zinc-400',
                  )}>
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-600 leading-tight">
                @{profile.handle} · {post.time}
              </p>
            </div>
            <button className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
              <MessageSquare size={11} />
              <span>{post.comments}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// Order: Founder Program → Countdown → Online Now → Top Contributors → About → Categories
// ═══════════════════════════════════════════════════════════════

function Sidebar({
  topFeaturePost,
  activeCategory,
  setActiveCategory,
  onCreatePost,
}: {
  topFeaturePost: Post | undefined
  activeCategory: PostCategory | 'All'
  setActiveCategory: (c: PostCategory | 'All') => void
  onCreatePost: () => void
}) {
  return (
    <div className="space-y-3">

      {/* 1. Founder Creators Program */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Beta
        </div>
        <h3 className="text-sm font-bold text-white mb-2">Founder Creators Program</h3>
        <p className="text-xs text-zinc-500 leading-relaxed mb-3">
          $0 platform fees during beta. Get your Founder badge and help shape the roadmap.
        </p>
        {/* Facepile under description */}
        <div className="flex items-center gap-2.5 mb-4">
          <FacePile keys={['sarahcreates', 'alexjohnson', 'noah_maker', 'ryan_growth']} max={4} />
          <p className="text-[11px] text-zinc-500">Founders already inside</p>
        </div>
        <div className="space-y-1.5 mb-4">
          {['$0 platform fees', 'Founder badge', 'Vote on features'].map(b => (
            <div key={b} className="flex items-center gap-2 text-xs text-zinc-400">
              <Check size={10} className="text-green-400 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>
        <Link
          href="/login?mode=signup"
          className="flex items-center justify-center w-full h-9 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-100 transition-colors gap-1.5"
        >
          Join now — it&apos;s free <ArrowRight size={11} />
        </Link>
      </div>

      {/* 2. Top Voted Feature + Live Countdown */}
      <CountdownCard topPost={topFeaturePost} />

      {/* 3. Online Now */}
      <OnlineNowCard />

      {/* 4. Top Contributors */}
      <TopContributorsCard />

      {/* 5. About Community */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-white mb-2.5">About Community</h3>
        <ul className="space-y-2">
          {[
            'Request features you want to see',
            'Share wins and milestones',
            'Ask questions and get answers',
            'Help shape the SellBop roadmap',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-xs text-zinc-500">
              <div className="w-1 h-1 bg-zinc-600 rounded-full mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-zinc-600 italic mt-3">
          Every month the community picks the next feature to build.
        </p>
      </div>

      {/* 6. Categories */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-white mb-2.5">Categories</h3>
        <div className="space-y-0.5">
          {CATEGORIES.slice(1).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as PostCategory)}
              className={cn(
                'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Create post CTA */}
      <button
        onClick={onCreatePost}
        className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={13} /> Create Post
      </button>

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function CommunityPage() {
  const [posts, setPosts]                       = useState<Post[]>(SEED_POSTS)
  const [activeCategory, setActiveCategory]     = useState<PostCategory | 'All'>('All')
  const [sort, setSort]                         = useState<Sort>('Top')
  const [upvoted, setUpvoted]                   = useState<Set<number>>(new Set())
  const [counts, setCounts]                     = useState<Record<number, number>>(
    Object.fromEntries(SEED_POSTS.map(p => [p.id, p.upvotes])),
  )
  const [showModal, setShowModal]               = useState(false)

  function toggleUpvote(id: number) {
    setUpvoted(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setCounts(c => ({ ...c, [id]: c[id] - 1 }))
      } else {
        next.add(id)
        setCounts(c => ({ ...c, [id]: c[id] + 1 }))
      }
      return next
    })
  }

  function handleNewPost(post: Post) {
    setPosts(prev => [post, ...prev])
    setCounts(c => ({ ...c, [post.id]: post.upvotes }))
    setShowModal(false)
  }

  const topFeaturePost = [...posts]
    .filter(p => p.category === 'Feature Requests')
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))[0]

  const filtered  = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
  const pinned    = filtered.filter(p => p.pinned)
  const rest      = filtered.filter(p => !p.pinned)
  const sorted    = [...rest].sort((a, b) => {
    if (sort === 'Top')      return (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    if (sort === 'New')      return b.id - a.id
    return ((counts[b.id] ?? 0) + b.comments * 2) - ((counts[a.id] ?? 0) + a.comments * 2)
  })
  const feed = [...pinned, ...sorted]

  return (
    <div className="min-h-screen bg-zinc-950 pt-14">

      {/* ── Banner ───────────────────────────────────────────── */}
      <div className="bg-zinc-900/40 border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-400 mb-2">SellBop</p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Community</h1>
              <p className="text-zinc-400 text-sm mt-1.5 max-w-md leading-relaxed">
                Creators helping shape the future of SellBop. Build your store. Shape the platform.
              </p>
              {/* Facepile in header */}
              <div className="flex items-center gap-2.5 mt-4">
                <FacePile keys={ONLINE_MEMBERS} max={6} />
                <p className="text-xs text-zinc-500">
                  <span className="text-white font-semibold">{ONLINE_STATS.weekly} creators</span> active this week
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-500 transition-colors"
              >
                <Plus size={13} /> Create Post
              </button>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 h-9 px-4 border border-white/15 text-xs font-semibold text-zinc-400 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
              >
                Join Founder Program
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Mobile: social proof cards before feed */}
        <div className="lg:hidden space-y-3 mb-5">
          <CountdownCard topPost={topFeaturePost} />
          <OnlineNowCard />
        </div>

        <div className="flex gap-6 lg:gap-8 items-start">

          {/* ── Feed ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Filter + sort bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as PostCategory | 'All')}
                    className={cn(
                      'flex-shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap',
                      activeCategory === cat
                        ? 'bg-white text-black'
                        : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10 hover:text-zinc-300',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as Sort)}
                className="flex-shrink-0 h-7 pl-2.5 pr-7 rounded-lg text-[11px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Posts */}
            <div className="space-y-2.5">
              {feed.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-14 text-center">
                  <p className="text-zinc-600 text-sm">No posts in this category yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 h-8 px-4 bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-semibold rounded-lg hover:bg-violet-600/30 transition-colors"
                  >
                    <Plus size={11} /> Be the first to post
                  </button>
                </div>
              ) : (
                feed.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    upvoted={upvoted.has(post.id)}
                    count={counts[post.id] ?? post.upvotes}
                    onUpvote={() => toggleUpvote(post.id)}
                  />
                ))
              )}
            </div>

            <div className="mt-5 text-center">
              <button
                className="h-8 px-6 border border-zinc-800 rounded-xl text-[11px] font-semibold text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 bg-zinc-900 transition-colors"
                onClick={() => {}}
              >
                Load more
              </button>
            </div>

          </div>

          {/* ── Sidebar (desktop) ──────────────────────────── */}
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <Sidebar
              topFeaturePost={topFeaturePost}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onCreatePost={() => setShowModal(true)}
            />
          </div>

        </div>

        {/* ── Mobile sidebar cards (below feed) ────────────── */}
        <div className="mt-6 lg:hidden">
          <Sidebar
            topFeaturePost={topFeaturePost}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            onCreatePost={() => setShowModal(true)}
          />
        </div>

      </div>

      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewPost}
        />
      )}

    </div>
  )
}
