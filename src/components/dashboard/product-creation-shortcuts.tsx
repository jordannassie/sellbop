import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FILE_CREATION_LINKS = [
  { label: 'Google Docs', href: 'https://docs.google.com/document/create' },
  { label: 'Google Sheets', href: 'https://docs.google.com/spreadsheets/create' },
  { label: 'Canva', href: 'https://www.canva.com/create/' },
  { label: 'Notion', href: 'https://www.notion.so' },
] as const

const HIGGSFIELD_URL = 'https://higgsfield.ai'

function ExternalChip({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-black transition-colors"
    >
      {label}
      <ExternalLink size={11} className="text-neutral-400" />
    </a>
  )
}

export function ProductFileCreationShortcuts() {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <p className="text-xs font-medium text-neutral-500 mb-2">Create your product with</p>
      <div className="flex flex-wrap gap-2">
        {FILE_CREATION_LINKS.map(link => (
          <ExternalChip key={link.label} label={link.label} href={link.href} />
        ))}
      </div>
      <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">
        Create your file, export or download it, then upload it to SellBop.
      </p>
    </div>
  )
}

export function CoverImageCreationShortcuts() {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-100">
      <a href={HIGGSFIELD_URL} target="_blank" rel="noopener noreferrer">
        <Button type="button" size="sm" variant="secondary">
          Create with Higgsfield <ExternalLink size={13} />
        </Button>
      </a>
      <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">
        Need a cover? Create one with Higgsfield, then upload it here.
      </p>
    </div>
  )
}
