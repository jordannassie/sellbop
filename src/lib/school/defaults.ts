import type { SchoolCategory, SchoolLesson, SchoolSection } from './types'
import { normalizeLesson, youtubeWatchUrl } from './utils'

const lessons: SchoolLesson[] = [
  {
    id: 'how-digital-product-business-works',
    title: 'How the Digital Product Business Works',
    original_video_title: 'I Made $32.7 Million Selling Simple Digital Products (Full Breakdown)',
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('RxypuPGBRPI'),
    youtube_video_id: 'RxypuPGBRPI',
    thumbnail_url: null,
    duration: '45 min',
    categories: ['start-here', 'sell-it'],
    description:
      'See how a simple digital-product business works, what makes products sell, and why digital products can be such a powerful online business model.',
    why_recommend:
      'Richard Yu breaks down the full digital product model from zero to scale — margins, product types, traffic, and why this business model works for beginners.',
    featured: true,
    sort_order: 1,
    published: true,
    section_id: 'start-here',
  },
  {
    id: 'complete-digital-product-roadmap',
    title: 'The Complete Digital Product Roadmap',
    original_video_title: 'FULL COURSE: How to Build & Sell Digital Products With AI (Step by Step)',
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('gjffmgucDSw'),
    youtube_video_id: 'gjffmgucDSw',
    thumbnail_url: null,
    duration: '1 hr+',
    categories: ['start-here', 'create-it', 'ai'],
    description:
      'A step-by-step roadmap for building and selling digital products with AI — from idea to launch.',
    why_recommend:
      'This is one of the most complete free walkthroughs for building a digital product business with modern AI tools.',
    featured: false,
    sort_order: 2,
    published: true,
    section_id: 'start-here',
  },
  {
    id: 'successful-digital-products-common',
    title: 'What Successful Digital Products Have in Common',
    original_video_title: '1,000 Hours of Studying the Best Digital Product Businesses in 24 Minutes',
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('cv0y7oCllek'),
    youtube_video_id: 'cv0y7oCllek',
    thumbnail_url: null,
    duration: '24 min',
    categories: ['start-here', 'find-product', 'sell-it', 'marketing'],
    description:
      'Patterns Richard Yu found after studying hundreds of successful digital product businesses.',
    why_recommend:
      'Distills over 1,000 hours of research into practical lessons on offers, pricing, funnels, and what actually drives sales.',
    featured: false,
    sort_order: 3,
    published: true,
    section_id: 'start-here',
  },
  {
    id: 'build-product-from-zero',
    title: 'Build Your Product From Zero',
    original_video_title: "How I'd Build a Digital Product From Scratch (After Making $32M+)",
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('kxg_sn2vJm8'),
    youtube_video_id: 'kxg_sn2vJm8',
    thumbnail_url: null,
    duration: '25 min',
    categories: ['find-product', 'create-it', 'ai'],
    description:
      'If Richard Yu had to start over today, this is exactly how he would find demand and build a product from scratch.',
    why_recommend:
      'Great for beginners who want a realistic playbook — niche selection, validation, AI-assisted creation, and launch.',
    featured: false,
    sort_order: 4,
    published: true,
    section_id: 'find-product',
  },
  {
    id: 'ai-create-product-faster',
    title: 'Use AI to Create Your Product Faster',
    original_video_title: 'How To Use AI To Make Money With Digital Products (Full Guide)',
    creator: 'Tanner Chidester',
    youtube_url: youtubeWatchUrl('S7y352O_k2E'),
    youtube_video_id: 'S7y352O_k2E',
    thumbnail_url: null,
    duration: '18 min',
    categories: ['create-it', 'ai'],
    description:
      'How to use AI tools to research ideas, create digital products, and package them into offers people want to buy.',
    why_recommend:
      'Tanner Chidester shows which AI tools actually help with product creation — and how to avoid generic, unsellable output.',
    featured: false,
    sort_order: 5,
    published: true,
    section_id: 'create-it',
  },
  {
    id: 'building-digital-products-claude',
    title: 'Building Digital Products With Claude',
    original_video_title: 'I Tried Using Claude AI To Make Money Online in 90 Days',
    creator: 'Tanner Chidester',
    youtube_url: youtubeWatchUrl('CoqJ6kwbjus'),
    youtube_video_id: 'CoqJ6kwbjus',
    thumbnail_url: null,
    duration: '30 min',
    categories: ['create-it', 'ai'],
    description:
      'A 90-day experiment using Claude AI to build and sell digital products — what worked, what did not, and why.',
    why_recommend:
      'Practical test results from using Claude for product ideas, content, packaging, and sales — not just theory.',
    featured: false,
    sort_order: 6,
    published: true,
    section_id: 'create-it',
  },
  {
    id: 'power-of-one-great-product',
    title: 'The Power of One Great Product',
    original_video_title: 'How 1 Digital Product Made Me $141M (And How You Can Do It Too)',
    creator: 'Tanner Chidester',
    youtube_url: youtubeWatchUrl('dHpIKpEP9IA'),
    youtube_video_id: 'dHpIKpEP9IA',
    thumbnail_url: null,
    duration: '22 min',
    categories: ['sell-it', 'marketing'],
    description:
      'Why one focused, well-positioned product can outperform a scattered catalog — and how pricing changes everything.',
    why_recommend:
      'Tanner Chidester explains how shifting from low-ticket to high-ticket offers transformed his business.',
    featured: false,
    sort_order: 7,
    published: true,
    section_id: 'sell-it',
  },
  {
    id: 'breaking-down-winning-product',
    title: 'Breaking Down a Winning Digital Product',
    original_video_title: 'How I Made $11K a Day With 1 Digital Product (Full Breakdown)',
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('NXCGICQIE6U'),
    youtube_video_id: 'NXCGICQIE6U',
    thumbnail_url: null,
    duration: '20 min',
    categories: ['sell-it', 'marketing'],
    description:
      'A full breakdown of one digital product that generated $11K per day — offer, positioning, and distribution.',
    why_recommend:
      'Shows what a winning product looks like in practice: niche, promise, funnel, and why simplicity wins.',
    featured: false,
    sort_order: 8,
    published: true,
    section_id: 'sell-it',
  },
  {
    id: 'simple-pdf-business-model',
    title: 'The Simple PDF Business Model',
    original_video_title: 'I Made $27 Million Selling Simple Digital Products (Step by Step)',
    creator: 'Richard Yu',
    youtube_url: youtubeWatchUrl('JpNOwmwbf2s'),
    youtube_video_id: 'JpNOwmwbf2s',
    thumbnail_url: null,
    duration: '28 min',
    categories: ['sell-it', 'create-it'],
    description:
      'How simple PDFs, guides, and templates become real businesses — step by step from idea to sales.',
    why_recommend:
      'Perfect if you want to start with a simple, low-complexity product format before building something bigger.',
    featured: false,
    sort_order: 9,
    published: true,
    section_id: 'sell-it',
  },
  {
    id: 'recreate-winning-product-with-ai',
    title: 'Recreate a Winning Product With AI',
    original_video_title:
      '$354,000 from ONE Digital Product??? Watch me Recreate it with AI in Minutes!',
    creator: 'Make Money with Stacy La',
    youtube_url: youtubeWatchUrl('ju7zG9bdhv4'),
    youtube_video_id: 'ju7zG9bdhv4',
    thumbnail_url: null,
    duration: '15 min',
    categories: ['create-it', 'ai', 'sell-it'] satisfies SchoolCategory[],
    description:
      'Watch a real high-performing digital product get recreated step by step using AI — from research to a sellable offer.',
    why_recommend:
      'Stacy La breaks down a product that generated hundreds of thousands in sales and shows how modern AI tools can speed up the creation process.',
    featured: false,
    sort_order: 10,
    published: true,
    section_id: 'create-it',
  },
]

export const DEFAULT_SCHOOL_LESSONS: SchoolLesson[] = lessons.map(normalizeLesson)

export const SCHOOL_SECTIONS: SchoolSection[] = [
  {
    id: 'start-here',
    heading: 'Start Here',
    description: 'Understand the digital-product opportunity before you build anything.',
    lessonIds: ['how-digital-product-business-works', 'complete-digital-product-roadmap', 'successful-digital-products-common'],
  },
  {
    id: 'find-product',
    heading: 'Find Something People Want',
    description: "Don't build first and hope people buy it. Start with demand.",
    lessonIds: ['build-product-from-zero', 'successful-digital-products-common'],
  },
  {
    id: 'create-it',
    heading: 'Create Your Product Faster',
    description: 'Use AI to turn a useful idea into a real product without spending weeks building it.',
    lessonIds: ['ai-create-product-faster', 'building-digital-products-claude', 'complete-digital-product-roadmap', 'recreate-winning-product-with-ai'],
  },
  {
    id: 'sell-it',
    heading: 'Build Something Worth Selling',
    lessonIds: ['power-of-one-great-product', 'breaking-down-winning-product', 'simple-pdf-business-model'],
  },
]

export function getFeaturedLesson(lessonsList: SchoolLesson[] = DEFAULT_SCHOOL_LESSONS): SchoolLesson {
  return (
    lessonsList.find(l => l.featured && l.published) ??
    lessonsList.find(l => l.published) ??
    DEFAULT_SCHOOL_LESSONS[0]
  )
}

export function getLessonById(id: string, lessonsList: SchoolLesson[] = DEFAULT_SCHOOL_LESSONS): SchoolLesson | null {
  return lessonsList.find(l => l.id === id && l.published) ?? null
}
