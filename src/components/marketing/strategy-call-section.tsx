'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Check, Clock, Calendar, ChevronLeft, ChevronRight, ArrowRight, Phone } from 'lucide-react'

// ─── Calendar helpers ────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

// Available days offset from today (skip weekends, next 3 weeks)
function buildAvailableDates(year: number, month: number): Set<number> {
  const available = new Set<number>()
  const today = new Date()
  const daysInMonth = getDaysInMonth(year, month)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue // no weekends
    if (date <= today) continue          // no past dates
    const diff = Math.floor((date.getTime() - today.getTime()) / 86400000)
    if (diff > 21) continue              // only next 3 weeks
    // sparse availability: every other day roughly
    if (d % 2 === 0 || d % 3 === 0) available.add(d)
  }
  return available
}

const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:30 PM', '4:00 PM']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ─── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ onClose }: { onClose: () => void }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [step, setStep] = useState<'pick' | 'form' | 'confirmed'>('pick')
  const [form, setForm] = useState({ name: '', email: '', note: '' })
  const [loading, setLoading] = useState(false)

  const availableDates = buildAvailableDates(viewYear, viewMonth)
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null); setSelectedTime(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null); setSelectedTime(null)
  }

  function handleBook() {
    if (!form.name || !form.email) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setStep('confirmed') }, 1200)
  }

  const selectedDateStr = selectedDay
    ? `${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-neutral-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Strategy Call</span>
            </div>
            <h2 className="text-xl font-bold text-black">SellBop Strategy Call</h2>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-neutral-500">
              <span className="flex items-center gap-1"><Clock size={13} /> 30 minutes</span>
              <span className="text-neutral-300">·</span>
              <span className="font-semibold text-black">$500 one-time</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors">
            <X size={16} className="text-neutral-500" />
          </button>
        </div>

        {step === 'confirmed' ? (
          /* ── Confirmation ── */
          <div className="p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <Check size={24} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-black">You&rsquo;re booked!</h3>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto">
              Your SellBop Strategy Call is confirmed for{' '}
              <strong className="text-black">{selectedDateStr}</strong> at{' '}
              <strong className="text-black">{selectedTime}</strong>.
            </p>
            <p className="text-neutral-500 text-sm">A confirmation will be sent to <strong className="text-black">{form.email}</strong>.</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Done
            </button>
          </div>

        ) : step === 'form' ? (
          /* ── Form ── */
          <div className="p-6 space-y-5">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-black">{selectedDateStr} · {selectedTime}</p>
              <p className="text-neutral-500 text-xs mt-0.5">30-minute SellBop Strategy Call</p>
              <button
                onClick={() => setStep('pick')}
                className="text-xs text-neutral-400 hover:text-black mt-1 underline underline-offset-2"
              >
                Change date/time
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Anything you&rsquo;d like to cover? <span className="font-normal text-neutral-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your product, goals, or questions ahead of time..."
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={!form.name || !form.email || loading}
              className="w-full flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Booking…' : <>Confirm Booking — $500 <ArrowRight size={14} /></>}
            </button>
            <p className="text-center text-xs text-neutral-400">You will receive a confirmation email with call details.</p>
          </div>

        ) : (
          /* ── Date + Time picker ── */
          <div className="p-6 grid sm:grid-cols-2 gap-6">

            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
                  <ChevronLeft size={15} className="text-neutral-500" />
                </button>
                <p className="text-sm font-semibold text-black">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </p>
                <button onClick={nextMonth} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors">
                  <ChevronRight size={15} className="text-neutral-500" />
                </button>
              </div>

              {/* Day name headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-neutral-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isAvailable = availableDates.has(day)
                  const isSelected = selectedDay === day
                  return (
                    <button
                      key={day}
                      disabled={!isAvailable}
                      onClick={() => { setSelectedDay(day); setSelectedTime(null) }}
                      className={[
                        'w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-medium transition-colors',
                        isSelected
                          ? 'bg-black text-white'
                          : isAvailable
                          ? 'text-black hover:bg-neutral-100 font-semibold'
                          : 'text-neutral-300 cursor-not-allowed',
                      ].join(' ')}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 mt-4 text-[11px] text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-black inline-block" /> Available dates only shown
              </div>
            </div>

            {/* Time slots */}
            <div>
              {selectedDay ? (
                <>
                  <p className="text-sm font-semibold text-black mb-3">{selectedDateStr}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={[
                          'py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors text-center',
                          selectedTime === slot
                            ? 'bg-black text-white border-black'
                            : 'border-neutral-200 text-black hover:border-neutral-400 hover:bg-neutral-50',
                        ].join(' ')}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {selectedTime && (
                    <button
                      onClick={() => setStep('form')}
                      className="w-full mt-5 flex items-center justify-center gap-2 bg-black text-white text-sm font-semibold py-3 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Calendar size={28} className="text-neutral-200 mx-auto" />
                    <p className="text-sm text-neutral-400">Select a date to see available times</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Homepage Section ─────────────────────────────────────────────────────────

const INCLUDES = [
  '30-minute 1-on-1 video call',
  'Offer and pricing review',
  'Product page feedback',
  'Traffic and growth ideas',
  'Clear action plan to move forward',
]

const CALL_IMAGE = 'https://phhczohqidgrvcmszets.supabase.co/storage/v1/object/public/Selli/image/alluring_swan_07128_Business_young_man_consolting_call_on_com_a5ca6bc8-fee2-4246-9544-4779217a7683_1.png'

export function StrategyCallSection() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-black rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-[1fr_auto_340px] gap-0">

              {/* Left: copy + includes + CTA */}
              <div className="p-8 sm:p-12 flex flex-col justify-center gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-3">1-on-1 Expert Session</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                    Need help selling more?
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Book a 30-minute SellBop Strategy Call and get expert feedback on your product, pricing, page setup, and traffic plan.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {INCLUDES.map(item => (
                    <div key={item} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={9} className="text-neutral-300" />
                      </div>
                      <span className="text-sm text-neutral-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 bg-white text-black text-sm font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-colors"
                  >
                    Book a Strategy Call <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Middle: price panel */}
              <div className="border-t lg:border-t-0 lg:border-l border-neutral-800 bg-neutral-900 p-8 sm:p-10 flex flex-col justify-center gap-6 min-w-[220px]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-500 mb-3">One-time</p>
                  <p className="text-5xl font-bold text-white leading-none">$500</p>
                  <p className="text-neutral-500 text-sm mt-2">Single session · No subscription</p>
                </div>

                <div className="border-t border-neutral-800 pt-5 space-y-3">
                  <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                    <Clock size={13} className="text-neutral-600 flex-shrink-0" />
                    30 minutes via video call
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                    <Calendar size={13} className="text-neutral-600 flex-shrink-0" />
                    Book your slot instantly
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-400">
                    <Check size={13} className="text-neutral-600 flex-shrink-0" />
                    Written action plan included
                  </div>
                </div>

                <button
                  onClick={() => setOpen(true)}
                  className="w-full flex items-center justify-center gap-2 border border-neutral-700 text-neutral-200 text-sm font-semibold py-3 rounded-xl hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
                >
                  View Available Times
                </button>
              </div>

              {/* Right: photo panel */}
              <div className="relative hidden lg:block h-full min-h-[420px]">
                <Image
                  src={CALL_IMAGE}
                  alt="SellBop Strategy Call"
                  fill
                  className="object-cover object-center"
                  unoptimized
                />
                {/* subtle left gradient to blend into dark card */}
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/60 via-transparent to-transparent" />
              </div>

            </div>
          </div>
        </div>
      </section>

      {open && <BookingModal onClose={() => setOpen(false)} />}
    </>
  )
}
