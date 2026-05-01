'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronUp, MessageSquare, Pin, Plus, Check, ArrowRight,
  Trophy, X, Clock, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_AVATAR_PHOTOS } from '@/lib/demo-avatars'

// ─── Types ────────────────────────────────────────────────────────────────────

type PostCategory = 'Feature Requests' | 'Wins' | 'Questions' | 'Store Feedback' | 'Announcements'
type Sort = 'Top' | 'New' | 'Trending'

interface Post {
  id: number
  category: PostCategory
  title: string
  body: string
  upvotes: number
  comments: number
  author: string
  time: string
  pinned?: boolean
  link?: string
}

interface Profile {
  displayName: string
  handle: string
  avatarUrl: string | null
  color: string
  initials: string
  role?: 'Official' | 'Founder' | 'Beta Member' | 'Creator'
  online?: boolean
  stat?: string
}

// ─── Demo data ────────────────────────────────────────────────────────────────

// Mock profiles — wire to real user table when backend is ready
const DEMO_PROFILES: Record<string, Profile> = {
  'SellBop': {
    displayName: 'SellBop', handle: 'SellBop',
    avatarUrl: null, color: '#000000', initials: 'SB',
    role: 'Official', online: true, stat: 'Official account',
  },
  'sarahcreates': {
    displayName: 'Sarah Creates', handle: 'sarahcreates',
    avatarUrl: DEMO_AVATAR_PHOTOS.sarahcreates, color: '#2563EB', initials: 'SC',
    role: 'Founder', online: true, stat: '14 posts · 127 votes',
  },
  'alexjohnson': {
    displayName: 'Alex Builds', handle: 'alexjohnson',
    avatarUrl: DEMO_AVATAR_PHOTOS.alexjohnson, color: '#7C3AED', initials: 'AB',
    role: 'Founder', online: true, stat: '9 posts · 84 votes',
  },
  'collab_fan': {
    displayName: 'Jordan Studio', handle: 'collab_fan',
    avatarUrl: DEMO_AVATAR_PHOTOS.collab_fan, color: '#059669', initials: 'JS',
    role: 'Beta Member', online: false, stat: '6 posts · 61 votes',
  },
  'videopro_j': {
    displayName: 'Maya Digital', handle: 'videopro_j',
    avatarUrl: DEMO_AVATAR_PHOTOS.videopro_j, color: '#D97706', initials: 'MD',
    role: 'Creator', online: true, stat: '4 posts · 47 votes',
  },
  'markd': {
    displayName: 'Mark Davidson', handle: 'markd',
    avatarUrl: DEMO_AVATAR_PHOTOS.markd, color: '#DC2626', initials: 'MD',
    role: 'Beta Member', online: false, stat: '3 posts · 21 votes',
  },
  'bundlebuilder': {
    displayName: 'Bundle Builder', handle: 'bundlebuilder',
    avatarUrl: DEMO_AVATAR_PHOTOS.bundlebuilder, color: '#0891B2', initials: 'BB',
    role: 'Creator', online: false, stat: '5 posts · 29 votes',
  },
  'noah_maker': {
    displayName: 'Noah Maker', handle: 'noah_maker',
    avatarUrl: DEMO_AVATAR_PHOTOS.noah_maker, color: '#7C3AED', initials: 'NM',
    role: 'Founder', online: true, stat: '8 posts · 53 votes',
  },
  'emma_launch': {
    displayName: 'Emma Launch', handle: 'emma_launch',
    avatarUrl: DEMO_AVATAR_PHOTOS.emma_launch, color: '#e11d48', initials: 'EL',
    role: 'Beta Member', online: true, stat: '5 posts · 38 votes',
  },
  'chloe_store': {
    displayName: 'Chloe Store', handle: 'chloe_store',
    avatarUrl: DEMO_AVATAR_PHOTOS.chloe_store, color: '#0d9488', initials: 'CS',
    role: 'Creator', online: false, stat: '3 posts · 17 votes',
  },
  'ryan_growth': {
    displayName: 'Ryan Growth', handle: 'ryan_growth',
    avatarUrl: DEMO_AVATAR_PHOTOS.ryan_growth, color: '#ea580c', initials: 'RG',
    role: 'Founder', online: true, stat: '7 posts · 62 votes',
  },
}

const ONLINE_MEMBERS = [
  'sarahcreates', 'alexjohnson', 'videopro_j', 'noah_maker', 'emma_launch', 'ryan_growth',
] as const

const TOP_CONTRIBUTORS = [
  { key: 'sarahcreates', posts: 14, votes: 127 },
  { key: 'alexjohnson',  posts: 9,  votes: 84  },
  { key: 'noah_maker',   posts: 8,  votes: 53  },
  { key: 'ryan_growth',  posts: 7,  votes: 62  },
  { key: 'collab_fan',   posts: 6,  votes: 61  },
] as const

const ONLINE_STATS = { weekly: 142 }

// Mock posts — wire to real community posts table when ready
const SEED_POSTS: Post[] = [
  {
    id: 5, category: 'Announcements', pinned: true,
    title: 'Founder Creators Program is live — apply now',
    body: '$0 SellBop platform fees during beta for early creators. Standard Stripe/payment processing fees still apply. Join the program, get the Founder badge on your profile, and help shape what we build next. Limited founding spots available.',
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

// Light-theme category pill colors
const CAT_PILL: Record<PostCategory, string> = {
  'Feature Requests': 'bg-violet-50 text-violet-700 border-violet-200',
  'Wins':             'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Questions':        'bg-blue-50 text-blue-700 border-blue-200',
  'Store Feedback':   'bg-sky-50 text-sky-700 border-sky-200',
  'Announcements':    'bg-amber-50 text-amber-700 border-amber-200',
}

// Light-theme role badge colors
const ROLE_BADGE: Record<string, string> = {
  'Official':    'bg-black text-white',
  'Founder':     'bg-amber-100 text-amber-700 border border-amber-200',
  'Beta Member': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Creator':     'bg-neutral-100 text-neutral-600 border border-neutral-200',
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

// Countdown to end of current week (Sunday 23:59:59).
// Returns null until computed to prevent server/client hydration mismatch.
function useWeekCountdown() {
  const [time, setTime] = useState<{
    days: number; hours: number; minutes: number; seconds: number
  } | null>(null)

  useEffect(() => {
    function compute() {
      const now = new Date()
      const end = new Date(now)
      // Days until Sunday: if today is Sunday use 7 (next Sunday)
      const daysUntilSunday = now.getDay() === 0 ? 7 : 7 - now.getDay()
      end.setDate(now.getDate() + daysUntilSunday)
      end.setHours(23, 59, 59, 999)
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

// ─── Avatar ───────────────────────────────────────────────────────────────────

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
    color: '#a3a3a3',
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
          className={cn('rounded-xl object-cover bg-neutral-100', dimCls)}
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
        <span className={cn('absolute bg-emerald-400 rounded-full border-2 border-white', dotSz)} />
      )}
    </div>
  )
}

// Stacked avatar facepile
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
        <div className="-ml-2.5 w-8 h-8 rounded-xl bg-neutral-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-neutral-600 shadow-sm">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ─── Top Feature Countdown Card ───────────────────────────────────────────────

function CountdownCard({ topPost }: { topPost: Post | undefined }) {
  const time = useWeekCountdown()
  const { days, hours, minutes, seconds } = time ?? { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const isExpired = time !== null && days === 0 && hours === 0 && minutes === 0 && seconds === 0

  return (
    <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white shadow-sm">
      {/* Black header bar */}
      <div className="bg-black px-5 py-3 flex items-center gap-2.5">
        <Trophy size={13} className="text-white/60 shrink-0" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          Top Feature This Week
        </p>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">

          {/* Current leader */}
          {topPost && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                Current leader
              </p>
              <p className="text-base sm:text-lg font-bold text-black leading-snug mb-2">
                {topPost.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-emerald-600">
                  ▲ {topPost.upvotes} votes
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Feature Request
                </span>
              </div>
            </div>
          )}

          {/* Countdown timer */}
          <div className="shrink-0">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wide mb-2.5 flex items-center gap-1">
              <Clock size={9} />
              {isExpired ? 'Voting closed — winner selected' : 'Voting ends in'}
            </p>
            {!isExpired && (
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: days,    label: 'Days' },
                  { val: hours,   label: 'Hrs'  },
                  { val: minutes, label: 'Min'  },
                  { val: seconds, label: 'Sec'  },
                ].map(({ val, label }) => (
                  <div
                    key={label}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl py-2.5 px-1 text-center min-w-[52px]"
                  >
                    {time ? (
                      <p className="text-xl font-black text-black tabular-nums leading-none tracking-tight">
                        {String(val).padStart(2, '0')}
                      </p>
                    ) : (
                      <div className="h-6 bg-neutral-200 rounded animate-pulse mx-1" />
                    )}
                    <p className="text-[9px] text-neutral-400 font-semibold mt-1 uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed mt-4 pt-3 border-t border-neutral-100">
          Each week, the highest-voted feature moves to the top of our roadmap review.
          Vote for what matters most to you.
        </p>
      </div>
    </div>
  )
}

// ─── Top Contributors ─────────────────────────────────────────────────────────

function TopContributorsCard() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-amber-500" />
        <h3 className="text-xs font-bold text-black">Top Contributors</h3>
      </div>
      <div className="space-y-3">
        {TOP_CONTRIBUTORS.map(({ key, posts, votes }, idx) => {
          const p = DEMO_PROFILES[key]
          return (
            <div key={key} className="flex items-center gap-2.5">
              <div className="text-[10px] font-black text-neutral-300 w-4 text-center shrink-0">
                {idx + 1}
              </div>
              <Avatar author={key} size="sm" showOnline />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-black truncate">{p.displayName}</p>
                <p className="text-[10px] text-neutral-400">{posts} posts · {votes} votes</p>
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

// ─── Create Post Modal ────────────────────────────────────────────────────────

function CreatePostModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (post: Post) => void
}) {
  const [title, setTitle]         = useState('')
  const [body, setBody]           = useState('')
  const [link, setLink]           = useState('')
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
        const imgIdx = (name.length % 69) + 1
        DEMO_PROFILES[handle] = {
          displayName: name,
          handle,
          avatarUrl: `https://i.pravatar.cc/150?img=${imgIdx}`,
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
        link: link.trim() || undefined,
        upvotes: 1,
        comments: 0,
        author: handle,
        time: 'just now',
      })
    }, 350)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <h2 className="text-sm font-bold text-black">Create Post</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 overflow-y-auto">

          {/* Your name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Your name
            </label>
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Sarah Creates"
              className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as PostCategory)}
              className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors cursor-pointer"
            >
              {CATEGORIES.slice(1).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={300}
              required
              className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
            <p className="text-right text-[10px] text-neutral-400 mt-1">{title.length}/300</p>
          </div>

          {/* Details */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Details <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Share more detail, context, or ideas..."
              rows={4}
              className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors resize-none"
            />
          </div>

          {/* Optional link */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Link <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-600 hover:text-black hover:border-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="flex-1 h-10 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post, upvoted, count, onUpvote,
}: {
  post: Post; upvoted: boolean; count: number; onUpvote: () => void
}) {
  const profile = DEMO_PROFILES[post.author] ?? {
    displayName: post.author,
    handle: post.author,
    avatarUrl: null,
    color: '#a3a3a3',
    initials: post.author.charAt(0).toUpperCase(),
  }

  return (
    <div className={cn(
      'border rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group bg-white',
      post.pinned
        ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
        : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
    )}>
      <div className="flex gap-3 sm:gap-4">

        {/* Upvote column */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
          <button
            onClick={e => { e.stopPropagation(); onUpvote() }}
            aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
              upvoted
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'hover:bg-neutral-100 text-neutral-400 border border-transparent hover:text-neutral-600',
            )}
          >
            <ChevronUp size={15} strokeWidth={2.5} />
          </button>
          <span className={cn('text-xs font-bold tabular-nums', upvoted ? 'text-emerald-600' : 'text-neutral-500')}>
            {count}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Tags row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-2.5">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <Pin size={8} /> Pinned
              </span>
            )}
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
              CAT_PILL[post.category] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200',
            )}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-[15px] font-semibold text-black leading-snug mb-1.5 group-hover:text-neutral-800 transition-colors">
            {post.title}
          </h3>

          {/* Body preview */}
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed line-clamp-2 mb-3.5">
            {post.body}
          </p>

          {/* Author row */}
          <div className="flex items-center gap-2.5">
            <Avatar author={post.author} size="sm" showOnline />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-black leading-tight">
                  {profile.displayName}
                </span>
                {profile.role && (
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none',
                    ROLE_BADGE[profile.role] ?? 'bg-neutral-100 text-neutral-600',
                  )}>
                    {profile.role}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 leading-tight">
                @{profile.handle} · {post.time}
              </p>
            </div>
            <button className="ml-auto inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors shrink-0">
              <MessageSquare size={11} />
              <span>{post.comments}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  activeCategory,
  setActiveCategory,
  onCreatePost,
}: {
  activeCategory: PostCategory | 'All'
  setActiveCategory: (c: PostCategory | 'All') => void
  onCreatePost: () => void
}) {
  return (
    <div className="space-y-3">

      {/* 1. Founder Creators Program */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="inline-flex items-center gap-1.5 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Beta
        </div>
        <h3 className="text-sm font-bold text-black mb-2">Founder Creators Program</h3>
        <p className="text-xs text-neutral-500 leading-relaxed mb-3">
          $0 SellBop platform fees during beta. Standard Stripe/payment processing fees still apply. Get your Founder badge and help shape the roadmap.
        </p>
        <div className="flex items-center gap-2.5 mb-4">
          <FacePile keys={['sarahcreates', 'alexjohnson', 'noah_maker', 'ryan_growth']} max={4} />
          <p className="text-[11px] text-neutral-500">Founders already inside</p>
        </div>
        <div className="space-y-1.5 mb-4">
          {['$0 SellBop platform fees in beta', 'Founder badge', 'Vote on features'].map(b => (
            <div key={b} className="flex items-center gap-2 text-xs text-neutral-600">
              <Check size={10} className="text-green-500 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>
        <Link
          href="/login?mode=signup"
          className="flex items-center justify-center w-full h-9 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors gap-1.5"
        >
          Join now — it&apos;s free <ArrowRight size={11} />
        </Link>
      </div>

      {/* 2. Top Contributors */}
      <TopContributorsCard />

      {/* 3. About Community */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-black mb-2.5">About Community</h3>
        <ul className="space-y-2">
          {[
            'Request features you want to see',
            'Share wins and milestones',
            'Ask questions and get answers',
            'Help shape the SellBop roadmap',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-xs text-neutral-500">
              <div className="w-1 h-1 bg-neutral-300 rounded-full mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-neutral-400 mt-3">
          Each week the community helps prioritize the next feature to review.
        </p>
      </div>

      {/* 4. Categories */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-black mb-2.5">Categories</h3>
        <div className="space-y-0.5">
          {CATEGORIES.slice(1).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as PostCategory)}
              className={cn(
                'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-black text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-black',
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
        className="w-full h-10 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={13} /> Create Post
      </button>

    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [posts, setPosts]                   = useState<Post[]>(SEED_POSTS)
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'All'>('All')
  const [sort, setSort]                     = useState<Sort>('Top')
  const [upvoted, setUpvoted]               = useState<Set<number>>(new Set())
  const [counts, setCounts]                 = useState<Record<number, number>>(
    Object.fromEntries(SEED_POSTS.map(p => [p.id, p.upvotes])),
  )
  const [showModal, setShowModal]           = useState(false)

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

  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)
  const pinned   = filtered.filter(p => p.pinned)
  const rest     = filtered.filter(p => !p.pinned)
  const sorted   = [...rest].sort((a, b) => {
    if (sort === 'Top')      return (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    if (sort === 'New')      return b.id - a.id
    return ((counts[b.id] ?? 0) + b.comments * 2) - ((counts[a.id] ?? 0) + a.comments * 2)
  })
  const feed = [...pinned, ...sorted]

  return (
    <div className="min-h-screen bg-white pt-14">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">
                SellBop
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-1">
                Community
              </h1>
              <p className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-3">
                Help shape SellBop.
              </p>
              <p className="text-neutral-500 text-sm max-w-md leading-relaxed mb-4">
                Request features, vote on what matters, share wins, ask questions, and help us build
                the best creator store platform.
              </p>
              {/* Facepile + social proof */}
              <div className="flex items-center gap-2.5">
                <FacePile keys={ONLINE_MEMBERS} max={6} />
                <p className="text-xs text-neutral-500">
                  <span className="font-semibold text-black">{ONLINE_STATS.weekly} creators</span>{' '}
                  active this week
                </p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
              >
                <Plus size={13} /> Create Post
              </button>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 h-9 px-4 border border-neutral-200 text-xs font-semibold text-neutral-700 rounded-xl hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
              >
                Join Founder Program
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Prominent countdown card — always visible above the feed */}
        <div className="mb-6">
          <CountdownCard topPost={topFeaturePost} />
        </div>

        <div className="flex gap-6 lg:gap-8 items-start">

          {/* ── Feed ──────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Filter chips + sort */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as PostCategory | 'All')}
                    className={cn(
                      'flex-shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap',
                      activeCategory === cat
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as Sort)}
                className="flex-shrink-0 h-7 pl-2.5 pr-7 rounded-lg text-[11px] font-semibold text-neutral-600 bg-white border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                }}
              >
                {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Post feed */}
            <div className="space-y-2.5">
              {feed.length === 0 ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-14 text-center">
                  <p className="text-neutral-400 text-sm">No posts in this category yet.</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 h-8 px-4 bg-black text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
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
                className="h-8 px-6 border border-neutral-200 rounded-xl text-[11px] font-semibold text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 bg-white transition-colors"
                onClick={() => {}}
              >
                Load more
              </button>
            </div>

          </div>

          {/* ── Sidebar (desktop only) ──────────────────────── */}
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <Sidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onCreatePost={() => setShowModal(true)}
            />
          </div>

        </div>

        {/* Sidebar — stacks below feed on mobile */}
        <div className="mt-6 lg:hidden">
          <Sidebar
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
