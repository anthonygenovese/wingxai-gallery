/**
 * Brand-name scanner — style card section 5.2.
 *
 * Runs at ingest, before mapping. If a post contains a real company name,
 * product name, franchise name, or real person's name, the bot does not render
 * a frame referencing that name. It maps the post's topic to fictional values
 * or skips the post entirely.
 *
 * The list is a hardcoded seed covering names that have already surfaced in
 * ingested posts and rejected prototypes (RP-01). It is not exhaustive — add
 * any new real name that appears before mapping. See card section 7.
 * (brand-scanner implementation decision).
 */

export type BrandCategory = 'company' | 'product' | 'franchise' | 'person';

export interface BrandEntry {
  name: string;
  category: BrandCategory;
  note?: string;
}

/**
 * Seed list. Matching is case-insensitive and whole-word (see matchBrand).
 * Keep this list in sync with the negative prompt in style-card.ts.
 */
export const BRAND_LIST: readonly BrandEntry[] = [
  // Companies — from RP-01 and ingested posts
  { name: 'Tesla', category: 'company' },
  { name: 'SpaceX', category: 'company' },
  { name: 'Starlink', category: 'company' },
  { name: 'Falcon', category: 'company', note: 'Falcon 9 rocket family' },
  { name: 'Starship', category: 'company', note: 'SpaceX vehicle' },
  { name: 'Blue Origin', category: 'company' },
  { name: 'NASA', category: 'company' },
  { name: 'Lockheed Martin', category: 'company' },
  { name: 'Boeing', category: 'company' },
  { name: 'Northrop Grumman', category: 'company' },
  { name: 'Raytheon', category: 'company' },
  { name: 'Apple', category: 'company' },
  { name: 'Google', category: 'company' },
  { name: 'Microsoft', category: 'company' },
  { name: 'Amazon', category: 'company' },
  { name: 'Meta', category: 'company' },
  { name: 'OpenAI', category: 'company' },
  { name: 'xAI', category: 'company' },
  { name: 'Neuralink', category: 'company' },
  { name: 'Palantir', category: 'company' },
  { name: 'Anduril', category: 'company' },
  { name: 'Disney', category: 'company' },
  { name: 'Warner Bros', category: 'company' },
  { name: 'Sony', category: 'company' },
  { name: 'Bandai', category: 'company' },
  { name: 'Hasbro', category: 'company' },

  // Products and services
  { name: 'Falcon 9', category: 'product' },
  { name: 'Falcon Heavy', category: 'product' },
  { name: 'Starlink V3', category: 'product' },
  { name: 'Starlink Mini', category: 'product' },
  { name: 'iPhone', category: 'product' },
  { name: 'ChatGPT', category: 'product' },
  { name: 'Grok', category: 'product' },
  { name: 'Windows', category: 'product' },
  { name: 'Android', category: 'product' },
  { name: 'PlayStation', category: 'product' },
  { name: 'Xbox', category: 'product' },
  { name: 'Fortnite', category: 'product' },
  { name: 'Minecraft', category: 'product' },

  // Franchises and characters
  { name: 'Gundam', category: 'franchise' },
  { name: 'Mobile Suit Gundam', category: 'franchise' },
  { name: 'Wing Zero', category: 'franchise' },
  { name: 'Deathscythe', category: 'franchise' },
  { name: 'Shenlong', category: 'franchise' },
  { name: 'Evangelion', category: 'franchise' },
  { name: 'Neon Genesis Evangelion', category: 'franchise' },
  { name: 'Transformers', category: 'franchise' },
  { name: 'Optimus Prime', category: 'franchise' },
  { name: 'Megatron', category: 'franchise' },
  { name: 'Star Wars', category: 'franchise' },
  { name: 'Darth Vader', category: 'franchise' },
  { name: 'Iron Man', category: 'franchise' },
  { name: 'Spider-Man', category: 'franchise' },
  { name: 'Batman', category: 'franchise' },
  { name: 'Superman', category: 'franchise' },
  { name: 'Marvel', category: 'franchise' },
  { name: 'DC', category: 'franchise' },
  { name: 'Pokemon', category: 'franchise' },
  { name: 'Pokémon', category: 'franchise' },
  { name: 'Naruto', category: 'franchise' },
  { name: 'One Piece', category: 'franchise' },
  { name: 'Dragon Ball', category: 'franchise' },
  { name: 'Attack on Titan', category: 'franchise' },
  { name: 'Fullmetal Alchemist', category: 'franchise' },
  { name: 'Code Geass', category: 'franchise' },
  { name: 'Macross', category: 'franchise' },
  { name: 'Robotech', category: 'franchise' },
  { name: 'Voltron', category: 'franchise' },
  { name: 'Pacific Rim', category: 'franchise' },
  { name: 'Jaeger', category: 'franchise' },

  // Real people — public figures that have appeared in ingested posts
  { name: 'Elon Musk', category: 'person' },
  { name: 'Donald Trump', category: 'person' },
  { name: 'Joe Biden', category: 'person' },
  { name: 'Barack Obama', category: 'person' },
  { name: 'Kamala Harris', category: 'person' },
  { name: 'Vladimir Putin', category: 'person' },
  { name: 'Xi Jinping', category: 'person' },
  { name: 'Mark Zuckerberg', category: 'person' },
  { name: 'Sam Altman', category: 'person' },
  { name: 'Jeff Bezos', category: 'person' },
  { name: 'Bill Gates', category: 'person' },
  { name: 'Steve Jobs', category: 'person' },
];

export interface BrandHit {
  name: string;
  category: BrandCategory;
  note?: string;
  matched_as: string;
}

export interface ScanResult {
  clean: boolean;
  hits: BrandHit[];
  categories: BrandCategory[];
  action: 'map' | 'skip';
  reason: string;
}

/**
 * Normalize text for matching: lowercase, unify dashes/underscores to spaces,
 * collapse whitespace. Apostrophes are kept so "Hang 'Em High" survives.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whole-word match for a brand name inside normalized text.
 * Uses Unicode-aware boundaries so "tesla" matches but "teslas" does not.
 */
export function matchBrand(text: string, brand: string): string | null {
  const haystack = normalize(text);
  const needle = normalize(brand);
  if (!needle) return null;
  const pattern = new RegExp(`(?<!\p{L})(?:${escapeRegExp(needle)})(?!\p{L})`, 'u');
  const match = haystack.match(pattern);
  return match ? match[0] : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan a post (or any text) for real brand names.
 *
 * clean: true  -> no hits; the bot may map and render.
 * clean: false -> hits found; action is 'map' (map topic to fictional values)
 *                 or 'skip' (do not render at all).
 *
 * Default action is 'map' — the post's substance becomes the frame's world,
 * the brand becomes nothing. 'skip' is reserved for posts whose entire
 * substance is the brand itself (e.g. a pure product announcement with no
 * discussable topic), which the caller can decide.
 */
export function scanPost(text: string): ScanResult {
  const hits: BrandHit[] = [];
  const seen = new Set<string>();

  for (const entry of BRAND_LIST) {
    const matched = matchBrand(text, entry.name);
    if (matched && !seen.has(entry.name)) {
      seen.add(entry.name);
      hits.push({ name: entry.name, category: entry.category, note: entry.note, matched_as: matched });
    }
  }

  const categories = [...new Set(hits.map((h) => h.category))];

  if (hits.length === 0) {
    return {
      clean: true,
      hits: [],
      categories: [],
      action: 'map' as const,
      reason: 'No real brand names detected. Safe to map and render.',
    };
  }

  return {
    clean: false,
    hits,
    categories,
    action: 'map' as const,
    reason:
      `Detected ${hits.length} real brand name${hits.length === 1 ? '' : 's'} ` +
      `(${hits.map((h) => h.name).join(', ')}). Map the post's topic to fictional ` +
      `frame values; do not reference these names in the prompt or card. ` +
      `The post's substance becomes the frame's world; the brand becomes nothing. ` +
      `See style card section 5.2 for the rights-reserved note: WingXAI holds no ` +
      `third-party rights; fictional everything is the only safe default until a ` +
      `rights holder grants permission.`,
  };
}

/**
 * Convenience: returns true when the text is safe to render as-is.
 */
export function isClean(text: string): boolean {
  return scanPost(text).clean;
}
