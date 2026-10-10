# Deployment notes

Nothing in this repository has been deployed. `wingxai.gallery` is not pointed at Vercel. `https://wingxai.gallery/mcp` is not live. Preview URLs are the first place either app should be opened.

## What gets deployed

One Vercel project, two services, configured in the root `vercel.json`. [Vercel Services](https://vercel.com/docs/services) is in **Beta**.

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

## Rename readiness

The brand name and the domain are both swappable without a redesign. The visual DNA — carbon fiber, LED strips, original gold crest, frame card layout — does not depend on what the brand is called. Two things can change at a drop of a dime: the brand name (WingXAI → WingX, or anything else) and the domain (`wingxai.gallery` → `wingx.gallery`, or anything else). This section is the procedure for both.

### What is already flexible

- **Public origin is one env var.** `WINGXAI_PUBLIC_ORIGIN` in `mcp-server/src/catalog.ts` (`publicOrigin()`) is the only place asset URLs are built. Change the env var on the Vercel project and every absolute URL in tool payloads retargets. No code change.
- **Host-relative paths always exist.** Every search hit and asset payload also carries a `path` field that is host-relative, so consumers that ignore the absolute URL are unaffected by a domain swap.
- **The Vercel project is domain-agnostic.** `vercel.json` has no domain in it. Adding or swapping a custom domain is a Vercel project setting, not a repo change. Preview URLs (`*.vercel.app`) work before any domain exists, which is the whole point of the current setup.
- **The unit code pattern is permanent.** `WX-[##]` is the lineage spine. Every generation traces back through it. It survives any brand rename — the code is the identity, not the name.

### What changes on a brand rename

A rename (WingXAI → WingX, or anything else) touches these files. It is a find-and-replace, not a redesign:

| File | What changes |
|---|---|
| `docs/character-card.md` | Header line (`Brand: WingXAI`), base prompt (`[WingXAI style]`), frame card header (`WINGXAI · PROTOTYPE FRAME`), provenance statement |
| `mcp-server/src/style-card.ts` | Mirrored card content — must stay in sync with the markdown |
| `mcp-server/src/provenance.ts` | `source` field, `statement`, `provenanceLine()` |
| `mcp-server/src/server.ts` | MCP server name (`wingxai`), startup log lines, `NOT_LIVE` string |
| `README.md` | Title and description |
| `docs/deployment.md`, `docs/seed-frame.md`, `docs/evolution-spec.md`, `docs/rejected-prototypes.md`, `docs/reply-bot-branches.md` | References to the brand name |

The visual DNA, the frame card layout, the seed frame, and the lineage log are untouched. The rename is a text pass, then a rebuild.

### What changes on a domain swap

A domain swap (`wingxai.gallery` → `wingx.gallery`, or anything else) is mostly configuration:

1. **Buy or claim the new domain** before touching anything. Check that it is not already taken by an unrelated party — the failure mode to avoid is launching and discovering the domain points at someone else's product.
2. **Add the new domain in the Vercel project.** Vercel handles the DNS records it needs (CNAME to `cname.vercel-dns.com`, or the A/ALIAS record it shows for apex domains).
3. **Set `WINGXAI_PUBLIC_ORIGIN`** on the Vercel project to the new origin. This retargets every absolute URL in MCP payloads.
4. **Update the hardcoded references** in `mcp-server/src/server.ts` (the `NOT_LIVE` string and the `/health` `endpoint` field), `mcp-server/.env.example`, `README.md`, and `docs/character-card.md` (the gallery URL in the header). These are the only places the domain is written as a literal.
5. **Keep the old domain alive if possible.** A redirect from the old domain to the new one preserves any links already shared. If the old domain cannot be kept, accept that old links die — the host-relative `path` fields in payloads soften the blow for API consumers.
6. **Redeploy.** Nothing else in the repo needs to change.

### What never changes

- **`WX-[##]` unit codes.** The lineage spine. Renaming the brand does not renumber the frames.
- **The seed frame (WX-00).** Immutable regardless of name or domain.
- **The visual DNA.** Carbon fiber, red or green LED strips, original gold crest. The style survives any rename.
- **The frame card layout.** The owner's original template is the canonical layout; a rename does not redesign it.

### Pre-launch checklist

Before the first real deployment, confirm:

- [ ] The intended domain is owned and not pointed at anything else.
- [ ] A fallback domain is registered or at least searched, in case the primary is unavailable or the brand renames.
- [ ] `WINGXAI_PUBLIC_ORIGIN` is set correctly on the Vercel project (or left at the safe default).
- [ ] The rename file list above has been reviewed so a future rename is a known, bounded task.
- [ ] The unit code pattern `WX-[##]` is accepted as permanent.
