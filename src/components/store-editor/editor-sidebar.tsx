'use client'
import { useState } from 'react'
import {
  User, Palette, LayoutGrid, Zap,
  ChevronDown, ChevronRight, ExternalLink, Copy, Check, Globe,
} from 'lucide-react'

function TwitterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useStoreEditor } from '@/context/store-editor-context'
import { DEMO_SELLER_PROFILE } from '@/lib/demo-data/seed'
import { toast } from 'sonner'
import type { Storefront } from '@/lib/domain/entities'

// ── Collapsible Panel ─────────────────────────────────────────
function Panel({ title, icon, children, defaultOpen = false }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-neutral-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-black">
          <span className="text-neutral-400">{icon}</span>
          {title}
        </div>
        {open ? <ChevronDown size={14} className="text-neutral-400" /> : <ChevronRight size={14} className="text-neutral-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ── Small Label ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-neutral-500 mb-1">{children}</p>
}

// ── Text Input ────────────────────────────────────────────────
function FieldInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 placeholder:text-neutral-400 transition-colors"
    />
  )
}

// ── Textarea ──────────────────────────────────────────────────
function FieldTextarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-xs border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-neutral-400 placeholder:text-neutral-400 resize-none transition-colors"
    />
  )
}

// ── Option Pills ──────────────────────────────────────────────
function OptionPills<T extends string>({ value, options, onChange }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'text-xs px-2.5 py-1 rounded-lg border transition-colors font-medium',
            value === o.value
              ? 'bg-black text-white border-black'
              : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Color Swatch ──────────────────────────────────────────────
const ACCENT_PRESETS = [
  { color: '#000000', label: 'Black' },
  { color: '#1a1a2e', label: 'Navy' },
  { color: '#7c3aed', label: 'Violet' },
  { color: '#0f766e', label: 'Teal' },
  { color: '#dc2626', label: 'Red' },
  { color: '#d97706', label: 'Amber' },
  { color: '#1d4ed8', label: 'Blue' },
  { color: '#16a34a', label: 'Green' },
]

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map(p => (
          <button
            key={p.color}
            title={p.label}
            onClick={() => onChange(p.color)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
              value === p.color ? 'border-neutral-900 scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-7 rounded border border-neutral-200 cursor-pointer p-0.5 bg-white"
        />
        <span className="text-xs text-neutral-400 font-mono">{value}</span>
      </div>
    </div>
  )
}

// ── Theme Presets ─────────────────────────────────────────────
type ThemePreset = {
  label: string
  patch: Partial<Storefront>
}

const THEME_PRESETS: ThemePreset[] = [
  {
    label: 'Minimal',
    patch: { themeColor: '#000000', buttonStyle: 'rounded', cardStyle: 'minimal', headerLayout: 'left_avatar', cardDensity: 'comfortable' },
  },
  {
    label: 'Creator',
    patch: { themeColor: '#7c3aed', buttonStyle: 'soft_rounded', cardStyle: 'soft_shadow', headerLayout: 'left_avatar', cardDensity: 'comfortable' },
  },
  {
    label: 'Coaching',
    patch: { themeColor: '#0f766e', buttonStyle: 'rounded', cardStyle: 'soft_shadow', headerLayout: 'centered', cardDensity: 'large' },
  },
  {
    label: 'Digital Shop',
    patch: { themeColor: '#1d4ed8', buttonStyle: 'square', cardStyle: 'outline', headerLayout: 'left_avatar', cardDensity: 'compact' },
  },
]

// ── Section Visibility ────────────────────────────────────────
const SECTION_META: Record<string, { label: string; locked?: boolean }> = {
  header: { label: 'Header', locked: true },
  featured: { label: 'Featured Products' },
  all_products: { label: 'All Products' },
  about: { label: 'About' },
  links: { label: 'Links' },
  testimonials: { label: 'Testimonials' },
  faq: { label: 'FAQ' },
}

// ── Toggle ────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors',
        checked ? 'bg-black' : 'bg-neutral-200',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────
export function EditorSidebar() {
  const { config, update, saveChanges, resetToDefault, isDirty, isSaving } = useStoreEditor()
  const [copied, setCopied] = useState(false)

  const storeUrl = `/store/${DEMO_SELLER_PROFILE.slug}`

  function copyLink() {
    const url = window.location.origin + storeUrl
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-black">Edit Store</h2>
          {isDirty && <p className="text-[10px] text-amber-500 font-medium mt-0.5">Unsaved changes</p>}
        </div>
        <button
          onClick={saveChanges}
          disabled={isSaving || !isDirty}
          className={cn(
            'text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors',
            isDirty && !isSaving
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
          )}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Scrollable panels */}
      <div className="flex-1 overflow-y-auto">

        {/* A. Profile */}
        <Panel title="Profile" icon={<User size={13} />} defaultOpen>
          <div>
            <FieldLabel>Avatar</FieldLabel>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: config.themeColor }}
              >
                {config.title.charAt(0)}
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Avatar upload coming in the next version.
              </p>
            </div>
          </div>
          <div>
            <FieldLabel>Store Name</FieldLabel>
            <FieldInput
              value={config.title}
              onChange={v => update({ title: v })}
              placeholder="Alex Creates"
            />
          </div>
          <div>
            <FieldLabel>Headline</FieldLabel>
            <FieldInput
              value={config.headline ?? ''}
              onChange={v => update({ headline: v || null })}
              placeholder="Short tagline…"
            />
          </div>
          <div>
            <FieldLabel>Bio</FieldLabel>
            <FieldTextarea
              value={config.bio ?? ''}
              onChange={v => update({ bio: v || null })}
              placeholder="Tell buyers who you are and what you create…"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Social Links</FieldLabel>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 flex-shrink-0"><TwitterIcon /></span>
              <FieldInput
                value={config.socialLinks.twitter ?? ''}
                onChange={v => update({ socialLinks: { ...config.socialLinks, twitter: v || undefined } })}
                placeholder="https://twitter.com/handle"
                type="url"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 flex-shrink-0"><InstagramIcon /></span>
              <FieldInput
                value={config.socialLinks.instagram ?? ''}
                onChange={v => update({ socialLinks: { ...config.socialLinks, instagram: v || undefined } })}
                placeholder="https://instagram.com/handle"
                type="url"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 flex-shrink-0"><YoutubeIcon /></span>
              <FieldInput
                value={config.socialLinks.youtube ?? ''}
                onChange={v => update({ socialLinks: { ...config.socialLinks, youtube: v || undefined } })}
                placeholder="https://youtube.com/@handle"
                type="url"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-neutral-400 flex-shrink-0" />
              <FieldInput
                value={config.socialLinks.website ?? ''}
                onChange={v => update({ socialLinks: { ...config.socialLinks, website: v || undefined } })}
                placeholder="https://yoursite.com"
                type="url"
              />
            </div>
          </div>
        </Panel>

        {/* B. Store Theme */}
        <Panel title="Theme" icon={<Palette size={13} />}>
          <div>
            <FieldLabel>Theme Preset</FieldLabel>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => update(p.patch)}
                  className="text-xs border border-neutral-200 rounded-lg py-1.5 px-2 text-center font-medium text-neutral-700 hover:border-black hover:bg-neutral-50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FieldLabel>Accent Color</FieldLabel>
            <ColorPicker value={config.themeColor} onChange={v => update({ themeColor: v })} />
          </div>
          <div>
            <FieldLabel>Button Style</FieldLabel>
            <OptionPills
              value={config.buttonStyle}
              onChange={v => update({ buttonStyle: v })}
              options={[
                { value: 'rounded', label: 'Rounded' },
                { value: 'soft_rounded', label: 'Pill' },
                { value: 'square', label: 'Square' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Card Style</FieldLabel>
            <OptionPills
              value={config.cardStyle}
              onChange={v => update({ cardStyle: v })}
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'soft_shadow', label: 'Shadow' },
                { value: 'outline', label: 'Outline' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Header Layout</FieldLabel>
            <OptionPills
              value={config.headerLayout}
              onChange={v => update({ headerLayout: v })}
              options={[
                { value: 'left_avatar', label: 'Left' },
                { value: 'centered', label: 'Center' },
                { value: 'banner_avatar', label: 'Banner' },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Card Density</FieldLabel>
            <OptionPills
              value={config.cardDensity}
              onChange={v => update({ cardDensity: v })}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfy' },
                { value: 'large', label: 'Large' },
              ]}
            />
          </div>
        </Panel>

        {/* C. Sections */}
        <Panel title="Sections" icon={<LayoutGrid size={13} />}>
          <p className="text-xs text-neutral-400">Drag sections to reorder them in the center column.</p>
          <div className="space-y-1">
            {config.sectionOrder.map(id => {
              const meta = SECTION_META[id]
              if (!meta) return null
              return (
                <div key={id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50">
                  <span className={cn(
                    'text-xs font-medium',
                    config.sectionVisibility[id] ? 'text-black' : 'text-neutral-400',
                  )}>
                    {meta.label}
                    {meta.locked && <span className="ml-1 text-[10px] text-neutral-300">(locked)</span>}
                  </span>
                  <Toggle
                    checked={config.sectionVisibility[id] ?? false}
                    onChange={v => update({
                      sectionVisibility: { ...config.sectionVisibility, [id]: v },
                    })}
                    disabled={meta.locked}
                  />
                </div>
              )
            })}
          </div>
        </Panel>

        {/* D. Quick Actions */}
        <Panel title="Quick Actions" icon={<Zap size={13} />}>
          <div className="space-y-2">
            <Link
              href={storeUrl}
              target="_blank"
              className="flex items-center gap-2 w-full text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              <ExternalLink size={12} className="text-neutral-400" />
              Open Live Store
            </Link>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 w-full text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-neutral-400" />}
              {copied ? 'Copied!' : 'Copy Public Link'}
            </button>
            <button
              onClick={saveChanges}
              disabled={isSaving || !isDirty}
              className={cn(
                'flex items-center gap-2 w-full text-xs font-semibold px-3 py-2 rounded-lg transition-colors',
                isDirty && !isSaving
                  ? 'bg-black text-white hover:bg-neutral-800'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
              )}
            >
              {isSaving ? 'Saving…' : '✓ Save Changes'}
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 w-full text-xs font-medium px-3 py-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
