'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  Code2,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Megaphone,
  Music2,
  Palette,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Table2,
  TrendingUp,
  Video,
  BarChart3,
  ExternalLink,
} from 'lucide-react'
import { INTEGRATIONS } from '@/lib/resources/defaults'
import type { ResourceBlock, ResourceCardRow, ResourcePageRow } from '@/lib/resources/types'
import { Button } from '@/components/ui/button'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  sparkles: Sparkles,
  'trending-up': TrendingUp,
  megaphone: Megaphone,
  lightbulb: Lightbulb,
  book: BookOpen,
  table: Table2,
  list: ListChecks,
  palette: Palette,
  camera: Camera,
  sliders: SlidersHorizontal,
  music: Music2,
  code: Code2,
  video: Video,
  graduation: GraduationCap,
  chart: BarChart3,
  plus: Plus,
}

function ResourceIcon({ name, size = 22 }: { name?: string | null; size?: number }) {
  const Icon = name ? ICON_MAP[name] ?? Sparkles : Sparkles
  return <Icon size={size} style={{ color: '#00E676' }} />
}

export function ResourceHomeCards({ cards }: { cards: ResourceCardRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(card => (
        <Link
          key={card.id}
          href={card.cta_url ?? '/dashboard/resources'}
          className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-neutral-300 hover:shadow-md transition-all"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(0,230,118,0.12)' }}
          >
            <ResourceIcon name={card.icon} />
          </div>
          <p className="text-xs font-semibold text-neutral-400 mb-1">{card.subtitle}</p>
          <h2 className="text-xl font-bold text-black mb-2">{card.title}</h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-4">{card.description}</p>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-black group-hover:gap-2 transition-all">
            {card.cta_text ?? 'Learn more'} <ArrowRight size={14} />
          </span>
        </Link>
      ))}
    </div>
  )
}

function IntegrationBlock({ blockKey }: { blockKey: string }) {
  const data = INTEGRATIONS[blockKey]
  if (!data) return null

  const isExternal = data.cta_url.startsWith('http')

  return (
    <div id={blockKey} className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 scroll-mt-6">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.image_url}
          alt={data.name}
          className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-2xl font-black text-black">{data.name}</h3>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
              {data.badge}
            </span>
            {data.powered_by && (
              <span className="text-[10px] text-neutral-400">{data.powered_by}</span>
            )}
          </div>
          <p className="text-lg font-bold text-black mb-2">{data.headline}</p>
          <p className="text-sm text-neutral-500 leading-relaxed mb-4">{data.description}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 mb-6 mt-4">
        {data.features.map(f => (
          <div key={f} className="flex items-start gap-2 text-sm text-neutral-600">
            <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            {f}
          </div>
        ))}
      </div>

      {data.prompt && (
        <div className="rounded-xl bg-neutral-900 p-4 mb-6">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">Example Prompt</p>
          <p className="text-sm text-white leading-relaxed">&ldquo;{data.prompt}&rdquo;</p>
        </div>
      )}

      {data.flow && (
        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 mb-6">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-2">How it works</p>
          <p className="text-sm text-neutral-700">{data.flow}</p>
        </div>
      )}

      {data.steps && (
        <div className="mb-6">
          <p className="text-sm font-bold text-black mb-3">{data.steps_title}</p>
          <ol className="space-y-2">
            {data.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-neutral-600">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black"
                  style={{ background: '#00E676' }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {isExternal ? (
        <a href={data.cta_url} target="_blank" rel="noopener noreferrer">
          <Button className="font-bold">
            {data.cta_text} <ExternalLink size={14} />
          </Button>
        </a>
      ) : (
        <Link href={data.cta_url}>
          <Button className="font-bold">{data.cta_text} <ArrowRight size={14} /></Button>
        </Link>
      )}
    </div>
  )
}

function BlockRenderer({ block }: { block: ResourceBlock }) {
  switch (block.type) {
    case 'integration':
      return <IntegrationBlock blockKey={block.key} />

    case 'workflow':
      return (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
          <h3 className="text-2xl font-black text-black text-center mb-8">{block.title}</h3>
          <div className="space-y-4">
            {block.steps.map((step, i) => (
              <div key={step.title}>
                <div className="rounded-xl bg-white border border-neutral-200 p-4">
                  <p className="font-bold text-black mb-1">
                    {i + 1}. {step.title}
                  </p>
                  {step.example && (
                    <p className="text-sm text-neutral-500 italic mb-2">&ldquo;{step.example}&rdquo;</p>
                  )}
                  {step.bullets && (
                    <ul className="flex flex-wrap gap-2 mt-2">
                      {step.bullets.map(b => (
                        <li key={b} className="text-xs bg-neutral-100 rounded-full px-2.5 py-1 text-neutral-600">
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.description && (
                    <p className="text-sm text-neutral-500">{step.description}</p>
                  )}
                </div>
                {i < block.steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight size={16} className="text-neutral-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )

    case 'commission_example':
      return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-lg font-bold text-black mb-4">Choose Your Commission</h3>
          <div className="grid sm:grid-cols-3 gap-4 mb-3">
            <div className="rounded-xl bg-neutral-50 p-4 text-center">
              <p className="text-xs text-neutral-400 mb-1">Product Price</p>
              <p className="text-2xl font-black text-black">{block.price}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 text-center">
              <p className="text-xs text-neutral-400 mb-1">Affiliate Commission</p>
              <p className="text-2xl font-black" style={{ color: '#00E676' }}>{block.percent}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4 text-center">
              <p className="text-xs text-neutral-400 mb-1">Affiliate Earns</p>
              <p className="text-2xl font-black" style={{ color: '#00E676' }}>{block.earns}</p>
            </div>
          </div>
          {block.note && <p className="text-xs text-neutral-400">{block.note}</p>}
        </div>
      )

    case 'steps':
      return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-lg font-bold text-black mb-4">{block.title}</h3>
          <ol className="space-y-2">
            {block.items.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm text-neutral-600">
                <span className="font-bold text-black">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )

    case 'text':
      return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          {block.title && <h3 className="text-lg font-bold text-black mb-2">{block.title}</h3>}
          {block.body && <p className="text-sm text-neutral-600 leading-relaxed">{block.body}</p>}
        </div>
      )

    case 'channels':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map(item => (
            <div key={item.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-bold text-black mb-1">{item.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      )

    case 'product_categories':
      return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {block.categories.map(cat => (
            <div key={cat.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(0,230,118,0.12)' }}
              >
                <ResourceIcon name={cat.icon} size={18} />
              </div>
              <h3 className="font-bold text-black mb-1">{cat.title}</h3>
              <p className="text-sm text-neutral-500">{cat.description}</p>
            </div>
          ))}
        </div>
      )

    case 'prompts_list':
      return (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <h3 className="text-lg font-bold text-black mb-4">{block.title}</h3>
          <div className="space-y-3 mb-6">
            {block.prompts.map(p => (
              <div key={p} className="rounded-xl bg-white border border-neutral-200 p-4 text-sm text-neutral-600 italic">
                &ldquo;{p}&rdquo;
              </div>
            ))}
          </div>
          {block.cta_url && (
            <Link href={block.cta_url}>
              <Button>{block.cta_text ?? 'Get Started'} <ArrowRight size={14} /></Button>
            </Link>
          )}
        </div>
      )

    case 'cta':
      return (
        <div>
          <Link href={block.url}>
            <Button size="lg" variant={block.variant === 'secondary' ? 'secondary' : 'primary'}>
              {block.text} <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )

    default:
      return null
  }
}

export function ResourcePageView({ page }: { page: ResourcePageRow }) {
  const blocks = page.content_json?.blocks ?? []

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  )
}

export function ResourcePageHeader({ page }: { page: ResourcePageRow }) {
  return (
    <div className="mb-8">
      <Link
        href="/dashboard/resources"
        className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-black mb-4 transition-colors"
      >
        ← Resources
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-black">{page.title}</h1>
      {page.subtitle && (
        <p className="mt-2 text-sm sm:text-base text-neutral-500 max-w-2xl leading-relaxed">{page.subtitle}</p>
      )}
    </div>
  )
}
