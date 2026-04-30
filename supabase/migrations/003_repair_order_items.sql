-- ============================================================
-- SellBop - Repair missing order_items table/policies
-- Migration: 003_repair_order_items.sql
--
-- Some Supabase projects may have partial schema state where
-- order_items was not created or is missing policies.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  product_id         uuid not null references products(id),
  product_variant_id uuid references product_variants(id),
  title              text not null,
  quantity           integer not null default 1,
  unit_price_cents   integer not null,
  line_total_cents   integer not null,
  created_at         timestamptz not null default now()
);

create index if not exists order_items_order_id_idx
  on order_items (order_id);

create index if not exists order_items_product_id_idx
  on order_items (product_id);

alter table order_items enable row level security;

drop policy if exists "order_items_select_related_order" on order_items;
create policy "order_items_select_related_order"
  on order_items for select
  using (
    exists (
      select 1
      from orders
      where orders.id = order_items.order_id
        and (
          orders.buyer_user_id = auth.uid()
          or orders.seller_user_id = auth.uid()
        )
    )
  );
