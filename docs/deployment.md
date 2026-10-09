# Deployment notes

Nothing in this repository has been deployed. `wingxai.gallery` is not pointed at Vercel. `https://wingxai.gallery/mcp` is not live. Preview URLs are the first place either app should be opened.

## What gets deployed

One Vercel project, two services, configured in the root [`vercel.json`](../vercel.json). [Vercel Services](https://vercel.com/docs/services) is in **Beta**.

| Service | Root | What Vercel runs | Public paths |
|---|---|---|---|
| `gallery` | `/gallery` | Astro static build | `/`, `/m/:id`, `/card`, `/merch`, `/assets/*` |
| `mcp` | `/mcp-server` | Node server `src/server.ts` (`server.listen`) as a Function | `/mcp`, `/mcp/health` |

The gallery build reads `/data/monsters.json` and `/docs/character-card.md` from the repo. The MCP function reads the same files at runtime. `includeFiles` on `src/server.ts` lists `../data/**` and `../docs/character-card.md` so those files are packaged with the function. The read paths in code are also static `file:` URLs from `mcp-server/src`, which the file tracer can follow.

## Why one project with two services

The gallery and the MCP server stay separate build roots with their own `package.json`. They still ship in one deployment, so a preview URL serves both before any custom domain exists:

- `https://<deployment>.vercel.app/` is the gallery
- `https://<deployment>.vercel.app/mcp` is the MCP server
- `https://<deployment>.vercel.app/mcp/health` is liveness

That matches the requirement that everything work on a Vercel preview URL first. The Node server accepts `/mcp` and `/mcp/health` as well as `/` and `/health`, so the public prefix does not have to be stripped.

A rewrite to a second project's URL would not do this. Each project would have its own preview host, and `/mcp` on the gallery preview would point at whichever MCP deployment was hard-coded, not at the matching preview.

If the Beta flag is unavailable, use two Vercel projects instead:

1. Gallery project, root directory `gallery`, framework Astro.
2. MCP project, root directory `mcp-server`, same `src/server.ts` entry. Its preview URL serves `/health` and `/mcp` on that host.
3. After the MCP project has a stable URL, add a rewrite on the gallery project from `/mcp` and `/mcp/(.*)` to that URL. Until then, the two previews are separate hosts. Same-host `/mcp` waits on that rewrite.

Services is the setup in `vercel.json` because the preview host has to carry both.

## Domain

Do this later, in the Vercel project that owns the deployment. It is not done.

- Add `wingxai.gallery` to the project.
- DNS: `wingxai.gallery` CNAME to Vercel (`cname.vercel-dns.com`), which is what the owner asked for.
- `wingxai.gallery` is the zone apex. Some DNS hosts reject a CNAME there. If that happens, use the A or ALIAS record the Vercel domain screen shows when the domain is added (Vercel's published apex address is `76.76.21.21`). Do not invent a second target.
- Leave the domain unassigned until a preview deployment of this repo looks right. The site and `/mcp` must already work on the `*.vercel.app` URL.

Asset URLs inside MCP payloads default to `https://wingxai.gallery/...`. Until DNS exists, set `WINGXAI_PUBLIC_ORIGIN` on the deployment to the preview origin, or use the host-relative `path` field.

## Environment

Set these on the Vercel project if you need them. Defaults are safe for a first preview: public read, 60 requests per minute per instance, links aimed at the not-yet-pointed domain.

| Variable | Default |
|---|---|
| `WINGXAI_RATE_LIMIT_PER_MIN` | `60` |
| `WINGXAI_API_KEY_REQUIRED` | off |
| `WINGXAI_API_KEY` | unset |
| `WINGXAI_PUBLIC_ORIGIN` | `https://wingxai.gallery` |

The rate limit is per server instance, not a shared counter. Say so if you turn the public URL on later.

## Not live

Code comments in `mcp-server/src/server.ts` and the `/health` body say the production endpoint is not live. Deploying a preview does not by itself make `https://wingxai.gallery/mcp` live. That URL stays dark until the domain is attached and DNS resolves.
