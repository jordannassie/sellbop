'use client'

import { useState } from 'react'
import { DEMO_USERS, DEMO_CUSTOMERS } from '@/lib/demo-data/seed'

interface SupportNote {
  id: string
  userId: string
  userName: string
  note: string
  createdAt: string
  author: string
}

const INITIAL_NOTES: SupportNote[] = [
  {
    id: 'note-1',
    userId: 'cust-1',
    userName: 'Sarah Mitchell',
    note: 'Customer requested refund for order-15 due to accidental duplicate purchase. Processed. Access revoked.',
    createdAt: '2024-02-16T10:00:00Z',
    author: 'Admin',
  },
]

export function SupportSection() {
  const [notes, setNotes]       = useState<SupportNote[]>(INITIAL_NOTES)
  const [selectedUser, setSelectedUser] = useState('')
  const [noteText, setNoteText] = useState('')
  const [impersonateMsg, setImpersonateMsg] = useState<string | null>(null)

  const allUsers = [
    ...DEMO_USERS.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
    ...DEMO_CUSTOMERS.map(c => ({ id: c.id, name: c.name, email: c.email, role: 'buyer' as const })),
  ]

  function addNote() {
    if (!selectedUser || !noteText.trim()) return
    const user = allUsers.find(u => u.id === selectedUser)!
    setNotes(prev => [
      {
        id: `note-${Date.now()}`,
        userId: selectedUser,
        userName: user.name,
        note: noteText.trim(),
        createdAt: new Date().toISOString(),
        author: 'Admin',
      },
      ...prev,
    ])
    setNoteText('')
  }

  function handleImpersonate(userId: string) {
    const user = allUsers.find(u => u.id === userId)
    if (!user) return
    setImpersonateMsg(`[Demo] Impersonating ${user.name} (${user.email}). In production this would open their session. No actual login performed.`)
    setTimeout(() => setImpersonateMsg(null), 5000)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-black">Support</h1>

      {/* Impersonation */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-3">
          <p className="text-xs font-bold text-black">Login as User (Impersonation)</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Placeholder — in production this would create a scoped admin session as the selected user.</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black"
            >
              <option value="">Select a user…</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email}) · {u.role}</option>
              ))}
            </select>
            <button
              onClick={() => selectedUser && handleImpersonate(selectedUser)}
              disabled={!selectedUser}
              className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Login As
            </button>
          </div>
          {impersonateMsg && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
              ⚠ {impersonateMsg}
            </div>
          )}
        </div>
      </div>

      {/* Support notes */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-3">
          <p className="text-xs font-bold text-black">Internal Support Notes</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Log notes about users, refunds, disputes, or support conversations.</p>
        </div>

        {/* Add note form */}
        <div className="p-5 space-y-3 border-b border-neutral-100">
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black"
          >
            <option value="">Select user to note…</option>
            {allUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <textarea
            rows={3}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add internal support note…"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
          />
          <button
            onClick={addNote}
            disabled={!selectedUser || !noteText.trim()}
            className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Note
          </button>
        </div>

        {/* Notes list */}
        <div className="divide-y divide-neutral-50">
          {notes.length === 0 && (
            <p className="text-sm text-neutral-400 px-5 py-6 text-center">No notes yet.</p>
          )}
          {notes.map(n => (
            <div key={n.id} className="px-5 py-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-black">{n.userName}</p>
                <p className="text-[10px] text-neutral-400">{new Date(n.createdAt).toLocaleString()} · {n.author}</p>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">{n.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
