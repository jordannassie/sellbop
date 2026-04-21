import Link from 'next/link'
import {
  BookOpen, Lightbulb, ShoppingBag, Repeat, Sparkles,
  Layout, Tag, Mic2, Globe, FileText, Rocket, Bot,
  ArrowRight,
} from 'lucide-react'
import { PathCard } from '@/components/university/path-card'
import { CategoryCard } from '@/components/university/category-card'
import { LessonCard } from '@/components/university/lesson-card'

export const metadata = {
  title: 'University — SellBop.com',
  description: 'Free training to help creators build products, offers, and storefronts that sell.',
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const PATHS = [
  {
    title: 'Launch Your First Digital Product',
    description: 'Pick the right product, price it correctly, write a great page, and hit publish. Everything you need to go from idea to first sale.',
    lessonCount: 8,
    level: 'Beginner' as const,
    icon: <Rocket size={18} />,
  },
  {
    title: 'Start a Monthly Subscription',
    description: 'Learn how to design, price, and sell a recurring subscription your audience will stick with month after month.',
    lessonCount: 6,
    level: 'Beginner' as const,
    icon: <Repeat size={18} />,
  },
  {
    title: 'Use AI to Build Your SellBop Page',
    description: 'Generate product ideas, write your offer description, and polish your storefront bio using AI prompts built for creators.',
    lessonCount: 5,
    level: 'Beginner' as const,
    icon: <Bot size={18} />,
  },
]

const CATEGORIES = [
  { title: 'Start Here', description: 'Everything you need to launch your first product.', lessonCount: 6, icon: <Rocket size={15} /> },
  { title: 'Products', description: 'Build digital products people actually buy.', lessonCount: 12, icon: <FileText size={15} /> },
  { title: 'Subscriptions', description: 'Create recurring offers that grow over time.', lessonCount: 8, icon: <Repeat size={15} /> },
  { title: 'Coaching', description: 'Package and sell your expertise and time.', lessonCount: 7, icon: <Mic2 size={15} /> },
  { title: 'Storefront', description: 'Design a store that converts visitors to buyers.', lessonCount: 9, icon: <Globe size={15} /> },
  { title: 'Copy & Conversion', description: 'Write headlines, descriptions, and CTAs that sell.', lessonCount: 10, icon: <Tag size={15} /> },
  { title: 'AI Tools', description: 'Use AI to build faster and write better offers.', lessonCount: 6, icon: <Sparkles size={15} /> },
  { title: 'Launch', description: 'Get your first sale and build momentum from day one.', lessonCount: 5, icon: <Layout size={15} /> },
]

const LESSONS = [
  {
    category: 'Start Here',
    title: 'How to Choose What to Sell',
    description: 'A simple framework for picking your first product based on what you already know.',
    duration: '5 min',
  },
  {
    category: 'Products',
    title: 'How to Price a Digital Product',
    description: 'Stop undercharging. Learn how to set a price that reflects your value and converts.',
    duration: '6 min',
  },
  {
    category: 'Copy & Conversion',
    title: 'How to Write a Better Product Description',
    description: 'The exact structure top creators use to turn a bland description into a must-buy.',
    duration: '7 min',
  },
  {
    category: 'Subscriptions',
    title: 'How to Set Up a Subscription Offer',
    description: 'What to include, how to price it monthly, and how to keep your subscribers happy.',
    duration: '5 min',
  },
  {
    category: 'AI Tools',
    title: 'Use AI to Write Your Store Bio',
    description: 'A prompt-by-prompt guide to writing a storefront bio that builds trust instantly.',
    duration: '4 min',
  },
  {
    category: 'Launch',
    title: 'Build a Better SellBop Product Page',
    description: 'The layout, copy order, and design choices that help your page convert from day one.',
    duration: '8 min',
  },
]

const VALUE_CARDS = [
  { icon: <Lightbulb size={18} />, title: 'What to Sell', desc: 'Find the right product idea for your audience and skills.' },
  { icon: <ShoppingBag size={18} />, title: 'Build Your Offer', desc: 'Package your knowledge into a clear, compelling offer.' },
  { icon: <Globe size={18} />, title: 'Set Up Your Store', desc: 'Launch a beautiful storefront that builds trust instantly.' },
  { icon: <Sparkles size={18} />, title: 'Use AI to Sell Faster', desc: 'Generate ideas, copy, and pages in minutes with AI.' },
]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UniversityPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-5">Free Training</p>
        <h1 className="text-4xl sm:text-6xl font-bold text-black tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
          Learn how to create products people buy on SellBop
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Free step-by-step training to help creators build digital products, subscriptions, coaching offers, and better storefronts using AI.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="#paths">
            <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors">
              Start Learning <ArrowRight size={15} />
            </span>
          </Link>
          <Link href="#lessons">
            <span className="inline-flex items-center gap-2 border border-neutral-200 text-black text-sm font-semibold px-6 py-3 rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
              Browse Courses
            </span>
          </Link>
        </div>
      </section>

      {/* ── QUICK VALUE CARDS ────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUE_CARDS.map(card => (
              <div key={card.title} className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm hover:border-neutral-300 transition-all">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-black mb-4">
                  {card.icon}
                </div>
                <p className="font-semibold text-black text-sm mb-1">{card.title}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PATHS ───────────────────────────────────────────── */}
      <section id="paths" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-2">Start here</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Guided learning paths</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {PATHS.map(path => (
              <PathCard key={path.title} {...path} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-2">Browse by topic</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Course categories</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat.title} {...cat} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LESSONS ─────────────────────────────────────────── */}
      <section id="lessons" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-2">Featured</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Popular lessons</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LESSONS.map(lesson => (
              <LessonCard key={lesson.title} {...lesson} />
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ACTION STRIP ──────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-black rounded-3xl px-8 py-12 sm:px-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">AI-powered</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Let AI help you build faster
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Generate product ideas, offers, pricing, and page copy in minutes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors whitespace-nowrap">
                Try AI Prompts
              </button>
              <Link href="/signup">
                <span className="inline-block px-5 py-2.5 border border-neutral-600 text-white text-sm font-semibold rounded-xl hover:border-neutral-400 hover:bg-white/10 transition-colors whitespace-nowrap">
                  Create My Store
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center mx-auto">
            <BookOpen size={20} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-black leading-tight">
            Ready to sell on SellBop?
          </h2>
          <p className="text-neutral-500 text-base">
            Build your page, add your products, and start selling.
          </p>
          <Link href="/signup">
            <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-7 py-3.5 rounded-xl hover:bg-neutral-800 transition-colors mt-2">
              Start Free <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>

    </div>
  )
}
