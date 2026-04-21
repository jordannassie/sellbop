-- ─────────────────────────────────────────────────────────────────────────────
-- SellBop — Initial Schema
-- Migration: 001_initial_schema.sql
--
-- HOW TO RUN:
--   Paste the contents of this file into the Supabase SQL editor
--   (Dashboard → SQL Editor → New query) and click Run.
--
-- Or with the Supabase CLI:
--   supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Seller storefronts — one per user/seller account
create table stores (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  slug          text unique not null,
  name          text not null,
  headline      text,
  bio           text,
  avatar_url    text,
  header_layout text default 'side',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Products — digital downloads, services, clothing (Printify), etc.
create table products (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references stores(id) on delete cascade,
  title                text not null,
  slug                 text not null,
  product_type         text not null,
  short_description    text,
  description          text,
  image_url            text,
  price_cents          integer,
  min_price_cents      integer,
  max_price_cents      integer,
  -- Printify / external product fields
  external_source      text,           -- 'printify' | null
  external_product_id  text,
  fulfillment_provider text,           -- 'printify' | null
  is_live              boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  unique(store_id, slug)
);

-- Variants for clothing/Printify products (sizes, colors, SKUs)
create table product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  external_variant_id text,
  color               text,
  size                text,
  sku                 text,
  retail_price_cents  integer,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

-- Controls what products are visible/featured on each store (Store Editor state)
create table store_product_visibility (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  is_visible  boolean default false,
  is_featured boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  unique(store_id, product_id)
);

-- Orders placed on a store
create table orders (
  id                    uuid primary key default gen_random_uuid(),
  store_id              uuid not null references stores(id) on delete cascade,
  buyer_name            text,
  buyer_email           text,
  buyer_phone           text,
  -- Shipping address (for Printify clothing orders)
  shipping_name         text,
  shipping_address_1    text,
  shipping_address_2    text,
  shipping_city         text,
  shipping_state        text,
  shipping_postal_code  text,
  shipping_country      text,
  subtotal_cents        integer not null,
  shipping_cents        integer default 0,
  total_cents           integer not null,
  status                text default 'pending',   -- pending | paid | refunded | cancelled
  payment_status        text default 'pending',   -- pending | paid | failed
  fulfillment_provider  text,                     -- 'printify' | null
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- Line items within an order
create table order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  product_id         uuid not null references products(id),
  product_variant_id uuid references product_variants(id),
  title              text not null,
  quantity           integer not null default 1,
  unit_price_cents   integer not null,
  line_total_cents   integer not null,
  created_at         timestamptz default now()
);

-- Printify API token + shop binding per user
-- token_encrypted is reserved for future server-side encryption
create table printify_connections (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  shop_id         text not null,
  token_encrypted text,
  is_connected    boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Tracks external fulfillment (Printify order submission + status)
create table fulfillment_orders (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  provider           text not null,             -- 'printify'
  external_order_id  text,
  status             text default 'pending',    -- pending | submitted | fulfilled | error
  raw_response_json  jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
