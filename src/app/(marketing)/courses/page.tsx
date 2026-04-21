import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCheck, Zap, Users } from 'lucide-react'
import { CourseCard } from '@/components/courses/course-card'
import { CoursePreview } from '@/components/courses/course-preview'
import { SectionHeader } from '@/components/courses/section-header'

export const metadata = {
  title: 'Courses — SellBop.com',
  description: 'Free step-by-step courses on digital products, subscriptions, coaching, storefronts, and AI-powered selling.',
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const FEATURED_COURSES = [
  {
    label: 'Start Here',
    title: 'Launch Your First Digital Product',
    description: 'Go from idea to first sale. Learn how to choose a product, price it, write the page, and publish it on SellBop.',
    level: 'Beginner' as const,
    lessonCount: 8,
    duration: '38 min',
    modules: ['Pick Your Product', 'Price It Right', 'Build the Page', 'Go Live'],
  },
  {
    label: 'Subscriptions',
    title: 'Build a Monthly Subscription Offer',
    description: 'Design a recurring offer your audience stays subscribed to. Learn packaging, pricing, and keeping members happy.',
    level: 'Beginner' as const,
    lessonCount: 6,
    duration: '29 min',
    modules: ['Design the Offer', 'Set the Price', 'Build Retention'],
  },
  {
    label: 'AI Tools',
    title: 'Use AI to Create Your SellBop Store',
    description: 'Use AI prompts to generate your product idea, write your offer copy, and build a storefront that converts.',
    level: 'Beginner' as const,
    lessonCount: 5,
    duration: '22 min',
    modules: ['AI for Ideas', 'AI for Copy', 'AI for Store Bio'],
  },
]

const LEARNING_PATHS = [
  {
    title: 'Start Here',
    description: 'The exact order to go from zero to your first sale.',
    courseCount: 3,
  },
  {
    title: 'Products',
    description: 'Build digital products that people actually want to buy.',
    courseCount: 4,
  },
  {
    title: 'Subscriptions',
    description: 'Create recurring offers and grow your monthly revenue.',
    courseCount: 3,
  },
  {
    title: 'AI Selling',
    description: 'Use AI to create offers, write copy, and launch faster.',
    courseCount: 3,
  },
]

const ALL_COURSES = [
  {
    label: 'Start Here',
    title: 'How to Choose What to Sell',
    description: 'A simple framework for finding your first product based on skills you already have.',
    lessonCount: 4,
    duration: '18 min',
    level: 'Beginner' as const,
  },
  {
    label: 'Products',
    title: 'Pricing Your Digital Product',
    description: 'Stop undercharging. Set a price that reflects your value and converts cold visitors.',
    lessonCount: 5,
    duration: '22 min',
    level: 'Beginner' as const,
  },
  {
    label: 'Coaching',
    title: 'Create a Simple Coaching Offer',
    description: 'Package your expertise into a coaching session or package buyers will happily pay for.',
    lessonCount: 5,
    duration: '24 min',
    level: 'Beginner' as const,
  },
  {
    label: 'Storefront',
    title: 'Build Your Storefront',
    description: 'Set up a SellBop storefront that builds trust and turns profile visits into sales.',
    lessonCount: 6,
    duration: '26 min',
    level: 'Beginner' as const,
  },
  {
    label: 'Copy',
    title: 'Write Product Copy That Converts',
    description: 'The exact structure top creators use to write product pages that sell without selling.',
    lessonCount: 7,
    duration: '31 min',
    level: 'Intermediate' as const,
  },
  {
    label: 'Subscriptions',
    title: 'Start a Membership on SellBop',
    description: 'Build a membership offer your audience will pay for every single month.',
    lessonCount: 6,
    duration: '28 min',
    level: 'Beginner' as const,
  },
  {
    label: 'AI Tools',
    title: 'Use AI to Generate Your Offer',
    description: 'Prompt-by-prompt guide to using AI for offer ideas, names, pricing, and product pages.',
    lessonCount: 5,
    duration: '20 min',
    level: 'Beginner' as const,
  },
  {
    label: 'Launch',
    title: 'Launch Your First Product',
    description: 'The exact steps to go live, share your link, and get your first sale in 24 hours.',
    lessonCount: 5,
    duration: '23 min',
    level: 'Beginner' as const,
  },
]

const PREVIEW_COURSE = {
  courseTitle: 'Launch Your First Digital Product',
  totalLessons: 6,
  totalDuration: '32 min',
  level: 'Beginner',
  free: true,
  modules: [
    {
      number: 1,
      title: 'Pick Your Product',
      lessons: [
        { number: 1, title: 'Choose your niche' },
        { number: 2, title: 'Pick a simple offer' },
      ],
    },
    {
      number: 2,
      title: 'Build the Offer',
      lessons: [
        { number: 3, title: 'Price it right' },
        { number: 4, title: 'Name it clearly' },
      ],
    },
    {
      number: 3,
      title: 'Create the Page',
      lessons: [
        { number: 5, title: 'Write the headline' },
        { number: 6, title: 'Add the CTA' },
      ],
    },
  ],
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-5">
          Free Courses
        </p>
        <h1 className="text-4xl sm:text-6xl font-bold text-black tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto">
          Learn how to build products that sell on SellBop
        </h1>
        <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Free step-by-step courses on digital products, subscriptions, coaching, storefronts, and AI-powered selling.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link href="#featured">
            <span className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-neutral-800 transition-colors">
              Start Learning <ArrowRight size={15} />
            </span>
          </Link>
          <Link href="#all-courses">
            <span className="inline-flex items-center gap-2 border border-neutral-200 text-black text-sm font-semibold px-6 py-3 rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-colors">
              Browse Courses
            </span>
          </Link>
        </div>

        {/* Trust row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          {[
            { icon: <CheckCheck size={14} className="text-emerald-500" />, label: 'Free access' },
            { icon: <Zap size={14} className="text-amber-500" />, label: 'Short lessons' },
            { icon: <Users size={14} className="text-blue-500" />, label: 'Built for creators' },
          ].map(item => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURED COURSES ─────────────────────────────────────────── */}
      <section id="featured" className="border-t border-neutral-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeader eyebrow="Editor's pick" title="Featured Courses" />
          <div className="grid sm:grid-cols-3 gap-5">
            {FEATURED_COURSES.map(course => (
              <CourseCard key={course.title} {...course} featured />
            ))}
          </div>
        </div>
      </section>

      {/* ── LEARNING PATHS ───────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeader eyebrow="Guided collections" title="Learn by Path" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEARNING_PATHS.map(path => (
              <div
                key={path.title}
                className="group bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm hover:border-neutral-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-black">{path.title}</h3>
                  <ArrowRight
                    size={14}
                    className="text-neutral-300 group-hover:text-black transition-colors flex-shrink-0 mt-0.5"
                  />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">{path.description}</p>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  {path.courseCount} courses
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL COURSES ──────────────────────────────────────────────── */}
      <section id="all-courses" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeader eyebrow="Complete catalog" title="All Courses" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_COURSES.map(course => (
              <CourseCard key={course.title} {...course} />
            ))}
          </div>
        </div>
      </section>

      {/* ── COURSE PREVIEW STRIP ─────────────────────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <SectionHeader
            eyebrow="Inside a course"
            title="What a course looks like"
            description="Every course is broken into short modules and quick lessons. No fluff, no filler — just the steps you need."
          />
          <CoursePreview {...PREVIEW_COURSE} />
        </div>
      </section>

      {/* ── AI COURSE CTA ────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="border border-neutral-200 rounded-3xl px-8 py-12 sm:px-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">AI-powered</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black leading-tight">
                Use AI to build faster
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Generate product ideas, pricing, offer copy, and storefront copy in minutes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button className="px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors whitespace-nowrap">
                Try AI Prompts
              </button>
              <Link href="/signup">
                <span className="inline-block px-5 py-2.5 border border-neutral-200 text-black text-sm font-semibold rounded-xl hover:border-neutral-400 hover:bg-neutral-50 transition-colors whitespace-nowrap">
                  Create My Store
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="border-t border-neutral-100 py-24 text-center">
        <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-5">
          <h2 className="text-3xl sm:text-4xl font-bold text-black leading-tight">
            Ready to launch on SellBop?
          </h2>
          <p className="text-neutral-500 text-base">
            Build your store, add your products, and start selling.
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
