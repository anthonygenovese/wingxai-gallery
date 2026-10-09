# WingXAI MCP contract

**Status: not live.** `https://wingxai.gallery/mcp` is planned and is not deployed. Requests to that URL fail until someone deploys this server and the domain points at Vercel. The tool names and schemas below are the card's proposed contract, implemented in `/mcp-server` so they can be tested locally and, later, on a Vercel preview URL.

Source of truth for the schemas, frame card fields, and placeholder copy: [character-card.md](character-card.md) section 6. This file adds the HTTP behavior around that contract.

## Transport

Streamable HTTP, stateless. One process handles each JSON-RPC request on its own. There is no session id.

| Local path | Production path (not live) | Method | Purpose |
|---|---|---|---|
| `http://127.0.0.1:8787/health` | `https://<host>/mcp/health` | GET | Liveness. `live` is `false` until this is actually deployed at the public URL. |
| `http://127.0.0.1:8787/mcp` | `https://<host>/mcp` | POST | MCP JSON-RPC |
| `http://127.0.0.1:8787/` | same MCP service, if hit directly | POST | Same handler, so a service root also answers |

The local server accepts `/mcp` and `/` so the path in the style card works without a reverse proxy. On Vercel the public path is `/mcp` (see [deployment.md](deployment.md)). The Node server also accepts `/mcp/health`.

Recommended headers, matching the style card:

```http
Content-Type: application/json
Accept: application/json, text/event-stream
```

This scaffold answers `tools/call` with a single JSON body (`enableJsonResponse`). It does not require the `Accept` header. Send it anyway so a stricter MCP client stays compatible.

## Tools

| Tool | Required input | Sample |
|---|---|---|
| `search_monsters` | none (all filters optional) | [search_monsters.json](../mcp-server/samples/search_monsters.json) |
| `get_monster` | `id` | [get_monster.json](../mcp-server/samples/get_monster.json) |
| `get_monster_asset` | `id` | [get_monster_asset.json](../mcp-server/samples/get_monster_asset.json) |
| `get_style_card` | none | [get_style_card.json](../mcp-server/samples/get_style_card.json) |

Enums match the card: `mode` is `cute | menacing | minimal | detailed | parade | gallery-card`, `scheme` is `carbon | parade`, `light` is `red | green | red-green`, asset `size` is `thumb | medium | full`, asset `format` is `png | jpg | webp`.

`search_monsters.limit` defaults to 10 and must be from 1 to 50. The cursor is standard base64 of `{"offset":N}`, the same shape as the card's `eyJvZmZzZXQiOjJ9`.

`get_style_card` accepts `version` `0.4` or `latest`. Any other version is a bad argument.

## Provenance

Every tool payload includes this block, and the text content repeats the same statement:

```json
{
  "source": "wingxai.gallery",
  "license": "[license id]",
  "original_design": true,
  "real_people": false,
  "franchise_designs": false,
  "statement": "No real people. No franchise designs.",
  "references": "mood board, style only"
}
```

`real_people: false` means no real people. `franchise_designs: false` means no franchise designs. `license` is still the card's placeholder. On `get_monster` the block sits on the frame object, where the card put provenance. On the other tools it sits on the top-level `structuredContent`.

## Assets

The catalog only has committed SVG placeholders. `get_monster_asset` still accepts the card's `format` enum. The response says `served_format: "svg"`, returns the SVG URL, and explains that png, jpg, and webp crops are not generated yet. `expires_at` is `null` (URLs are not signed). `path` is host-relative so a preview host can use it when `url` still points at `https://wingxai.gallery`.

Set `WINGXAI_PUBLIC_ORIGIN` to override that host. The default is `https://wingxai.gallery`, which is not pointed yet.

## Errors

| Signal | When |
|---|---|
| JSON-RPC `-32602` | Bad arguments: unknown unit code, bad enum, bad cursor, unknown tool name, unknown style-card version |
| JSON-RPC `-32700` | Body is not JSON |
| JSON-RPC `-32600` | `tools/call` with no id |
| HTTP `429` + `Retry-After` | Rate limit. Default 60 requests per minute per IP. `/health` is exempt. |
| HTTP `401` + `WWW-Authenticate: Bearer` | API key gate is on and the bearer token is missing or wrong. `/health` is exempt. |
| HTTP `503` | Gate is on but `WINGXAI_API_KEY` is empty. Fail closed. |

The official SDK wraps tool exceptions as `result.isError`. This server handles `tools/call` before that wrapper so the card's `-32602` is the actual JSON-RPC error. `tools/list`, `initialize`, and other methods go through the SDK.

## Rate limit and API key

| Variable | Default | Meaning |
|---|---|---|
| `WINGXAI_RATE_LIMIT_PER_MIN` | `60` | Requests per minute per IP. `0` turns the limiter off. |
| `WINGXAI_API_KEY_REQUIRED` | off | `true`, `1`, `yes`, or `on` requires a bearer token. |
| `WINGXAI_API_KEY` | empty | The token, compared in constant time. |

The limiter is in-memory and per process. It is not a global account-wide cap once more than one instance is running. The client address is `x-real-ip`, then the first `x-forwarded-for` hop, then the socket address. Vercel sets those headers. A client that can reach the process directly can spoof `x-forwarded-for`.

Read access is public unless the gate is turned on. That is the open question in the style card, decided for this scaffold as public-by-default.

## Try the samples locally

From `/mcp-server`, after `npm install`:

```bash
npm run dev
```

In another shell:

```bash
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data @samples/search_monsters.json
```

Repeat with `samples/get_monster.json`, `samples/get_monster_asset.json`, and `samples/get_style_card.json`.

`npm run smoke` starts the server, runs those four bodies, and checks `/health`, `-32602`, the API key gate, and a 2-per-minute limit.
