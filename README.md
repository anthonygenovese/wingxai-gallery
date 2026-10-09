# WingXAI gallery

Original Prototype Frame art for the WingXAI robot-monster brand. The public site is a static gallery. A separate MCP server reads the same catalog. The intended domain is `wingxai.gallery`.

That domain is not pointed at this repo. The MCP URL `https://wingxai.gallery/mcp` is not live. Nothing here has been deployed.

```
                    wingxai.gallery
                    CNAME to Vercel
                    NOT POINTED YET
                           |
                           |   one Vercel project (Services, Beta)
                           |   preview URL works before DNS
                           |
           +---------------+----------------+
           |                                |
     service: gallery                 service: mcp
     root: /gallery                   root: /mcp-server
     Astro static                     Node Function (src/server.ts)
           |                                |
     /                 grid            /mcp            JSON-RPC tools
     /m/WX-01          frame           /mcp/health     live: false
     /card             style card
     /merch            coming soon
           |                                |
           +---------------+----------------+
                           |
                  /data/monsters.json
                  /docs/character-card.md
```

The style card in `/docs/character-card.md` is the source of truth for the visual rules, the frame card fields, and the four MCP tools. It was copied in as drafted. The five frames in `/data/monsters.json` are fictional placeholders with committed SVG drawings.

## Gallery

Static [Astro](https://astro.build) site in `/gallery`. Astro is the static generator: one data file drives the grid and the frame pages, and `astro build` emits plain HTML. No server adapter.

```bash
cd gallery
npm install
npm run dev      # http://127.0.0.1:4321
npm run build    # writes gallery/dist
```

| Path | Page |
|---|---|
| `/` | Gallery grid |
| `/m/WX-01` | Frame dossier (also WX-04, WX-07, WX-12, WX-15) |
| `/card` | The style card, rendered from `/docs/character-card.md` |
| `/merch` | Coming soon. Nothing is for sale. |

Images are `/gallery/public/assets/*.svg`, drawn by `gallery/scripts/render-placeholders.mjs`. They are not hotlinked.

## MCP server

TypeScript server in `/mcp-server`. Local run, sample JSON-RPC bodies, and the Vercel function notes are in [`mcp-server/README.md`](mcp-server/README.md). The contract is [`docs/mcp-contract.md`](docs/mcp-contract.md).

```bash
cd mcp-server
npm install
npm run dev      # http://127.0.0.1:8787/health and /mcp
npm run smoke    # health, four tools, 401, 429
```

Tools: `search_monsters`, `get_monster`, `get_monster_asset`, `get_style_card`. Each payload includes a provenance block (`source: wingxai.gallery`, license placeholder, `original_design: true`, no real people, no franchise designs).

## Deploy

Not run. The plan is in [`docs/deployment.md`](docs/deployment.md).

- One Vercel project. Root [`vercel.json`](vercel.json) declares two Services (Beta): the gallery builds as a static site from `/gallery`, and the MCP server builds as a Node Function from `/mcp-server`.
- Rewrites send `/mcp` and `/mcp/health` to the MCP service and everything else to the gallery. A preview deployment therefore serves both, which is what has to work before the custom domain exists.
- DNS, later: `wingxai.gallery` CNAME to Vercel. The name is a zone apex, so a host that rejects apex CNAMEs should use the record Vercel shows on the domain screen. Do not point it until a preview looks right.

GitHub Actions (`.github/workflows/build.yml`) builds the gallery and type-checks the MCP server on push. It does not deploy.
