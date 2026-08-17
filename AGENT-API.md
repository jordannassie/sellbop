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
