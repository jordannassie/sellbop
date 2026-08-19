import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { PartnerApplicationEditor } from '@/components/admin/partner-application-editor'
import { requireAdminUser } from '@/lib/admin/access'
import { getPartnerApplicationDetail } from '@/lib/admin/partner-applications'
import { lineToUrl, splitSocialLinkLines } from '@/lib/partner-applications/links'
import { PARTNER_APPLICATION_STATUS_LABELS } from '@/lib/partner-applications/constants'
import { formatDate } from '@/lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <p className="text-sm font-bold text-black">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-6 border-b border-neutral-100 py-3 last:border-0">
      <span className="text-sm text-neutral-400 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-neutral-800 sm:text-right break-words">{value}</span>
    </div>
  )
}

function SocialLinksBlock({ text }: { text: string }) {
  const lines = splitSocialLinkLines(text)
  if (lines.length === 0) {
    return <p className="text-sm text-neutral-400">—</p>
  }

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const url = lineToUrl(line)
        if (url) {
          return (
            <a
              key={`${line}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-sm text-blue-600 hover:underline break-all"
            >
              {line}
              <ExternalLink size={12} className="shrink-0 mt-0.5" />
            </a>
          )
        }
        return (
          <p key={`${line}-${index}`} className="text-sm text-neutral-700 break-all whitespace-pre-wrap">
            {line}
          </p>
        )
      })}
      <details className="pt-2">
        <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600">
          View original text
        </summary>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 font-mono">
          {text}
        </pre>
      </details>
    </div>
  )
}

export default async function AdminPartnerApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params
  const application = await getPartnerApplicationDetail(id)
  if (!application) notFound()

  return (
    <div className="max-w-3xl space-y-4 p-8">
      <Link
        href="/internal/admin?section=partners"
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black"
      >
        <ArrowLeft size={15} /> Back to Partners
      </Link>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          Admin · Partner Application
        </p>
        <h1 className="text-2xl font-bold text-black">{application.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {PARTNER_APPLICATION_STATUS_LABELS[application.status]} · Submitted {formatDate(application.createdAt)}
        </p>
      </div>

      <Section title="Applicant">
        <Row label="Name" value={application.name} />
        <Row label="Email" value={
          <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">
            {application.email}
          </a>
        } />
        <Row label="Phone" value={application.phone ?? '—'} />
        <Row label="Audience Size" value={
          <span className="font-semibold text-black">{application.audienceSize}</span>
        } />
        {application.userId && (
          <Row label="SellBop account" value={
            <Link href={`/internal/admin/users/${application.userId}`} className="text-blue-600 hover:underline font-mono text-xs">
              {application.userId.slice(0, 8)}…
            </Link>
          } />
        )}
      </Section>

      <Section title="Social Links">
        <SocialLinksBlock text={application.socialLinks} />
      </Section>

      <Section title="Message">
        {application.message ? (
          <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{application.message}</p>
        ) : (
          <p className="text-sm text-neutral-400">—</p>
        )}
      </Section>

      <Section title="Manage">
        <PartnerApplicationEditor
          id={application.id}
          initialStatus={application.status}
          initialAdminNotes={application.adminNotes}
        />
      </Section>
    </div>
  )
}
