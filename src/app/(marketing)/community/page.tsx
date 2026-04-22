'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronUp, MessageSquare, ArrowRight, Pin, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────
// Demo data — structured for easy swap-in of real data later
// ─────────────────────────────────────────────────────────────

type PostCategory = 'Feature Requests' | 'Wins' | 'Questions' | 'Store Feedback' | 'Announcements'

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
}

const DEMO_POSTS: Post[] = [
  {
    id: 5,
    category: 'Announcements',
    title: 'Founder Creators Program is live — apply now',
    body: '$0 platform fees during beta for early creators. Join the program, get the Founder badge on your profile, and help shape what we build next. Limited founding spots available.',
    upvotes: 156,
    comments: 42,
    author: 'SellBop',
    time: '2d ago',
    pinned: true,
  },
  {
    id: 1,
    category: 'Feature Requests',
    title: 'Add custom domain support for creator stores',
    body: 'Would love to connect my own domain like shop.myname.com to my SellBop store. This would make it feel way more professional for buyers and help with SEO.',
    upvotes: 47,
    comments: 12,
    author: 'alexjohnson',
    time: '2h ago',
  },
  {
    id: 2,
    category: 'Wins',
    title: 'My first 10 sales on SellBop 🎉',
    body: 'Hit 10 sales this week selling my digital art bundle. The checkout flow is so clean — buyers compliment it every time. Worth every minute setting this up.',
    upvotes: 93,
    comments: 28,
    author: 'sarahcreates',
    time: '5h ago',
  },
  {
    id: 7,
    category: 'Questions',
    title: 'Community idea: creator collabs board',
    body: 'What if there was a section where creators could post looking for collab partners? Like a SellBop-native collab matching board. Anyone else want this?',
    upvotes: 61,
    comments: 19,
    author: 'collab_fan',
    time: '4d ago',
  },
  {
    id: 4,
    category: 'Feature Requests',
    title: 'Should featured products support video previews?',
    body: 'For digital creators, a short video preview in the product card would massively increase conversion. I know Gumroad has this — would SellBop consider it?',
    upvotes: 38,
    comments: 9,
    author: 'videopro_j',
    time: '1d ago',
  },
  {
    id: 3,
    category: 'Store Feedback',
    title: 'Feedback on my storefront layout — looking for advice',
    body: 'Just launched my store and wanted some eyes on the layout. Not sure if featured products should be at the top or after the header section. What do you all think?',
    upvotes: 21,
    comments: 14,
    author: 'markd',
    time: '8h ago',
  },
  {
    id: 6,
    category: 'Feature Requests',
    title: 'Add product bundles to homepage sections',
    body: 'Being able to group products into a bundle directly from the store editor would be a game changer. Right now I have to create a separate bundle product manually.',
    upvotes: 29,
    comments: 7,
    author: 'bundlebuilder',
    time: '3d ago',
  },
]

const CATEGORIES: (PostCategory | 'All')[] = [
  'All',
  'Feature Requests',
  'Wins',
  'Questions',
  'Store Feedback',
  'Announcements',
]

const SORTS = ['Top', 'New', 'Trending'] as const
type Sort = typeof SORTS[number]

const CAT_PILL: Record<PostCategory, string> = {
  'Feature Requests': 'bg-violet-100 text-violet-700 border-violet-200',
  'Wins':             'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Questions':        'bg-blue-100 text-blue-700 border-blue-200',
  'Store Feedback':   'bg-sky-100 text-sky-700 border-sky-200',
  'Announcements':    'bg-amber-100 text-amber-700 border-amber-200',
}

const ABOUT_ITEMS = [
  'Request features you want to see',
  'Share wins and milestones',
  'Ask questions and get answers',
  'Help shape the SellBop roadmap',
]

// ─────────────────────────────────────────────────────────────
// Post card
// ─────────────────────────────────────────────────────────────

function PostCard({
  post,
  upvoted,
  count,
  onUpvote,
}: {
  post: Post
  upvoted: boolean
  count: number
  onUpvote: () => void
}) {
  return (
    <div className={cn(
      'bg-white border rounded-xl p-4 sm:p-5 transition-all hover:shadow-sm',
      post.pinned ? 'border-amber-200 bg-amber-50/30' : 'border-neutral-200 hover:border-neutral-300',
    )}>
      <div className="flex gap-3 sm:gap-4">

        {/* Upvote column */}
        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={onUpvote}
            aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              upvoted
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'hover:bg-neutral-100 text-neutral-400 border border-transparent',
            )}
          >
            <ChevronUp size={15} strokeWidth={2.5} />
          </button>
          <span className={cn(
            'text-xs font-bold tabular-nums',
            upvoted ? 'text-emerald-600' : 'text-neutral-600',
          )}>
            {count}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Tags row */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <Pin size={9} /> Pinned
              </span>
            )}
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border',
              CAT_PILL[post.category] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200',
            )}>
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-semibold text-black leading-snug mb-1.5">
            {post.title}
          </h3>

          {/* Body preview */}
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed line-clamp-2">
            {post.body}
          </p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-3 mt-3 text-[11px] text-neutral-400">
            <span className="font-medium text-neutral-500">
              {post.author === 'SellBop' ? (
                <span className="inline-flex items-center gap-1 text-black font-bold">
                  SellBop
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-bold">OFFICIAL</span>
                </span>
              ) : (
                `u/${post.author}`
              )}
            </span>
            <span>{post.time}</span>
            <button className="inline-flex items-center gap-1 hover:text-neutral-600 transition-colors">
              <MessageSquare size={11} />
              <span>{post.comments} comments</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Right sidebar
// ─────────────────────────────────────────────────────────────

function Sidebar({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: PostCategory | 'All'
  setActiveCategory: (c: PostCategory | 'All') => void
}) {
  return (
    <div className="space-y-4">

      {/* Founder Creators Program */}
      <div className="bg-neutral-950 rounded-xl p-5 text-white">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          Beta
        </div>
        <h3 className="text-sm font-bold mb-2">Founder Creators Program</h3>
        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          $0 platform fees during beta. Get your Founder badge and help shape the roadmap.
        </p>
        <div className="space-y-1.5 mb-4">
          {['$0 platform fees', 'Founder badge', 'Vote on features'].map(b => (
            <div key={b} className="flex items-center gap-2 text-xs text-neutral-300">
              <Check size={10} className="text-green-400 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>
        <Link
          href="/login?mode=signup"
          className="flex items-center justify-center w-full h-9 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-100 transition-colors gap-1.5"
        >
          Join now — it&apos;s free <ArrowRight size={11} />
        </Link>
      </div>

      {/* About Community */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-black mb-3">About Community</h3>
        <ul className="space-y-2.5">
          {ABOUT_ITEMS.map(item => (
            <li key={item} className="flex items-start gap-2 text-xs text-neutral-600">
              <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full mt-1 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Popular Categories */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-black mb-3">Categories</h3>
        <div className="space-y-1">
          {CATEGORIES.slice(1).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as PostCategory)}
              className={cn(
                'w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-black',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState<PostCategory | 'All'>('All')
  const [sort, setSort] = useState<Sort>('Top')
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set())
  const [counts, setCounts] = useState<Record<number, number>>(
    Object.fromEntries(DEMO_POSTS.map(p => [p.id, p.upvotes])),
  )

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

  // Filter
  const filtered =
    activeCategory === 'All'
      ? DEMO_POSTS
      : DEMO_POSTS.filter(p => p.category === activeCategory)

  // Sort (pinned posts always float to top)
  const pinned = filtered.filter(p => p.pinned)
  const rest   = filtered.filter(p => !p.pinned)
  const sortedRest = [...rest].sort((a, b) => {
    if (sort === 'Top')      return counts[b.id] - counts[a.id]
    if (sort === 'New')      return b.id - a.id
    // Trending: upvotes + comment weight
    return (counts[b.id] + b.comments * 2) - (counts[a.id] + a.comments * 2)
  })
  const posts = [...pinned, ...sortedRest]

  return (
    <div className="min-h-screen bg-neutral-50 pt-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Community header ─────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-400 mb-2">
                SellBop
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                Community
              </h1>
              <p className="text-neutral-500 text-sm sm:text-base mt-1.5">
                Creators helping shape the future of SellBop.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-black text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors"
                onClick={() => alert('Post creation coming soon — sign up to join the community.')}
              >
                <Plus size={13} /> Create Post
              </button>
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center gap-1.5 h-9 px-4 border border-neutral-200 text-xs font-semibold text-neutral-700 rounded-lg hover:bg-white hover:border-neutral-400 transition-colors"
              >
                Join Founder Program
              </Link>
            </div>
          </div>
        </div>

        {/* ── Main layout: feed + sidebar ───────────────────── */}
        <div className="flex gap-6 lg:gap-8 items-start">

          {/* ── Feed ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Filter bar */}
            <div className="flex items-center justify-between gap-4 mb-5">
              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 flex-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat as PostCategory | 'All')}
                    className={cn(
                      'flex-shrink-0 h-7 px-3 rounded-full text-[11px] font-semibold transition-colors whitespace-nowrap',
                      activeCategory === cat
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black',
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort dropdown */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value as Sort)}
                className="flex-shrink-0 h-7 pl-2.5 pr-6 rounded-lg text-[11px] font-semibold text-neutral-600 bg-white border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
              >
                {SORTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl px-6 py-12 text-center">
                  <p className="text-neutral-400 text-sm">No posts in this category yet.</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    upvoted={upvoted.has(post.id)}
                    count={counts[post.id]}
                    onUpvote={() => toggleUpvote(post.id)}
                  />
                ))
              )}
            </div>

            {/* Load more placeholder */}
            <div className="mt-6 text-center">
              <button
                className="h-9 px-6 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-500 hover:border-neutral-400 hover:text-black bg-white transition-colors"
                onClick={() => alert('More posts coming soon.')}
              >
                Load more
              </button>
            </div>

          </div>

          {/* ── Sidebar (desktop only) ───────────────────── */}
          <div className="hidden lg:block w-72 xl:w-80 shrink-0">
            <Sidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </div>

        </div>

        {/* ── Mobile sidebar cards (below feed) ────────────── */}
        <div className="mt-8 lg:hidden">
          <Sidebar
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

      </div>
    </div>
  )
}
