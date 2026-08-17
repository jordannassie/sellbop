-- OAuth 2.1 authorization server for the SellBop MCP endpoint.
--
-- Lets Claude (and other MCP clients) connect via the standard "Connect"
-- button in Claude's connector UI instead of manually pasting a bearer
-- token. Under the hood this still issues the exact same sk_agent_live_...
-- tokens used by the manual flow (agent_connections), so resolveAgentToken()
-- and every existing scope check keep working unmodified.
--
-- Idempotent / additive only — safe to re-run.

create table if not exists oauth_clients (
  id uuid primary key default gen_random_uuid(),
  client_id text unique not null,
  client_name text,
  redirect_uris text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists oauth_authorization_codes (
  code text primary key,
  client_id text not null references oauth_clients(client_id) on delete cascade,
  user_id uuid not null,
  redirect_uri text not null,
  code_challenge text not null,
  code_challenge_method text not null default 'S256',
  scope text,
  used boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists oauth_codes_expires_idx on oauth_authorization_codes(expires_at);

alter table oauth_clients enable row level security;
alter table oauth_authorization_codes enable row level security;

-- Both tables are only ever touched via the service-role client from the
-- OAuth route handlers (registration is unauthenticated by design per
-- RFC 7591; codes are single-use and short-lived). No public RLS policies
-- are needed since anon/authenticated clients never query these tables
-- directly.
