const SUPABASE_TOOLS =
  'https://qsvmgzdaashfsavmfjuz.supabase.co/storage/v1/object/public/SELL/images/Tools'

const FILE_CREATION_LINKS = [
  {
    label: 'Google Docs',
    href: 'https://docs.google.com/document/create',
    icon: 'https://www.gstatic.com/images/branding/product/2x/docs_2020q4_48dp.png',
  },
  {
    label: 'Google Sheets',
    href: 'https://docs.google.com/spreadsheets/create',
    icon: 'https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png',
  },
  {
    label: 'Canva',
    href: 'https://www.canva.com/create/',
    icon: 'https://www.canva.com/favicon.ico',
  },
  {
    label: 'Notion',
    href: 'https://www.notion.so',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
  },
] as const

const HIGGSFIELD_URL = 'https://higgsfield.ai'
const HIGGSFIELD_ICON = `${SUPABASE_TOOLS}/output.webp`

export { HIGGSFIELD_URL, HIGGSFIELD_ICON }

function IconLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className="h-5 w-5 object-contain" />
    </a>
  )
}

/** Icon links for the Digital File card header (top right). */
export function ProductFileCreationHeaderLinks() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {FILE_CREATION_LINKS.map(link => (
        <IconLink key={link.label} href={link.href} label={link.label} icon={link.icon} />
      ))}
    </div>
  )
}

/** Helper copy below the Digital File upload area. */
export function ProductFileCreationHelperText() {
  return (
    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
      Upload a file or add a website link buyers can access after purchase. Create files with Docs,
      Sheets, Canva, or Notion — or link directly to a Notion page, Google Doc, course, or site.
    </p>
  )
}

/** Higgsfield link for the Cover Image card header (top right). */
export function CoverImageCreationHeaderLink() {
  return (
    <IconLink href={HIGGSFIELD_URL} label="Create with Higgsfield" icon={HIGGSFIELD_ICON} />
  )
}

/** Helper copy below the Cover Image upload area. */
export function CoverImageCreationHelperText() {
  return (
    <p className="text-xs text-neutral-400 mt-3 leading-relaxed">
      Need a cover? Create a 1080 × 1080 px square (1:1) image with Higgsfield, then upload it here.
    </p>
  )
}
