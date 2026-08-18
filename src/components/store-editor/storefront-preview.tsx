'use client'
import Link from 'next/link'
import { Globe } from 'lucide-react'
import { ProductCardImage } from '@/components/product/product-card-image'
import { SellBopLogo } from '@/components/ui/sellbop-logo'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Storefront, Product } from '@/lib/domain/entities'

// ── Social Icons ─────────────────────────────────────────────
function TwitterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YouTubeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const TYPE_LABELS: Record<string, string> = {
  digital_download: 'Digital', service_offer: 'Service',
  subscription: 'Subscription', bundle: 'Bundle', membership_ready: 'Membership',
}

// ── Button Style ──────────────────────────────────────────────
function buttonClass(style: Storefront['buttonStyle'], color: string): string {
  const base = 'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all'
  const radius = style === 'rounded' ? 'rounded-lg' : style === 'soft_rounded' ? 'rounded-full' : 'rounded-none'
  return cn(base, radius)
}

// ── Product Card ──────────────────────────────────────────────
function PreviewProductCard({
  product, cardStyle, buttonStyle, themeColor, density,
}: {
  product: Product
  cardStyle: Storefront['cardStyle']
  buttonStyle: Storefront['buttonStyle']
  themeColor: string
  density: Storefront['cardDensity']
}) {
  const cardBase = 'bg-white overflow-hidden group transition-all'
  const cardBorder =
    cardStyle === 'minimal' ? 'border border-neutral-100 rounded-xl' :
    cardStyle === 'soft_shadow' ? 'border border-neutral-200 rounded-xl shadow-sm hover:shadow-md' :
    'border-2 border-neutral-200 rounded-xl hover:border-neutral-400'

  const pad = density === 'compact' ? 'p-3' : density === 'large' ? 'p-5' : 'p-4'

  return (
    <div className={cn(cardBase, cardBorder)}>
      <ProductCardImage src={product.thumbnailUrl} alt={product.name} />
      <div className={pad}>
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
          {TYPE_LABELS[product.productType]}
        </span>
        <p className={cn(
          'font-semibold text-black leading-tight mt-0.5',
          density === 'compact' ? 'text-xs' : density === 'large' ? 'text-base' : 'text-sm',
        )}>
          {product.name}
        </p>
        {density !== 'compact' && product.shortDescription && (
          <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-black text-sm">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          {density === 'large' && (
            <span
              className={buttonClass(buttonStyle, themeColor)}
              style={{ backgroundColor: themeColor, fontSize: '11px', padding: '5px 12px' }}
            >
              {product.ctaText}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Preview Component ────────────────────────────────────
interface StorefrontPreviewProps {
  config: Storefront
  products: Product[]
  /** When true, renders as a link-able public page (no scale, full width). */
  isPublic?: boolean
}

export function StorefrontPreview({ config, products, isPublic = false }: StorefrontPreviewProps) {
  // Resolve product ordering and filtering
  const orderMap = new Map(config.productOrder.map((id, i) => [id, i]))
  const published = products
    .filter(p => p.status === 'published' && !config.hiddenProductIds.includes(p.id))
    .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))

  const featured = published.filter(p => config.featuredProductIds.includes(p.id))
  const rest = published.filter(p => !config.featuredProductIds.includes(p.id))

  const gridCols = 'grid grid-cols-2 lg:grid-cols-3 gap-3'

  // Section renderers
  function renderHeader() {
    if (config.headerLayout === 'centered') {
      return (
        <div className="border-b border-neutral-100 py-8">
          <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
              style={{ backgroundColor: config.themeColor }}
            >
              {config.title.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">{config.title}</h1>
              {config.headline && <p className="text-sm text-neutral-500 mt-0.5">{config.headline}</p>}
              {config.bio && (
                <p className="text-xs text-neutral-600 mt-2 max-w-sm mx-auto leading-relaxed">{config.bio}</p>
              )}
            </div>
            <SocialRow config={config} />
          </div>
        </div>
      )
    }

    if (config.headerLayout === 'banner_avatar') {
      return (
        <div className="border-b border-neutral-100">
          <div
            className="h-20 w-full"
            style={{ backgroundColor: config.themeColor + '22' }}
          />
          <div className="max-w-4xl mx-auto px-4 pb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md -mt-8 border-2 border-white"
              style={{ backgroundColor: config.themeColor }}
            >
              {config.title.charAt(0)}
            </div>
            <div className="mt-3">
              <h1 className="text-xl font-bold text-black">{config.title}</h1>
              {config.headline && <p className="text-sm text-neutral-500 mt-0.5">{config.headline}</p>}
              {config.bio && (
                <p className="text-xs text-neutral-600 mt-2 max-w-sm leading-relaxed">{config.bio}</p>
              )}
              <SocialRow config={config} />
            </div>
          </div>
        </div>
      )
    }

    // left_avatar (default)
    return (
      <div className="border-b border-neutral-100 py-6">
        <div className="max-w-4xl mx-auto px-4 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold shadow-sm"
            style={{ backgroundColor: config.themeColor }}
          >
            {config.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-black">{config.title}</h1>
            {config.headline && <p className="text-xs text-neutral-500 mt-0.5">{config.headline}</p>}
            {config.bio && (
              <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed line-clamp-3">{config.bio}</p>
            )}
            <SocialRow config={config} />
          </div>
        </div>
      </div>
    )
  }

  function renderSection(id: string) {
    if (!config.sectionVisibility[id]) return null
    switch (id) {
      case 'header':
        return <div key="header">{renderHeader()}</div>

      case 'featured':
        if (featured.length === 0) return null
        return (
          <div key="featured" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Featured</p>
            <div className={gridCols}>
              {featured.map(p => (
                <PreviewProductCard
                  key={p.id} product={p}
                  cardStyle={config.cardStyle}
                  buttonStyle={config.buttonStyle}
                  themeColor={config.themeColor}
                  density={config.cardDensity}
                />
              ))}
            </div>
          </div>
        )

      case 'all_products':
        if (rest.length === 0) return null
        return (
          <div key="all_products" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">All Products</p>
            <div className={gridCols}>
              {rest.map(p => (
                <PreviewProductCard
                  key={p.id} product={p}
                  cardStyle={config.cardStyle}
                  buttonStyle={config.buttonStyle}
                  themeColor={config.themeColor}
                  density={config.cardDensity}
                />
              ))}
            </div>
          </div>
        )

      case 'about':
        if (!config.bio) return null
        return (
          <div key="about" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">About</p>
            <div className="bg-neutral-50 rounded-xl p-4">
              <p className="text-xs text-neutral-700 leading-relaxed">{config.bio}</p>
            </div>
          </div>
        )

      case 'links':
        if (!config.socialLinks.twitter && !config.socialLinks.instagram && !config.socialLinks.website && !config.socialLinks.youtube) return null
        return (
          <div key="links" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Links</p>
            <div className="flex flex-wrap gap-2">
              <SocialRow config={config} large />
            </div>
          </div>
        )

      case 'testimonials':
        return (
          <div key="testimonials" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Testimonials</p>
            <div className="border border-dashed border-neutral-200 rounded-xl p-4 text-center text-xs text-neutral-400">
              Testimonials coming soon
            </div>
          </div>
        )

      case 'faq':
        return (
          <div key="faq" className="max-w-4xl mx-auto px-4 pt-6">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">FAQ</p>
            <div className="border border-dashed border-neutral-200 rounded-xl p-4 text-center text-xs text-neutral-400">
              FAQ coming soon
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-white">
      {/* Top bar */}
      <div className="border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 h-11 flex items-center">
          <SellBopLogo size="sm" />
        </div>
      </div>

      {/* Sections in order */}
      <div className="pb-10">
        {config.sectionOrder.map(id => renderSection(id))}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-100 py-4 text-center">
        <p className="text-[10px] text-neutral-400 flex items-center justify-center gap-1">
          Powered by <SellBopLogo size="sm" />
        </p>
      </div>
    </div>
  )
}

// ── Social Row ────────────────────────────────────────────────
function SocialRow({ config, large }: { config: Storefront; large?: boolean }) {
  const links = [
    config.socialLinks.twitter && { href: config.socialLinks.twitter, icon: <TwitterIcon />, label: 'Twitter / X' },
    config.socialLinks.instagram && { href: config.socialLinks.instagram, icon: <InstagramIcon />, label: 'Instagram' },
    config.socialLinks.youtube && { href: config.socialLinks.youtube, icon: <YouTubeIcon />, label: 'YouTube' },
    config.socialLinks.website && { href: config.socialLinks.website, icon: <Globe size={13} />, label: 'Website' },
  ].filter(Boolean) as { href: string; icon: React.ReactNode; label: string }[]

  if (links.length === 0) return null

  const size = large ? 'w-9 h-9' : 'w-7 h-7'

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {links.map(l => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className={cn(
            size,
            'rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-neutral-400 transition-colors',
          )}
        >
          {l.icon}
        </a>
      ))}
    </div>
  )
}
