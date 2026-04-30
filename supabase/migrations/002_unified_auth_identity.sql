-- ============================================================
-- SellBop - Unified Auth Identity
-- Migration: 002_unified_auth_identity.sql
--
-- Adds one shared auth identity model across buyers and sellers.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stores'
      and column_name = 'user_id'
  ) then
    alter table stores rename column user_id to owner_user_id;
  end if;
end $$;

alter table stores
  add column if not exists owner_user_id uuid;

alter table stores
  alter column owner_user_id set not null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'stores'
      and constraint_name = 'stores_owner_user_id_fkey'
  ) then
    alter table stores
      add constraint stores_owner_user_id_fkey
      foreign key (owner_user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

alter table orders
  add column if not exists buyer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists seller_user_id uuid references auth.users(id) on delete set null;

update orders o
set seller_user_id = s.owner_user_id
from stores s
where s.id = o.store_id
  and o.seller_user_id is null;

create table if not exists purchases (
  id             uuid primary key default gen_random_uuid(),
  buyer_user_id  uuid references auth.users(id) on delete set null,
  buyer_email    text not null,
  product_id     uuid not null references products(id) on delete cascade,
  order_id       uuid not null references orders(id) on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(order_id)
);

create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete set null,
  customer_email         text not null,
  product_id             uuid not null references products(id) on delete cascade,
  status                 text not null default 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  canceled_at            timestamptz,
  amount_cents           integer,
  currency               text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_idx
  on profiles (lower(email));

create index if not exists stores_owner_user_id_idx
  on stores (owner_user_id);

create index if not exists orders_buyer_user_id_idx
  on orders (buyer_user_id);

create index if not exists orders_seller_user_id_idx
  on orders (seller_user_id);

create index if not exists orders_buyer_email_lower_idx
  on orders (lower(buyer_email));

create index if not exists purchases_buyer_user_id_idx
  on purchases (buyer_user_id);

create index if not exists purchases_buyer_email_lower_idx
  on purchases (lower(buyer_email));

create index if not exists subscriptions_user_id_idx
  on subscriptions (user_id);

create index if not exists subscriptions_customer_email_lower_idx
  on subscriptions (lower(customer_email));

alter table profiles enable row level security;
alter table stores enable row level security;
alter table orders enable row level security;
alter table purchases enable row level security;
alter table subscriptions enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "stores_select_public_or_owner" on stores;
create policy "stores_select_public_or_owner"
  on stores for select
  using (true);

drop policy if exists "stores_insert_owner" on stores;
create policy "stores_insert_owner"
  on stores for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "stores_update_owner" on stores;
create policy "stores_update_owner"
  on stores for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "orders_select_buyer_or_seller" on orders;
create policy "orders_select_buyer_or_seller"
  on orders for select
  using (
    auth.uid() = buyer_user_id
    or auth.uid() = seller_user_id
    or exists (
      select 1
      from stores s
      where s.id = orders.store_id
        and s.owner_user_id = auth.uid()
    )
  );

drop policy if exists "purchases_select_own" on purchases;
create policy "purchases_select_own"
  on purchases for select
  using (auth.uid() = buyer_user_id);

drop policy if exists "subscriptions_select_own" on subscriptions;
create policy "subscriptions_select_own"
  on subscriptions for select
  using (auth.uid() = user_id);
