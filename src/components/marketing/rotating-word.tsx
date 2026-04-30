'use client'
import { useState, useEffect, useRef } from 'react'

const WORDS = [
  { text: 'Digital downloads',       gradient: 'from-blue-500 via-indigo-500 to-purple-600' },
  { text: 'Subscriptions',           gradient: 'from-violet-500 via-blue-500 to-indigo-600' },
  { text: 'Coaching calls',          gradient: 'from-orange-400 via-pink-500 to-rose-500' },
  { text: 'Memberships',             gradient: 'from-amber-400 via-orange-500 to-pink-500' },
  { text: 'Bundles',                 gradient: 'from-emerald-400 via-cyan-500 to-teal-500' },
  { text: 'A 5-minute store launch', gradient: 'from-cyan-400 via-blue-500 to-violet-600' },
]

const DISPLAY_MS = 2500
const FADE_MS = 280

export function RotatingWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) return

    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % WORDS.length)
        setVisible(true)
      }, FADE_MS)
    }, DISPLAY_MS)

    return () => clearInterval(id)
  }, [])

  // Word changes while opacity = 0, so the width shift is invisible.
  // Period position adjusts silently, then the new word fades in cleanly.
  const { text, gradient } = WORDS[index]

  return (
    <span
      className={`inline-block bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(-10px)',
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1), transform ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
        willChange: 'opacity, transform',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </span>
  )
}
