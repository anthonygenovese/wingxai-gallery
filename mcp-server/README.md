# WingXAI MCP server

**Not live.** `https://wingxai.gallery/mcp` is not deployed. This package is the local server and the Vercel function entry for a later deploy. `/health` returns `"live": false` on purpose.

Streamable HTTP MCP server. It reads [`/data/monsters.json`](../data/monsters.json) and the style card at [`/docs/character-card.md`](../docs/character-card.md). Tool schemas match the style card: `search_monsters`, `get_monster`, `get_monster_asset`, `get_style_card`.

## Run locally

Node 22 or newer.

```bash
cd mcp-server
npm install
npm run dev
```

The process listens on `0.0.0.0:8787` unless `PORT` or `HOST` is set. Startup prints a not-live line.

```bash
curl -s http://127.0.0.1:8787/health
curl -s http://127.0.0.1:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data @samples/search_monsters.json
```

The other sample bodies are `samples/get_monster.json`, `samples/get_monster_asset.json`, and `samples/get_style_card.json`. `npm run smoke` boots the server and checks health, all four tools, bad arguments, the API key gate, and the rate limit.

Optional env vars are listed in [`.env.example`](.env.example). The API key gate is off unless `WINGXAI_API_KEY_REQUIRED` is set. The rate limit defaults to 60 requests per minute per IP.

`npm run typecheck` runs `tsc --noEmit`. Vercel compiles `src/server.ts` itself; there is no separate emit step.

## Deploy

Do not treat this README as a deploy that already happened. Full notes are in [`/docs/deployment.md`](../docs/deployment.md).

The intended shape is one Vercel project using Services (Beta), root [`vercel.json`](../vercel.json):

- Service `mcp`, root `mcp-server`, entry `src/server.ts`. Vercel turns that `listen()` server into a Function.
- Public traffic for `/mcp` and `/mcp/health` is rewritten to that service.
- The gallery is a second service in the same deployment, so a preview URL can call `https://<deployment>.vercel.app/mcp` before `wingxai.gallery` exists.

`https://wingxai.gallery/mcp` stays unwired until that deploy exists and DNS for `wingxai.gallery` points at Vercel. Neither step has been run.

The contract, error codes, and provenance block are documented in [`/docs/mcp-contract.md`](../docs/mcp-contract.md).
