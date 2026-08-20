# SellBop Agent API — Connecting Claude & Other AI Tools

This document explains how an external AI agent (Claude, ChatGPT, Cursor, Higgsfield, or any
custom client) authenticates to a SellBop seller's account and what it can do. It covers two
equivalent surfaces backed by the same code:

- **MCP server** — `POST/GET https://<your-domain>/api/mcp` (recommended for Claude and other
  MCP-speaking clients).
- **REST API** — `https://<your-domain>/api/agent/v1/*` (for any HTTP-capable client).

Both are scoped, token-authenticated, and log every write to an activity feed the seller can see
in **Settings → AI & Integrations**.

---

## 1. Getting a token (the seller does this)

1. Seller logs into their SellBop dashboard → **Settings → AI & Integrations** → **Connect a tool**.
2. Picks a provider label (Claude / Higgsfield / ChatGPT / Other), names the connection, and
   checks the permissions ("scopes") they want to grant:
   - `products:read` — view store & product details
   - `products:write` — create/edit/publish/unpublish products
   - `files:write` — upload downloadable files and images
   - `affiliates:write` — enable/disable affiliates, set commission %
3. SellBop generates a token of the form `sk_agent_live_…` and shows it **once**. Only its SHA-256
   hash is stored server-side — SellBop itself cannot recover the raw token afterward.
4. The seller pastes that token into their AI tool's connection settings (see §3/§4 below).
5. Revoking a connection (same page) immediately invalidates the token for all future requests.

The token is scoped to **one seller's store only**. It can never be used to act on any other
seller's account, and it can never read or use the Supabase service-role key, Stripe secret key,
or any other platform credential — those never leave the server process.

## 2. What the token can (and can't) do

Every action below runs through the same ownership checks the SellBop dashboard itself uses, and
every call — success or failure — is written to that seller's AI activity log.

| Capability | Requires scope |
|---|---|
| `get_store`, `get_products`, `get_product` | `products:read` |
| `create_product`, `update_product`, `set_product_description`, `set_product_price`, `set_primary_product_image`, `save_product_as_draft`, `publish_product`, `unpublish_product` | `products:write` |
| `upload_product_file`, `attach_product_file`, `upload_product_image` | `files:write` |
| `enable_affiliates`, `disable_affiliates`, `set_affiliate_commission` | `affiliates:write` |

**Never exposed to agent tokens, in this or any future phase without a separate confirmation
flow:** deleting a product, issuing refunds, changing payout/bank details, or changing Stripe
account settings. These require the seller to act directly in the dashboard.

Newly created products always start as **drafts** (`is_live: false`) unless the caller explicitly
sets `is_live: true` — an agent can never silently take a product live.

## 3. Connecting Claude (MCP)

Claude (and other MCP clients such as Cursor, Windsurf, or Claude Code) can connect directly to:

```
https://<your-domain>/api/mcp
```

using Streamable HTTP with a bearer token. For clients with a UI-based "Add remote MCP server"
flow, enter the URL above and supply the token as the `Authorization` header:

```
Authorization: Bearer sk_agent_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

For CLI-based / config-file clients (e.g. Claude Code's `.mcp.json`, or any client using
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) for stdio bridging):

```json
{
  "mcpServers": {
    "sellbop": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-domain>/api/mcp",
               "--header", "Authorization: Bearer sk_agent_live_xxxxxxxxxxxxxxxxxxxxxxxx"]
    }
  }
}
```

Once connected, Claude will see the full Phase 1 tool list (get_store, get_products,
create_product, upload_product_file, publish_product, etc.) with descriptions and JSON schemas
supplied automatically by the MCP server — no separate API docs are required for Claude to use
them correctly.

## 4. Connecting anything else (REST)

Any HTTP client can call the REST surface directly with the same bearer token:

```bash
curl https://<your-domain>/api/agent/v1/products \
  -H "Authorization: Bearer sk_agent_live_xxxxxxxxxxxxxxxxxxxxxxxx"
```

### Endpoints

| Method | Path | Action |
|---|---|---|
| GET | `/api/agent/v1/store` | get_store |
| GET | `/api/agent/v1/products` | get_products |
| POST | `/api/agent/v1/products` | create_product |
| GET | `/api/agent/v1/products/[id]` | get_product |
| PATCH | `/api/agent/v1/products/[id]` | update_product (and every `set_*`/`enable_*`/`disable_*` field-level action — see below) |
| POST | `/api/agent/v1/products/[id]/files` | upload_product_file / attach_product_file |
| POST | `/api/agent/v1/products/[id]/images` | upload_product_image / set_primary_product_image |
| POST | `/api/agent/v1/products/[id]/publish` | publish_product |
| POST | `/api/agent/v1/products/[id]/unpublish` | unpublish_product / save_product_as_draft |

`PATCH /api/agent/v1/products/[id]` accepts any subset of: `title`, `slug`, `description`,
`short_description`, `price_cents`, `cover_image_url`, `is_live`, `category`,
`marketplace_listing`, `affiliate_enabled`, `affiliate_commission_percent`, `access_message`,
`checkout_copy`. Send only the fields you want to change — e.g. `{"price_cents": 4900}` is exactly
`set_product_price`, and `{"affiliate_enabled": true, "affiliate_commission_percent": 30}` is
`enable_affiliates` + `set_affiliate_commission` in one call.

### Uploading a file or image

Send base64-encoded bytes directly — no separate storage step required:

```bash
curl -X POST https://<your-domain>/api/agent/v1/products/<product_id>/files \
  -H "Authorization: Bearer sk_agent_live_…" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "airbnb-host-guide.pdf",
    "mime_type": "application/pdf",
    "base64_data": "<base64 bytes>"
  }'
```

Images work the same way against `/images` and, by default, also set the product's cover image:

```bash
curl -X POST https://<your-domain>/api/agent/v1/products/<product_id>/images \
  -H "Authorization: Bearer sk_agent_live_…" \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "cover.png",
    "mime_type": "image/png",
    "base64_data": "<base64 bytes>",
    "set_primary": true
  }'
```

Limits: files up to 100 MB, images up to 5 MB (same limits as the dashboard upload UI).

### Errors

All errors return `{ "error": "message" }` with an appropriate status code: `401` (missing/invalid
token), `403` (token valid but missing the required scope, or acting outside its own store),
`404` (not found / not owned by this token), `400` (bad input), `500` (server error).

---

## 5. End-to-end example: "Create me a $49 product for Airbnb hosts"

1. Agent calls `create_product` with `title`, `description`, `price_cents: 4900`. Product is
   created as a draft.
2. Agent generates the guide content and calls `set_product_description`.
3. Agent generates/receives a cover image from an external tool (e.g. Higgsfield) and calls
   `upload_product_image`.
4. Agent generates the downloadable file and calls `upload_product_file`.
5. Agent calls `set_affiliate_commission` with `30`.
6. Agent stops — the product stays a **draft** (`save_product_as_draft` is the default state; the
   agent never calls `publish_product` unless the user explicitly asked it to go live).
7. Seller reviews the draft in their dashboard, then publishes it themselves (or asks the agent to
   call `publish_product`, which they can revoke access for at any time).

Every step above is visible in **Settings → AI & Integrations → AI Activity**.

---

## 6. Claude E-Com V1 — Universal Autonomous Shop Builder

Claude E-Com extends the Phase 1 agent API so Claude can operate an entire SellBop shop end-to-end: discovery, branding, catalog creation, media, affiliates, audit, and analytics.

### Connection model

Each connection belongs to a user and has an **access mode**:

| Mode | Behavior |
|---|---|
| `single_shop` | Token is bound to one shop (`store_id`). Claude cannot access other shops. |
| `all_managed_shops` | Claude may list and operate any shop the user can manage via `store_members` / ownership. |

Create connections in **Settings → AI & Integrations** or via `POST /api/agent-connections` with:

```json
{
  "name": "Claude E-Com",
  "provider": "claude",
  "claude_ecom": true,
  "access_mode": "single_shop"
}
```

Recommended Claude E-Com scopes: `shops:read`, `shops:write`, `products:read`, `products:write`, `files:write`, `affiliates:write`, `analytics:read`.

Legacy tokens using `products:read` / `products:write` remain compatible (scope aliases).

### Complete MCP tool list (V1)

**Shop discovery & branding:** `list_shops`, `get_shop`, `get_shop_by_slug`, `create_shop`, `update_shop`, `set_shop_avatar`, `set_shop_banner`, `get_storefront_configuration`, `get_shop_preview_url`, `audit_shop`, `get_shop_snapshot`

**Products (Phase 1 preserved):** `get_store`, `get_products`, `list_products`, `get_product`, `create_product`, `update_product`, `set_product_description`, `set_product_price`, `set_product_sale_price`, `save_product_as_draft`, `publish_product`, `unpublish_product`

**Catalog:** `reorder_products`, `duplicate_product`, `list_product_files`

**Media & files:** `upload_product_file`, `attach_product_file`, `upload_product_image`, `set_primary_product_image`, `add_product_gallery_image`

**Affiliates:** `enable_affiliates`, `disable_affiliates`, `set_affiliate_commission`

**Analytics (read-only):** `get_shop_sales_summary`, `get_product_sales_summary`

**Creative Factory (V1.1):** `get_creative_capabilities`, `generate_product_image`, `generate_shop_banner`, `generate_product_pdf`, `build_product_assets`

See [Claude E-Com Creative Factory](#claude-e-com-creative-factory-v11) below.

### Safety (unchanged + extended)

- No raw SQL, service-role keys, Stripe secrets, refunds, or payout modification
- New products default to **draft** (`is_live: false`)
- Partner Shop creation requires platform admin + uses existing 50/50 Partnership economics
- All writes logged to `agent_activity_log` with `store_id` when migration 032 is applied

### REST equivalents (partial)

| MCP tool | REST |
|---|---|
| `list_shops` | `GET /api/agent/v1/shops` |
| `get_shop_snapshot` | `GET /api/agent/v1/shops/:id?view=snapshot` |
| `audit_shop` | `GET /api/agent/v1/shops/:id?view=audit` |
| Phase 1 product tools | `/api/agent/v1/products/*` (unchanged) |

---

## Claude E-Com Example

Build a 10-product draft business for an influencer:

1. `list_shops` — find or confirm target shop
2. `create_shop` (admin + `partner_mode: true`) or `update_shop` — configure name, bio, support email
3. `set_shop_banner` / `set_shop_avatar` — upload branding (or `generate_shop_banner` when configured)
4. Loop 10×: `create_product` (draft) → `set_product_description` → `set_product_price` → `enable_affiliates` → `upload_product_image` → `upload_product_file`
5. `reorder_products` — arrange pricing ladder
6. `audit_shop` — verify completeness
7. `get_shop_preview_url` — return private preview for human review

Products remain **draft** until the seller explicitly publishes.

### Acceptance test

```bash
node scripts/agent-acceptance-test.mjs
```

Requires `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `BASE_URL`.

---

## Claude E-Com Creative Factory (V1.1)

Creative Factory turns Claude E-Com from catalog CRUD into a full asset builder: generated covers, shop banners, and premium downloadable PDFs — stored and attached automatically.

### Environment

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Enables DALL-E image generation (`generate_product_image`, `generate_shop_banner`) |
| *(none required)* | PDF generation uses built-in SellBop PDF renderer (`pdfkit`) |

If `OPENAI_API_KEY` is missing, image tools return `provider_not_configured`. PDF tools always work.

### Provider abstraction

- `src/lib/creative/image-provider.ts` — provider interface
- `src/lib/creative/providers/openai-image.ts` — OpenAI DALL-E 3 (first provider)
- `src/lib/creative/pdf-renderer.ts` — premium US Letter PDF layout
- `src/lib/creative/creative-service.ts` — auth, storage, attachment, logging

Additional image providers can be added without changing MCP tool names.

### Creative MCP tools

| Tool | Description |
|---|---|
| `get_creative_capabilities` | Returns available/unavailable status for image, banner, PDF generation |
| `generate_product_image` | Generate square cover (default) or gallery image; auto-upload + attach |
| `generate_shop_banner` | Generate wide banner; updates `stores.banner_url` |
| `generate_product_pdf` | Render premium PDF from structured content; upload + attach as delivery file |
| `build_product_assets` | Orchestrates cover + optional gallery images + PDF + audit snapshot |

### Brand consistency

Pass optional `brand_context` on any creative tool:

```json
{
  "brand_name": "GlowWell",
  "audience": "Women 30–45",
  "visual_direction": "Soft wellness minimalism",
  "photography_style": "Natural light, muted greens",
  "image_mood": "Calm, premium, trustworthy",
  "exclusions": "No neon colors or clip art"
}
```

SellBop merges brand context with shop/product fields when building prompts.

### Structured PDF input

```json
{
  "shop_id": "...",
  "product_id": "...",
  "title": "30-Day Reset Guide",
  "subtitle": "For busy women",
  "sections": [
    { "heading": "Week 1", "body": "Foundation habits...", "bullets": ["Hydration", "Sleep"] },
    { "heading": "Week 2", "callout": "Progress, not perfection." }
  ],
  "include_health_disclaimer": true
}
```

The renderer does **not** invent claims — it only layouts content Claude provides.

### Error codes

`provider_not_configured`, `generation_failed`, `invalid_product`, `unauthorized_shop`, `storage_failed`, `attachment_failed`, `timeout`, `rate_limited`

### Draft behavior

All generated products remain **draft**. Creative tools never auto-publish.

### Example workflow — one shop, three products, assets, audit

1. `get_creative_capabilities`
2. `update_shop` — name, bio
3. `generate_shop_banner` — with shared `brand_context`
4. For each of 3 products:
   - `create_product` (draft)
   - `set_product_description` + `set_product_price`
   - `generate_product_image` (`image_type: product_cover`, `make_primary: true`)
   - `generate_product_pdf` — structured sections
   - `enable_affiliates`
5. `reorder_products` — pricing ladder
6. `audit_shop` — verify covers, PDFs, prices, descriptions
7. `get_shop_preview_url`

Or use `build_product_assets` per product to orchestrate cover + PDF in one call.

### Creative acceptance test

```bash
npm run test:creative
```

### Usage tracking

Migration **033** adds `creative_generation_usage` for per-user generation counts and future billing limits (40/hour default).

```bash
npm run db:apply-033   # requires DATABASE_URL
```

### Database

Migration **032** adds `access_mode` to `agent_connections` and `store_id` to `agent_activity_log`:

```bash
npm run db:apply-032   # requires DATABASE_URL
```

Apply to production before deploying code that writes `access_mode` / `store_id`.
