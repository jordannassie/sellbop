// ─────────────────────────────────────────────────────────────────
// Demo avatar photo URLs — Pravatar.cc CDN.
// Real-looking faces, reliably hosted, no API key required.
// Each ?img=N seed is deterministic (same person every time).
// Replace with real user-uploaded photos when auth supports avatars.
// Used in: community page, auth layout promo panel, homepage hero.
// ─────────────────────────────────────────────────────────────────

const P = 'https://i.pravatar.cc/150?img='

export const DEMO_AVATAR_PHOTOS: Record<string, string> = {
  sarahcreates:  `${P}1`,
  alexjohnson:   `${P}12`,
  collab_fan:    `${P}32`,
  videopro_j:    `${P}5`,
  markd:         `${P}8`,
  bundlebuilder: `${P}20`,
  noah_maker:    `${P}52`,
  emma_launch:   `${P}44`,
  chloe_store:   `${P}49`,
  ryan_growth:   `${P}68`,
}

// Ordered for facepiles — most "founder" feel first
export const HERO_FACEPILE_PHOTOS = [
  `${P}1`,   // Sarah
  `${P}12`,  // Alex
  `${P}44`,  // Emma
  `${P}68`,  // Ryan
  `${P}5`,   // Maya
  `${P}52`,  // Noah
  `${P}32`,  // Jordan
]
