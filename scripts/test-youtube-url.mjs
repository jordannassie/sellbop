#!/usr/bin/env node
/** Unit tests for YouTube URL parsing (mirrors src/lib/youtube.ts). */

function parseYouTubeVideoId(url) {
  const trimmed = url.trim()
  if (!trimmed) return null
  let parsed
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0]
    return /^[\w-]{11}$/.test(id) ? id : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const path = parsed.pathname
    if (path === '/watch') {
      const id = parsed.searchParams.get('v')
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
    if (path.startsWith('/shorts/')) {
      const id = path.slice('/shorts/'.length).split('/')[0]
      return /^[\w-]{11}$/.test(id) ? id : null
    }
    if (path.startsWith('/embed/')) {
      const id = path.slice('/embed/'.length).split('/')[0]
      return /^[\w-]{11}$/.test(id) ? id : null
    }
  }
  return null
}

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function assert(label, cond) {
  if (cond) ok(label)
  else {
    console.log(`  ✗ ${label}`)
    failed++
  }
}

const ID = 'dQw4w9WgXcQ'

assert('watch URL', parseYouTubeVideoId(`https://www.youtube.com/watch?v=${ID}`) === ID)
assert('watch with params', parseYouTubeVideoId(`https://youtube.com/watch?v=${ID}&t=10`) === ID)
assert('youtu.be', parseYouTubeVideoId(`https://youtu.be/${ID}`) === ID)
assert('shorts', parseYouTubeVideoId(`https://www.youtube.com/shorts/${ID}`) === ID)
assert('embed', parseYouTubeVideoId(`https://www.youtube.com/embed/${ID}`) === ID)
assert('empty', parseYouTubeVideoId('') === null)
assert('invalid host', parseYouTubeVideoId('https://vimeo.com/123') === null)
assert('invalid id', parseYouTubeVideoId('https://youtu.be/tooshort') === null)

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
