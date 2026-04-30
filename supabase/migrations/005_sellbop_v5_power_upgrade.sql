-- ============================================================
-- SellBop V5 Power Upgrade
-- Migration: 005_sellbop_v5_power_upgrade.sql
--
-- New tables:
--   product_files      — seller attaches files/links to products
--   product_updates    — seller posts buyer-only updates per product
--   product_reviews    — customer reviews / testimonials
--   affiliate_links    — per-product affiliate codes
--   affiliate_clicks   — click/conversion tracking
--
-- Safe column additions (IF NOT EXISTS pattern via DO blocks):
--   products.marketplace_badge
--   products.marketplace_excerpt
--   products.cover_image_url  (may already exist)
--   products.checkout_copy
--   products.access_message
--   stores.banner_url
--   stores.layout_mode
-- ============================================================

-- ── product_files ─────────────────────────────────────────────────────────────
create table if not exists product_files (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  seller_id       uuid not null,
  file_name       text not null,
  file_url        text not null,
  file_type       text not null default 'other',  -- pdf | zip | video | audio | image | link | other
  visibility      text not null default 'buyers', -- buyers | public | private
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table product_files enable row level security;

-- Sellers manage their own files
create policy "product_files_seller_manage"
  on product_files for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Buyers can read files attached to products they own (via purchases)
create policy "product_files_buyer_read"
  on product_files for select
  using (
    visibility = 'public'
    or (
      visibility = 'buyers'
      and exists (
        select 1 from purchases p
        where p.product_id = product_files.product_id
          and (
            p.buyer_user_id = auth.uid()
            or lower(p.buyer_email) = lower(auth.jwt()->>'email')
          )
      )
    )
  );

-- ── product_updates ───────────────────────────────────────────────────────────
create table if not exists product_updates (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  seller_id       uuid not null,
  title           text not null,
  body            text not null default '',
  link_url        text,
  link_label      text,
  status          text not null default 'draft', -- draft | published
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table product_updates enable row level security;

-- Sellers manage their own updates
create policy "product_updates_seller_manage"
  on product_updates for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Buyers read published updates for purchased products
create policy "product_updates_buyer_read"
  on product_updates for select
  using (
    status = 'published'
    and exists (
      select 1 from purchases p
      where p.product_id = product_updates.product_id
        and (
          p.buyer_user_id = auth.uid()
          or lower(p.buyer_email) = lower(auth.jwt()->>'email')
        )
    )
  );

-- ── product_reviews ───────────────────────────────────────────────────────────
create table if not exists product_reviews (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  seller_id       uuid not null,
  customer_name   text not null,
  customer_email  text,
  rating          integer not null check (rating between 1 and 5),
  message         text not null default '',
  approved        boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table product_reviews enable row level security;

-- Public can read approved reviews
create policy "product_reviews_public_read"
  on product_reviews for select
  using (approved = true);

-- Sellers manage reviews for their products
create policy "product_reviews_seller_manage"
  on product_reviews for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- Authenticated users can insert reviews (customers submitting)
create policy "product_reviews_customer_insert"
  on product_reviews for insert
  with check (auth.uid() is not null);

-- ── affiliate_links ───────────────────────────────────────────────────────────
create table if not exists affiliate_links (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references products(id) on delete cascade,
  seller_id       uuid not null,
  affiliate_code  text not null unique,
  affiliate_name  text,          -- friendly label for this affiliate
  affiliate_email text,
  commission_pct  numeric(5,2) not null default 0,  -- percentage, e.g. 30.00
  enabled         boolean not null default true,
  total_clicks    integer not null default 0,
  total_orders    integer not null default 0,
  total_revenue   integer not null default 0, -- in cents
  created_at      timestamptz not null default now()
);

alter table affiliate_links enable row level security;

create policy "affiliate_links_seller_manage"
  on affiliate_links for all
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

-- ── affiliate_clicks ──────────────────────────────────────────────────────────
create table if not exists affiliate_clicks (
  id              uuid primary key default gen_random_uuid(),
  affiliate_link_id uuid not null references affiliate_links(id) on delete cascade,
  product_id      uuid not null,
  affiliate_code  text not null,
  order_id        uuid,          -- filled in when click converts to purchase
  referrer_url    text,
  ip_hash         text,          -- hashed IP for dedup (no PII)
  created_at      timestamptz not null default now()
);

alter table affiliate_clicks enable row level security;

-- Sellers read clicks for their affiliate links
create policy "affiliate_clicks_seller_read"
  on affiliate_clicks for select
  using (
    exists (
      select 1 from affiliate_links al
      where al.id = affiliate_clicks.affiliate_link_id
        and al.seller_id = auth.uid()
    )
  );

-- Allow anonymous insert for tracking (no PII required)
create policy "affiliate_clicks_anon_insert"
  on affiliate_clicks for insert
  with check (true);

-- ── Safe column additions ─────────────────────────────────────────────────────

-- products.marketplace_badge
do $$ begin
  alter table products add column marketplace_badge text;
exception when duplicate_column then null;
end $$;

-- products.marketplace_excerpt (may already exist from domain)
do $$ begin
  alter table products add column marketplace_excerpt text;
exception when duplicate_column then null;
end $$;

-- products.cover_image_url (may already exist)
do $$ begin
  alter table products add column cover_image_url text;
exception when duplicate_column then null;
end $$;

-- products.checkout_copy
do $$ begin
  alter table products add column checkout_copy text;
exception when duplicate_column then null;
end $$;

-- products.access_message
do $$ begin
  alter table products add column access_message text;
exception when duplicate_column then null;
end $$;

-- products.marketplace_visible (may already exist)
do $$ begin
  alter table products add column marketplace_visible boolean not null default true;
exception when duplicate_column then null;
end $$;

-- stores.banner_url
do $$ begin
  alter table stores add column banner_url text;
exception when duplicate_column then null;
end $$;

-- stores.layout_mode  ('clean' | 'banner')
do $$ begin
  alter table stores add column layout_mode text not null default 'clean';
exception when duplicate_column then null;
end $$;

-- ── Indexes for performance ───────────────────────────────────────────────────
create index if not exists product_files_product_id_idx on product_files(product_id);
create index if not exists product_updates_product_id_idx on product_updates(product_id);
create index if not exists product_reviews_product_id_idx on product_reviews(product_id);
create index if not exists affiliate_links_code_idx on affiliate_links(affiliate_code);
create index if not exists affiliate_clicks_link_id_idx on affiliate_clicks(affiliate_link_id);
