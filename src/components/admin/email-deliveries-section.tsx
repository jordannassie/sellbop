import { getAdminEmailConfigStatus, getAdminEmailDeliveries } from '@/lib/admin/email-deliveries'

export async function EmailDeliveriesSection() {
  const [deliveries, config] = await Promise.all([
    getAdminEmailDeliveries(),
    Promise.resolve(getAdminEmailConfigStatus()),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-black">Email Deliveries</h2>
        <p className="text-sm text-neutral-500 mt-1">Transactional commerce email log and configuration status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Resend API', config.resendConfigured],
          ['From email', config.fromConfigured],
          ['Reply-to', config.replyToConfigured],
          ['Webhook', config.webhookConfigured],
        ].map(([label, ok]) => (
          <div key={label as string} className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{label as string}</p>
            <p className="text-sm font-semibold text-black mt-1">{ok ? 'Configured' : 'Missing'}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No email deliveries logged yet.
                </td>
              </tr>
            ) : deliveries.map(row => (
              <tr key={row.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 text-neutral-600">{new Date(row.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">{row.email_type}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.recipient}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.order_id?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
