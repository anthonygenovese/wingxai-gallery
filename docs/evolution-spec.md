# WingXAI Evolution Spec

**Status:** draft · **Card version:** 0.4 · **Last updated:** 2026-10-10
**Owner:** @anthonygenovese · **Gallery:** https://wingxai.gallery

> How it works: someone drops an X post into the bot. The bot extracts stats and key details, maps them to visual parameters, and generates a new WingXAI Prototype Frame card — the character evolves one generation per post. The background shifts with every post, so the card becomes a visual diary of what the community is sharing.

---

## 0. The loop in one paragraph

A post comes in. The bot reads it and pulls out the numbers — views, likes, replies, reposts, timestamp — plus the substance: topic, tone, sentiment, key details. Those numbers and that substance become dials on the frame: engagement drives threat and light, topic drives mode and background, sentiment drives palette. The generator renders a new card with the HUD overlay baked in — stats in one corner, key details as text, the evolved frame in the center. Each generation is a new unit code, so the lineage is traceable: WX-01, WX-16, WX-31.

**Three words:** *ingest · evolve · render*
**Never:** real people's names, likenesses, or handles on the card; real company or brand affiliations; real government seals; copies of existing mecha or anime characters; rust or salvaged wear; cute toy plastic; organic flesh; rainbow or neon palettes.

---

## 1. Stage one — ingest

Input: a pasted post URL, a pasted post text, or a bookmarked post on X.

The bot extracts:

| Field | Source | Required |
|---|---|---|
| `views` | post stats | yes |
| `likes` | post stats | yes |
| `replies` | post stats | yes |
| `reposts` | post stats | yes |
| `timestamp` | post metadata | yes |
| `author_handle` | post metadata | yes (kept in the log, never on the card) |
| `topic` | one-line summary of what the post is about | yes |
| `tone` | one of: `celebratory`, `urgent`, `technical`, `playful`, `dark`, `neutral` | yes |
| `sentiment` | one of: `positive`, `negative`, `mixed`, `neutral` | yes |
| `key_details` | 2–4 short phrases the post actually shares | yes |
| `source_url` | the post URL | yes |

The author handle is logged for provenance but is **never** rendered on the card, in the prompt, or in the quote. The quote is always an original line written for the frame.

---

## 2. Stage two — map (generative, with guardrails)

The mapping is generative: the model reads the extracted fields and decides the visual parameters, rather than following a fixed lookup table. That is the part we will tweak as we test. The guardrails below keep generations inside the family even when the model improvises.

### 2.1 Engagement → threat and light

| Signal | Low | High |
|---|---|---|
| Views + likes | compact chassis, folded wings, soft glow, minimal mode | towering low angle, wings fully spread, blazing seams, menacing mode, smoke and sparks |
| Replies + reposts | quiet, still background | active background: weather, motion, particles |

### 2.2 Topic → mode and background

The model picks a mode from the style card's modifier list — `cute`, `menacing`, `minimal`, `detailed`, `parade`, `gallery-card` — and a background that fits the topic. Backgrounds always change between generations. Examples: a technical post gets a clean lab or hangar interior; a celebratory post gets a dawn sky over a launch field; a dark post gets storm clouds and ember light; a playful post gets a bright overcast sky with soft shadows. The background is night-steel `#0C0E11` by default when nothing fits.

### 2.3 Sentiment → palette

| Sentiment | Palette shift |
|---|---|
| `positive` | brighter rim light, more green in the split, Parade scheme allowed |
| `negative` | more red, deeper shadows, menacing lean |
| `mixed` | red-green split, standard Carbon scheme |
| `neutral` | default Carbon, balanced light |

### 2.4 Key details → HUD text

The 2–4 key details become the systems checklist entries and the quote box content. Checklist items are fictional system names derived from the details, e.g. a post about weather becomes `WEATHER RADAR`. The quote is an original line that echoes the post's substance without quoting it.

### 2.5 What stays fixed across every generation

- Carbon fiber weave armor, large mechanical wings, original gold brass crest
- Red or green LED lighting only (thin strips and slits, 3–8% of the image)
- Heroic upright statue-like pose, low camera angle
- Pristine prototype finish — no rust, no salvage wear
- The frame card layout: header, hero, dossier, quote box, systems, barcode footer
- The negative prompt from the style card, unchanged

---

## 3. Stage three — render

Build the prompt as: base prompt + scheme + light + mode modifier + background + the frame-specific idea from stage two. Add the frame card add-on. Fill the card fields with fictional values only:

| Field | Rule |
|---|---|
| Name | fictional frame name |
| Pilot | fictional callsign |
| Role | fictional role derived from the post's topic |
| Handle | fictional or WingXAI-owned |
| Unit code | next in sequence, `WX-[##]` |
| Class | fictional class name |
| Quote | original line, never a real person's quote |
| Systems | checklist from key details |
| Affiliation | fictional only |

Then run the belongs-in-the-family checklist from the style card before publishing. If a side-by-side with the closest reference reads as a copy, rework.

---

## 4. The lineage log

Every generation appends one record to the lineage log (a JSON file or sheet, TBD):

```json
{
  "generation": 16,
  "unit_code": "WX-16",
  "source_url": "https://x.com/...",
  "extracted": { "views": 1200, "likes": 84, "topic": "...", "tone": "technical", "sentiment": "neutral" },
  "mapped": { "mode": "detailed", "scheme": "carbon", "light": "green", "background": "hangar interior at dusk" },
  "frame_card": { "name": "...", "pilot": "...", "role": "...", "quote": "..." },
  "image_url": "/assets/wx-16-card.svg",
  "created_at": "2026-10-10T..."
}
```

Scrolling the lineage is the story: each post the community shares leaves a visible mark on the frame and its world.

---

## 5. Open decisions

- [ ] Where does the lineage log live — JSON in the repo, or a sheet?
- [ ] Does the bot auto-generate on every post, or wait for a confirm?
- [ ] Should high-engagement generations unlock a new armor scheme?
- [ ] Does the barcode encode the gallery URL or the source post URL?
- [ ] Team default for image-reference strength, if references are used at all.
