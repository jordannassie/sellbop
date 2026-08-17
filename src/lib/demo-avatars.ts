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

// Unsplash portraits for homepage affiliate avatar cloud (face crop, hotlink-safe)
const U = (id: string) =>
  `https://images.unsplash.com/${id}?w=200&h=200&fit=crop&crop=face&auto=format&q=80`

export const AFFILIATE_CLOUD_PHOTOS: string[] = [
  U('photo-1507003211169-0a1dd7228f2d'),
  U('photo-1494790108377-be9c29b29330'),
  U('photo-1500648767791-00dcc994a43e'),
  U('photo-1438761681033-6461ffad8d80'),
  U('photo-1472099645785-5658abf4ff4e'),
  U('photo-1534528741775-53994a69daeb'),
  U('photo-1519345182560-3f2917c472ef'),
  U('photo-1544005313-94ddf0286df2'),
  U('photo-1463453091185-91386f40efba'),
  U('photo-1487412720507-e7ab37603c6f'),
  U('photo-1560250097-0b93528c311a'),
  U('photo-1580489944761-15a19d654956'),
  U('photo-1566492031773-4f4e44671857'),
  U('photo-1573496359142-b8d87734a5a2'),
  U('photo-1599566150163-29194dadcad0'),
  U('photo-1583394838336-acd9777362f6'),
  U('photo-1619895862022-09114b41f16f'),
  U('photo-1570295999919-56ceb5eee242'),
  U('photo-1554151228-14d9def656e4'),
  U('photo-1522075469751-3a6694fb2f61'),
]
