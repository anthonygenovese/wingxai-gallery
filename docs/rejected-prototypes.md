# WingXAI Rejected Prototypes Log

**Status:** living log · **Last updated:** 2026-10-10
**Owner:** @anthonygenovese · **Gallery:** https://wingxai.gallery

> Every rejected prototype gets logged here with the specific violations and the fix. Rejected frames never enter the lineage chain and never become references. They exist only as lessons. The seed frame (WX-00) and every published generation trace back to original WingXAI work only.

---

## RP-01 — "SpaceX Variant / STARLINK-06"

**Logged:** 2026-10-10
**Source:** owner-supplied early prototype image (IMG_6596.jpg)
**Disposition:** rejected — does not enter the lineage, does not become a reference

### What it was

A Gundam-style mobile suit presented on a sci-fi dossier card. Gray-and-black armor, red chest emblem, green visor, Earth-orbit background, barcode footer. The card layout and the orbital background were the strongest parts.

### Violations (three hard-rule failures)

1. **Head design:** the head is a direct trace of a well-known copyrighted mecha head — spiked crest, V-fin, visor layout. Section 1.6 hard rule: no reproducing or closely tracing any existing named character or mecha design, including its exact head.
2. **Real brand on the chest:** the chest emblem is the Tesla logo. Section 1.7 hard rule: no real company or agency logos. Section 2.2: affiliations are fictional only.
3. **Real brand text on the card:** the header reads "SPACEX VARIANT," the unit code reads "STARLINK-06," and the footer reads "UNIT TYPE: STARLINK V3 PROTOTYPE." Section 3: franchise names appear in the negative prompt only, never in positive prompts or card fields. Real company and product names are banned everywhere on the card.

### What was worth keeping

- **Card layout:** header, dossier text column, hero frame, barcode footer — close to the canonical structure in section 2. The positions and hierarchy are reusable.
- **Background:** Earth from orbit over a dark starfield is exactly the kind of background the evolution spec wants (section 2.2: backgrounds always change between generations; orbital and space scenes fit technical and launch-related posts).
- **Pose and lighting:** heroic low-angle stance, rim lighting, pristine finish — all inside the family language.
- **The idea itself:** a frame whose card carries mission-style dossier text is a strong direction for the quote box and systems checklist.

### What to change (the re-render recipe)

Re-render the same concept with these swaps:

1. **Head:** replace the traced head with an original helmet-like design — narrow visor or slit eyes, no mouth, no V-fin or spiked crest copied from any existing mecha. The head must pass the silhouette test in section 1.4.
2. **Chest emblem:** replace the Tesla logo with an original gold brass crest (section 1.7). A stylized mechanical eagle, abstract star cluster, or WingXAI lettering — never a round badge combining an eagle, a ring of stars, and lettering.
3. **Card text:** replace all real names with fictional values. Header: `WINGXAI · PROTOTYPE FRAME`. Unit code: `WX-[##]`. Footer: fictional unit type. The dossier text becomes an original quote or fictional systems description — never a real mission report.
4. **Negative prompt:** ensure `gundam, mobile suit gundam, wing zero, tesla, spacex, starlink, real company logo, brand logo` are all present to steer away.

### Result if re-rendered

A legitimate early frame — a candidate for the pre-lineage placeholder slot or a rejected-then-fixed entry in the lineage log. The Earth-orbit background and card layout carry over; only the head, crest, and text change.

### Lesson for the bot

The ingest-map-render loop must catch real brand names and franchise head designs at the map stage, before render. A post about SpaceX or Starlink should map to fictional affiliation text and an original crest — never the real logo or name. The negative prompt already bans franchise names; it should also ban the real company names that appear in posts the bot ingests.

---

## Open follow-ups

- [ ] Re-render RP-01 with the recipe above and decide whether it becomes a pre-lineage placeholder or a fixed-then-published frame.
- [ ] Add real company names (Tesla, SpaceX, Starlink, and others that appear in ingested posts) to the negative prompt in section 3 of the style card.
- [ ] Consider a brand-name scanner in the ingest stage that flags any real company or franchise name before mapping.
