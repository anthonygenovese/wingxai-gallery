# WingXAI Reply Bot — Branch Specs

**Status:** draft · **Last updated:** 2026-10-10
**Owner:** @anthonygenovese · **Gallery:** https://wingxai.gallery

> The reply bot lives in the replies of posts on X. Two branches share the same ingest-map-render pipeline and the same brand-name scanner — they differ on who the frame serves and what is allowed on the card.

---

## 0. The shared core

Both branches:

- Ingest a post (URL, pasted text, or bookmark) — stats, topic, tone, sentiment, key details, author handle (logged, never rendered).
- Run the brand-name scanner before mapping. Real company, product, franchise, or person names trigger the fallback: map the topic to fictional values, never the brand.
- Map to visual parameters (engagement → threat/light, topic → mode/background, sentiment → palette, key details → HUD).
- Render with the base prompt, negative prompt, frame card layout, and a reference image (previous generation or WX-00 seed).
- Fill card fields with fictional values only, except where the promotional branch explicitly allows a brand.
- The quote is an original line, 5–9 words, fits the 15-second TTS window, tied to the frame's light color (red voice / green voice).
- Every generation appends to the lineage log with a `branch` field: `promotional` or `response`.

---

## 1. Branch A — Promotional

**Who it serves:** the poster. The frame amplifies their post and makes them look good.

**How it works:** the bot generates a frame in reply to the poster's own post (or a post they control). The frame's world, quote, and systems echo the post's substance. The poster's handle may appear as the pilot credit or affiliation *only when the poster is the owner or has granted rights* — never a third party's handle.

**The sponsored-by slot:** the frame card gains an optional `sponsored_by` field. When a brand has granted rights (written permission, ideally a simple one-pager), their logo and name may appear in that slot only. Until rights are granted, the slot stays empty and the branch runs as pure WingXAI art.

**Why brands will want this:** prove the bot drives engagement — e.g., "we are part of what drove 5,000 more views to your post" — and brands will pay to be on it. The frame becomes a mini 15-second ad that anyone in the community can engage with.

**Legal posture:** this is the riskier branch. A frame that echoes a post's substance while carrying that post's brand reads as endorsement — trademark dilution and false association. The sponsored-by slot with explicit rights is the only version that is safe. Without rights, the promotional branch must not name or logo the brand; it maps the topic to fictional values like the response branch does.

**Card differences from response branch:**

| Element | Promotional | Response |
|---|---|---|
| `sponsored_by` field | yes, when rights granted | no |
| Brand logo on card | only with rights | never |
| Pilot credit | poster (with rights) or fictional | fictional only |
| Affiliation | brand (with rights) or fictional | fictional only |
| Tone | amplifies the poster's message | answers the post as WingXAI |

---

## 2. Branch B — Response

**Who it serves:** WingXAI's own voice. The bot is a participant in the thread, not a megaphone.

**How it works:** someone famous posts. The bot ingests it, generates a frame that responds to the post's substance, and drops it as a reply. The frame is clearly WingXAI talking back — the reader connects the frame to the post because it sits in their replies, not because it names them.

**The non-endorsement rule (required):** a frame that echoes a post's substance while carrying that post's brand name reads as endorsement. The scanner kills the brand name at ingest, but the frame must also not *feel* like marketing. If a stranger could mistake the frame for official company material — same visual identity, same tone, same vibe — it fails and must be reworked before posting. The frame is a WingXAI artifact responding to a topic; it is not the company's product, not their campaign, and not their voice. The reply bot's job is engagement with the conversation, never promotion of the brand being discussed.

**Card differences:** no sponsored-by slot, no brand logo, fictional pilot and affiliation only. The quote answers the post's substance without quoting it.

---

## 3. The teaching layer

Both branches are generative tools that teach by doing. The bot makes images, engages with posts, and shows people what good engagement looks like — how to reply, what gets attention, how a visual response lands in a thread. It is a learning tool, not a spam tool. The bot should be helpful and generative, not a dummy that just echoes.

---

## 4. Open decisions

- [ ] Sponsored-by slot: logo file format (SVG only?), placement on the card, and whether it replaces or sits beside the WingXAI header.
- [ ] Rights-grant process: what does a brand need to provide before the slot activates? (one-pager, email, contract?)
- [ ] Does the promotional branch require the poster's own account to post the reply, or can WingXAI post on their behalf?
- [ ] Analytics: how do we measure "5,000 more views" attribution per frame?
- [ ] Should the two branches share one lineage log or split into two?
