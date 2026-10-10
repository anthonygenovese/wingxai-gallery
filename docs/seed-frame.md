# WingXAI Seed Frame Spec

**Status:** draft · **Last updated:** 2026-10-10
**Owner:** @anthonygenovese · **Gallery:** https://wingxai.gallery

> The seed frame is the base model of the lineage. One committed image in the repo that every generation traces back to. The bot returns the prompt and generates the image; that image gets stored on GitHub and becomes the reference for the next generation. Each generation is the key for the one after it.

---

## 0. What the seed frame is

The seed frame is **WX-00** — the original WingXAI Prototype Frame, committed to the repo before any post-driven generation exists. It is not a generation. It is the DNA.

- **Path:** `/gallery/public/assets/wx-00.svg` (frame) and `/gallery/public/assets/wx-00-card.svg` (card)
- **Unit code:** `WX-00` — reserved, never assigned to a post-driven generation
- **Role:** the fallback reference. When a lineage starts, when a generation fails the family check, or when the latest reference is corrupted or missing, the bot falls back to WX-00.

The seed frame is the only image in the repo that is allowed to be a placeholder SVG. Every generation after it is a real render.

---

## 1. The reference chain

Every render needs two things: the **prompt** and a **reference image**. The prompt carries the style language and the frame-specific idea from the post. The reference image anchors the silhouette.

```
WX-00 (seed)
  |
  v
WX-01  <-- generated from WX-00 + post 1
  |
  v
WX-02  <-- generated from WX-01 + post 2
  |
  v
WX-03  <-- generated from WX-02 + post 3
  ...
```

- **Default reference:** the previous generation's frame image (the lineage's last unit code).
- **Fallback reference:** WX-00, used when starting a new lineage, when the previous generation failed the family check, or when the previous reference is missing or corrupted.
- **Strength:** low. Several references at once if available, none dominating. The team default is still undecided — see open decisions in the evolution spec.
- **Never:** a mood-board image, a franchise image, or a single external reference fed at high strength.

### 1.1 The change rule

The new generation must differ from its reference in at least three things — pose, head design, wing shape, crest design, camera angle, or card contents. If a side-by-side reads as a copy or edit, rework before publishing.

### 1.2 Why the chain matters

Without a reference, each generation drifts and the lineage reads as unrelated robots. With the chain, the lineage reads as one character evolving. The seed frame is what makes the chain recoverable: even if generations seventeen through thirty all go wrong, WX-00 is still there to restart from.

---

## 2. The drift problem and the fallback rule

If you always use the latest generation as the reference, drift compounds. A generation that goes slightly off-family becomes the anchor for everything after it, and the lineage slowly walks away from the family.

**The fallback rule:** before a generation is published, it runs the belongs-in-the-family checklist from the style card. If it fails, the bot regenerates against WX-00 (the seed) instead of the failed frame, and the failed attempt is logged but not committed as a reference.

This means a bad generation never becomes the key for the next one. Only frames that pass the family check enter the chain.

---

## 3. Storage rules

- Every published generation is committed to `/gallery/public/assets/` as `wx-[##].svg` and `wx-[##]-card.svg`.
- The lineage log (see evolution spec, section 4) records the reference used for each generation, so the chain is auditable: which frame anchored which render.
- The seed frame WX-00 is never overwritten. It is immutable.
- Placeholder SVGs (WX-01 through WX-15 currently in the repo) are pre-lineage references. When the first real post-driven generation publishes as WX-16, it becomes the first link in the real chain, anchored to WX-00.

---

## 4. What the bot returns when a post is dropped in

1. The extracted fields (ingest)
2. The mapped parameters (map)
3. The full render prompt, ready to paste into an image generator
4. The reference image to use (previous generation, or WX-00 as fallback)
5. The frame card fields and the quote
6. The audio line, if the random trigger fires

The image itself may be just the stock placeholder at first — that is fine. The prompt and the reference are the deliverables. The image is the artifact that gets stored and becomes the next key.

---

## 5. Open decisions

- [ ] Should WX-00 be a real render or stay as the placeholder SVG?
- [ ] How many previous generations should be fed as references at once (one, three, five)?
- [ ] Should a failed generation be retried automatically against WX-00, or flagged for manual review?
- [ ] Does the lineage log store the reference image URL or just the unit code?
