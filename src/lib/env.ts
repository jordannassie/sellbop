// ─────────────────────────────────────────────────────────────────────────────
// Central environment variable config
//
// Rules:
//  - Never crashes unrelated pages when a var is missing.
//  - Missing vars return null — consumers decide whether to throw.
//  - Service role key is read here but MUST only flow into server-only modules.
//  - Use `isSupabaseConfigured()` as a cheap guard before touching Supabase.
// ─────────────────────────────────────────────────────────────────────────────

export const env = {
  // ── App ──────────────────────────────────────────────────────────────────
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },

  // ── Supabase ─────────────────────────────────────────────────────────────
  //   NEXT_PUBLIC_SUPABASE_URL        → required for browser + server clients
  //   NEXT_PUBLIC_SUPABASE_ANON_KEY   → required for browser client
  //   SUPABASE_SERVICE_ROLE_KEY       → required for server admin client ONLY
  supabase: {
    url:            process.env.NEXT_PUBLIC_SUPABASE_URL            ?? null,
    anonKey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY        ?? null,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY            ?? null,
  },

  // ── Stripe (future) ───────────────────────────────────────────────────────
  stripe: {
    secretKey:        process.env.STRIPE_SECRET_KEY                  ?? null,
    publishableKey:   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
    webhookSecret:    process.env.STRIPE_WEBHOOK_SECRET              ?? null,
    starterPriceId:   process.env.STRIPE_STARTER_PRICE_ID            ?? null,
    proPriceId:       process.env.STRIPE_PRO_PRICE_ID                ?? null,
  },

  // ── Transactional email (Resend) ─────────────────────────────────────────
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? null,
    webhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? null,
  },

  email: {
    from: process.env.EMAIL_FROM ?? 'SellBop <orders@sellbop.com>',
    replyTo: process.env.EMAIL_REPLY_TO ?? process.env.SELLBOP_SUPPORT_EMAIL ?? 'hello@sellbop.com',
    supportEmail: process.env.SELLBOP_SUPPORT_EMAIL ?? process.env.EMAIL_REPLY_TO ?? 'hello@sellbop.com',
  },

  // ── Printify ─────────────────────────────────────────────────────────────
  printify: {
    apiToken: process.env.PRINTIFY_API_TOKEN ?? null,
    shopId:   process.env.PRINTIFY_SHOP_ID   ?? null,
  },

  admin: {
    allowedEmails: process.env.ADMIN_ALLOWED_EMAILS ?? '',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? null,
  },

  dataForSeo: {
    login: process.env.DATAFORSEO_LOGIN ?? null,
    password: process.env.DATAFORSEO_PASSWORD ?? null,
  },
} as const

// ── Guard helpers ─────────────────────────────────────────────────────────────

/** Returns true only when both public Supabase vars are present. */
export function isSupabaseConfigured(): boolean {
  return !!(env.supabase.url && env.supabase.anonKey)
}

/** Returns true when the service role key is also present (server-side admin). */
export function isSupabaseAdminConfigured(): boolean {
  return !!(env.supabase.url && env.supabase.serviceRoleKey)
}

export function getAllowedAdminEmails(): string[] {
  return env.admin.allowedEmails
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}
