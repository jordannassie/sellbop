# Resend Setup for SellBop Transactional Email

SellBop uses [Resend](https://resend.com) for purchase receipts, seller sale notifications, refund emails, and purchase recovery messages.

## 1. Verify your sending domain

1. Log in to Resend.
2. Add domain: `sellbop.com`.
3. Add the DNS records Resend provides (SPF, DKIM, etc.).
4. Wait until the domain shows as verified.

## 2. Create an API key

1. Resend → API Keys → Create API Key.
2. Scope it for sending only if possible.
3. Copy the key once — you will not see it again.

## 3. Production environment variables

Set these in Netlify (or your host):

```bash
RESEND_API_KEY=
EMAIL_FROM=SellBop <orders@sellbop.com>
EMAIL_REPLY_TO=hello@sellbop.com
SELLBOP_SUPPORT_EMAIL=hello@sellbop.com
NEXT_PUBLIC_APP_URL=https://sellbop.com
```

Optional (recommended for delivery tracking):

```bash
RESEND_WEBHOOK_SECRET=
```

Never commit real API keys to git.

## 4. Resend webhook (optional but recommended)

1. Resend → Webhooks → Add webhook.
2. URL: `https://sellbop.com/api/webhooks/resend`
3. Events: sent, delivered, delivery_delayed, bounced, complained, failed.
4. Copy the signing secret into `RESEND_WEBHOOK_SECRET`.

## 5. Support mailbox

Create a real mailbox for `hello@sellbop.com` (or your chosen support address). Purchase receipt emails use:

- **From:** `SellBop <orders@sellbop.com>`
- **Reply-To:** seller's support email when set, otherwise `hello@sellbop.com`

Buyers replying to receipts will reach the seller when `support_email` is configured on their store.

## 6. Supabase migration required

Before purchase access links work in production, apply:

`supabase/migrations/024_purchase_delivery_and_email.sql`

In Supabase SQL Editor, paste and run the full migration file.

## 7. Auth emails (Supabase)

Supabase Auth (verification, password reset, OAuth) remains separate from Resend commerce email. If you want Supabase auth emails to also use Resend, configure custom SMTP in Supabase project settings using the same domain — but do not break existing auth while doing so.

## 8. Verify after setup

Follow `PURCHASE-DELIVERY-QA.md` with a $1 test product after deploying credentials.
