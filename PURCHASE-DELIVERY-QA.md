# Purchase Delivery QA Checklist

Use this after deploying the purchase delivery system and configuring Resend.

Recommended: create a **$1 test product** with at least one PDF/file attached.

## Paid guest purchase

1. Open the product page in a private/incognito window (not signed in).
2. Click **Buy Now**, enter name + email, complete Stripe checkout.
3. Confirm redirect to `/checkout/success?session_id=...`.
4. Wait for **Purchase complete** with **Access Your Product** button.
5. Confirm email line only says receipt was sent if email actually sent.
6. Click **Access Your Product** → lands on `/access/[token]`.
7. Confirm product cover, title, seller, and all files appear.
8. Download/open each file (hosted file + external link if present).
9. Check buyer inbox for receipt from `orders@sellbop.com`.
10. Click **Access Your Product** in email → same access page works.

## Seller notification

1. Check seller account email for **You made a sale** notification.
2. Confirm order appears in Dashboard → Sales.

## Library claiming

1. Create a SellBop account using the **same email** used at checkout.
2. Verify email (if email/password signup).
3. Open Dashboard → Library.
4. Confirm the product appears with **Access Product** button.
5. Button opens the same `/access/[token]` page.

## Unverified account safety

1. Buy as guest with email A.
2. Sign up with email A but do **not** verify yet.
3. Confirm purchase does **not** appear in Library.
4. Verify email → purchase should appear.

## Free product

1. Use a $0 product (or 100% discount code on paid product).
2. Complete checkout without Stripe payment.
3. Confirm immediate access URL and receipt email (when Resend configured).

## Find my purchases

1. Go to `/purchases`.
2. Enter checkout email.
3. Confirm generic success message (no purchase enumeration).
4. Check inbox for recovery email with access links.

## Refund

1. Refund the test order in Stripe (full refund).
2. Confirm purchase access page shows revoked message.
3. Confirm buyer receives refund email.
4. Partial refund: entitlement should remain active.

## Resend admin

1. Open `/internal/admin?section=emails`.
2. Confirm delivery log shows receipt + seller emails.
3. Confirm config status indicators.

## Resend unavailable test

1. Temporarily remove `RESEND_API_KEY` in a staging environment.
2. Complete a purchase — it must still succeed.
3. Success page must **not** claim email was sent (except dev simulation note).
