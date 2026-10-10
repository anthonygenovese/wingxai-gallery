# Domain registry

The brand name and the domain are both swappable. This file is the single source of truth for which domains are owned, which is primary, and which is the fallback. Update it whenever a domain is bought, swapped, or dropped.

## Primary

| Domain | Status | Notes |
|---|---|---|
| `wingxai.gallery` | Owned, not yet pointed at Vercel | The current default. `WINGXAI_PUBLIC_ORIGIN` defaults to `https://wingxai.gallery`. DNS is a CNAME to `cname.vercel-dns.com` (or the A/ALIAS record Vercel shows for the apex). |

## Fallback

| Domain | Status | Notes |
|---|---|---|
| `wingx.gallery` | Owned, not pointed anywhere | Registered as insurance. If `wingxai.gallery` is ever unavailable, blocked, or the brand renames, this is the swap target. The swap procedure is in [deployment.md](deployment.md) — set `WINGXAI_PUBLIC_ORIGIN` to the new origin, update the handful of hardcoded domain strings, redeploy. |

## Rules

- **Never launch on a domain you do not own.** The failure mode to avoid is shipping and discovering the domain points at someone else's product.
- **The fallback stays dark until needed.** No links, no cards, no MCP payloads should reference it while `wingxai.gallery` is primary. It exists so the swap is a configuration change, not a scramble.
- **The unit code pattern `WX-[##]` is permanent** and survives any domain or brand change. The lineage spine does not depend on the domain.
- **Old domains get redirected when possible.** If `wingxai.gallery` is ever retired in favor of `wingx.gallery`, keep a redirect from the old domain to the new one so existing links do not die.

## Swap checklist

When moving from primary to fallback (or any future domain):

1. Confirm the target domain is owned and resolves to nothing conflicting.
2. Add it in the Vercel project.
3. Set `WINGXAI_PUBLIC_ORIGIN` to the new origin.
4. Update hardcoded domain strings in `mcp-server/src/server.ts`, `mcp-server/.env.example`, `README.md`, and `docs/character-card.md`.
5. Redeploy.
6. Add a redirect from the old domain if it can still be kept.
