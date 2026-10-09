import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PROVENANCE } from './provenance.js';

/**
 * Shared catalog. The file lives at /data/monsters.json so the gallery and
 * this server read one copy. The path below is static so a bundler can trace it.
 * Vercel also lists it in the service includeFiles pattern. See docs/deployment.md.
 */

export class CatalogInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CatalogInputError';
  }
}

export interface FrameCard {
  name: string;
  pilot: string;
  role: string;
  handle: string;
  unit_code: string;
  class: string;
  quote: string;
  systems: { name: string; status: 'ok' | 'off' }[];
  affiliation: string;
}

export interface Monster {
  id: string;
  title: string;
  scheme: 'carbon' | 'parade';
  light: 'red' | 'green' | 'red-green';
  mode: 'cute' | 'menacing' | 'minimal' | 'detailed' | 'parade' | 'gallery-card';
  prompt: string;
  style_tags: string[];
  image_urls: { thumb: string; full: string; full_no_card: string };
  image_size: {
    figure: { width: number; height: number };
    card: { width: number; height: number };
  };
  frame_card: FrameCard;
  palette: Record<string, string>;
  model: string;
  seed: null;
  created_at: string;
  credit_line: string;
}

interface CatalogFile {
  card_version: string;
  series: string;
  negative_prompt: string;
  frames: Monster[];
}

const dataUrl = new URL('../../data/monsters.json', import.meta.url);
const catalog = JSON.parse(readFileSync(dataUrl, 'utf8')) as CatalogFile;

export interface SearchInput {
  query?: string;
  tags?: string[];
  mode?: Monster['mode'];
  scheme?: Monster['scheme'];
  light?: Monster['light'];
  class?: string;
  limit?: number;
  cursor?: string;
}

export function publicOrigin(): string {
  // Default is the intended domain. It is NOT pointed yet. Set
  // WINGXAI_PUBLIC_ORIGIN to a Vercel preview origin when you need absolute
  // asset URLs that resolve before DNS exists. `path` is always host-relative.
  const raw = process.env.WINGXAI_PUBLIC_ORIGIN?.trim() || 'https://wingxai.gallery';
  return raw.replace(/\/+$/, '');
}

function absolute(pathname: string): string {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${publicOrigin()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function norm(value: string): string {
  return value.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unitOrder(id: string): number {
  const parsed = Number(id.split('-')[1]);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

export function listFrames(): Monster[] {
  return [...catalog.frames].sort((a, b) => unitOrder(a.id) - unitOrder(b.id) || a.id.localeCompare(b.id));
}

export function findFrame(id: string): Monster | undefined {
  const key = id.trim().toLowerCase();
  return listFrames().find((frame) => frame.id.toLowerCase() === key);
}

function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ offset }), 'utf8').toString('base64');
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as { offset?: unknown };
    if (!parsed || typeof parsed.offset !== 'number' || !Number.isInteger(parsed.offset) || parsed.offset < 0) {
      throw new Error('bad offset');
    }
    return parsed.offset;
  } catch (error) {
    if (error instanceof CatalogInputError) throw error;
    throw new CatalogInputError('Invalid cursor.');
  }
}

function haystack(frame: Monster): string {
  return norm(
    [
      frame.id,
      frame.title,
      frame.prompt,
      frame.frame_card.name,
      frame.frame_card.class,
      frame.frame_card.role,
      frame.frame_card.quote,
      frame.frame_card.pilot,
      frame.frame_card.affiliation,
      ...frame.style_tags,
    ].join(' '),
  );
}

export function searchFrames(input: SearchInput): { results: SearchHit[]; next_cursor: string | null } {
  const offset = decodeCursor(input.cursor);
  const limit = input.limit ?? 10;
  let frames = listFrames();

  if (input.scheme) frames = frames.filter((frame) => frame.scheme === input.scheme);
  if (input.light) frames = frames.filter((frame) => frame.light === input.light);
  if (input.mode) frames = frames.filter((frame) => frame.mode === input.mode);
  if (input.class) {
    const wanted = norm(input.class);
    frames = frames.filter((frame) => norm(frame.frame_card.class) === wanted);
  }
  if (input.tags && input.tags.length > 0) {
    const wanted = input.tags.map((tag) => norm(tag));
    frames = frames.filter((frame) => {
      const tags = frame.style_tags.map((tag) => norm(tag));
      return wanted.every((tag) => tags.includes(tag));
    });
  }
  if (input.query && input.query.trim()) {
    const tokens = norm(input.query).split(' ').filter(Boolean);
    frames = frames.filter((frame) => {
      const text = haystack(frame);
      return tokens.every((token) => text.includes(token));
    });
  }

  const page = frames.slice(offset, offset + limit);
  const next = offset + limit < frames.length ? encodeCursor(offset + limit) : null;
  return {
    results: page.map((frame) => ({
      id: frame.id,
      name: frame.frame_card.name,
      class: frame.frame_card.class,
      scheme: frame.scheme,
      light: frame.light,
      tags: frame.style_tags,
      thumb_url: absolute(frame.image_urls.thumb),
      page_url: absolute(`/m/${frame.id}`),
    })),
    next_cursor: next,
  };
}

export interface SearchHit {
  id: string;
  name: string;
  class: string;
  scheme: Monster['scheme'];
  light: Monster['light'];
  tags: string[];
  thumb_url: string;
  page_url: string;
}

export function monsterRecord(id: string): Record<string, unknown> {
  const frame = findFrame(id);
  if (!frame) throw new CatalogInputError(`Unknown unit code: ${id}`);
  return {
    id: frame.id,
    series: catalog.series,
    card_version: catalog.card_version,
    scheme: frame.scheme,
    light: frame.light,
    mode: frame.mode,
    frame_card: frame.frame_card,
    prompt: frame.prompt,
    negative_prompt: catalog.negative_prompt,
    tags: frame.style_tags,
    palette: frame.palette,
    provenance: PROVENANCE,
    model: frame.model,
    seed: frame.seed,
    created_at: frame.created_at,
    license: PROVENANCE.license,
    credit_line: frame.credit_line,
    assets: {
      thumb: absolute(frame.image_urls.thumb),
      full: absolute(frame.image_urls.full),
      full_no_card: absolute(frame.image_urls.full_no_card),
    },
    page_url: absolute(`/m/${frame.id}`),
  };
}

const ASSET_NOTE =
  'Only SVG placeholders are committed. Raster derivatives (png, jpg, webp) and separate size crops are not generated yet. This URL is the committed SVG.';

export function monsterAsset(input: {
  id: string;
  size: 'thumb' | 'medium' | 'full';
  format: 'png' | 'jpg' | 'webp';
  card: boolean;
}): Record<string, unknown> {
  const frame = findFrame(input.id);
  if (!frame) throw new CatalogInputError(`Unknown unit code: ${input.id}`);
  const useCard = input.card && input.size !== 'thumb';
  const path = useCard ? frame.image_urls.full : input.size === 'thumb' ? frame.image_urls.thumb : frame.image_urls.full_no_card;
  const size = useCard ? frame.image_size.card : frame.image_size.figure;
  return {
    url: absolute(path),
    path,
    width: size.width,
    height: size.height,
    expires_at: null,
    requested_size: input.size,
    requested_format: input.format,
    served_format: 'svg',
    card: useCard,
    note: ASSET_NOTE,
    provenance: PROVENANCE,
  };
}
