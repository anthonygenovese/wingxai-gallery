import catalogJson from '../../../data/monsters.json';

export type Scheme = 'carbon' | 'parade';
export type Light = 'red' | 'green' | 'red-green';
export type Mode = 'cute' | 'menacing' | 'minimal' | 'detailed' | 'parade' | 'gallery-card';
export type SystemStatus = 'ok' | 'off';

export interface FrameCard {
  name: string;
  pilot: string;
  role: string;
  handle: string;
  unit_code: string;
  class: string;
  quote: string;
  systems: { name: string; status: SystemStatus }[];
  affiliation: string;
}

export interface Monster {
  id: string;
  title: string;
  scheme: Scheme;
  light: Light;
  mode: Mode;
  prompt: string;
  style_tags: string[];
  image_urls: {
    thumb: string;
    full: string;
    full_no_card: string;
  };
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

export interface Catalog {
  card_version: string;
  series: string;
  negative_prompt: string;
  frames: Monster[];
}

const catalog = catalogJson as Catalog;

export function listMonsters(): Monster[] {
  return catalog.frames;
}

export function getMonster(id: string | undefined): Monster | undefined {
  if (!id) return undefined;
  const key = id.toLowerCase();
  return catalog.frames.find((frame) => frame.id.toLowerCase() === key);
}

export function negativePrompt(): string {
  return catalog.negative_prompt;
}

export function cardVersion(): string {
  return catalog.card_version;
}

export function seriesName(): string {
  return catalog.series;
}
