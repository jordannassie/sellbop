-- ============================================================
-- SellBop — Allow purchase / order / subscription access by email
-- Migration: 004_purchases_email_access.sql
--
-- Previously, the purchases_select_own RLS policy only matched
-- buyer_user_id = auth.uid().  Guest checkouts store the email
-- but leave buyer_user_id NULL, so those rows were invisible
-- even after the same email was used to sign up / sign in.
--
-- This migration:
--   1. Widens the SELECT policies so authenticated users can
--      also see rows that match their verified email address.
--   2. The linkGuestCommerceByEmail server function still back-
--      fills buyer_user_id on login, but this policy provides
--      immediate access if that back-fill hasn't run yet.
-- ============================================================

-- ── purchases ─────────────────────────────────────────────────
drop policy if exists "purchases_select_own" on purchases;
create policy "purchases_select_own"
  on purchases for select
  using (
    auth.uid() = buyer_user_id
    or lower(buyer_email) = lower(auth.jwt()->>'email')
  );

-- ── orders (buyer side) ───────────────────────────────────────
-- Preserve the existing rule that lets sellers see their orders
-- while adding email-based buyer access.
drop policy if exists "orders_select_buyer_or_seller" on orders;
create policy "orders_select_buyer_or_seller"
  on orders for select
  using (
    auth.uid() = buyer_user_id
    or auth.uid() = seller_user_id
    or lower(buyer_email) = lower(auth.jwt()->>'email')
    or exists (
      select 1
      from stores s
      where s.id = orders.store_id
        and s.owner_user_id = auth.uid()
    )
  );

-- ── subscriptions ─────────────────────────────────────────────
drop policy if exists "subscriptions_select_own" on subscriptions;
create policy "subscriptions_select_own"
  on subscriptions for select
  using (
    auth.uid() = user_id
    or lower(customer_email) = lower(auth.jwt()->>'email')
  );
