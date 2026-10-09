import { readFileSync } from 'node:fs';
import { CatalogInputError } from './catalog.js';
import { PROVENANCE } from './provenance.js';

/**
 * Structured view of docs/character-card.md (card version 0.4).
 * The markdown file is copied into the payload when it can be read.
 * Bracketed fields are still undecided in the card; they are not filled in here.
 *
 * NOT LIVE: mcp_endpoint.live is false. https://wingxai.gallery/mcp is not deployed.
 */

const CARD_VERSION = '0.4';
const cardUrl = new URL('../../docs/character-card.md', import.meta.url);

const BASE_PROMPT = `[WingXAI style] original monumental robot frame, [carbon fiber weave armor with dark
gunmetal geometric panels | white armor with gold trim and carbon fiber joints], large
mechanical wings with carbon fiber texture, [red | green | green wing-edge and red chest]
LED strips along wing edges, armor seams and joints, narrow visor with glowing [red |
green] eye slits, original gold brass mechanical eagle crest on the chest, heroic
upright statue-like pose, low camera angle, dark night-steel background, rim lighting,
pristine prototype finish, cinematic, [rendering style]`;

const FRAME_CARD_ADDON =
  'presented on a sci-fi dossier card, "WINGXAI · PROTOTYPE FRAME" header, fictional name and callsign fields, unit code "WX-[##]", class field, quote box, systems checklist, barcode footer';

const NEGATIVE_PROMPT =
  'real person, real politician, celebrity, public figure likeness, real name, real social media handle, real company logo, brand logo, official seal, presidential seal, great seal of the united states, government insignia, gundam, mobile suit gundam, wing zero, existing anime character, franchise logo, copied character design, cyan or blue lights, rust, salvaged scrap, cute toy, plastic, organic flesh, rainbow colors, cluttered background, tiny unreadable text, watermark';

function loadMarkdown(): { markdown: string | null; markdown_included: boolean; markdown_note?: string } {
  try {
    return { markdown: readFileSync(cardUrl, 'utf8'), markdown_included: true };
  } catch {
    return {
      markdown: null,
      markdown_included: false,
      markdown_note: 'docs/character-card.md was not readable from this process. Structured fields below still follow card 0.4.',
    };
  }
}

export function styleCardDocument(version: string | undefined): Record<string, unknown> {
  const requested = version?.trim() || 'latest';
  if (requested !== 'latest' && requested !== CARD_VERSION) {
    throw new CatalogInputError(`Unknown style card version: ${requested}`);
  }

  return {
    version: CARD_VERSION,
    brand: 'WingXAI',
    gallery: 'https://wingxai.gallery',
    mcp_endpoint: {
      url: 'https://wingxai.gallery/mcp',
      live: false,
      note: 'Planned and not deployed. Calls to the production URL fail until it is live.',
    },
    soul: 'A WingXAI monster is a Prototype Frame: a monumental, carbon-fiber-armored machine with huge mechanical wings, LED accent lighting in red or green, and an original gold crest. It is built like a monument and lit like a weapon system. Each frame is presented on the WingXAI frame card, a classified dossier with a unit code, class, systems checklist, quote, and barcode. Every frame and every pilot is fictional.',
    three_words: ['carbon', 'crested', 'lit'],
    never: [
      "real people's names, likenesses, or handles",
      'real companies or brands as affiliations',
      'real government seals',
      'copies of existing mecha or anime characters',
      'rust or salvaged wear',
      'cute toy plastic',
      'organic flesh',
      'rainbow or neon palettes',
    ],
    schemes: [
      {
        name: 'Carbon',
        role: 'default',
        base: 'Carbon black #16181B approx.',
        plates: 'Gunmetal charcoal #3A3F45 approx.',
        trim: 'Brass gold #C9A227 approx.',
        when: 'Most frames',
      },
      {
        name: 'Parade',
        base: 'Armor white #E9EAEC approx.',
        plates: 'Carbon black #16181B (joints, inner frame)',
        trim: 'Brass gold #C9A227',
        when: 'Ceremonial or hero frames. Inspired by classic white-and-gold mecha schemes, but must use original shapes.',
      },
      { name: '[Scheme 3]', base: '[ ]', plates: '[ ]', trim: '[ ]', when: '[ ]' },
    ],
    lighting: {
      colors: [
        { name: 'Signal red', hex: '#FF1E2D', falloff: '#8B0A12', where: 'Eyes, visor slits, chest and seam strips, joints' },
        { name: 'Signal green', hex: '#2BFF6A', falloff: '#0B7A33', where: 'Wing edges and wing veins, chest seams, eyes' },
      ],
      rules: [
        'Each frame uses red, green, or a red and green split. No other light colors.',
        "In a split, give each color its own zone, for example green wing edges with red chest seams. Don't blend them on the same strip.",
        'Light is thin LED strips and slits, never big glowing blobs.',
        'Lights take about 3–8% of the image, enough to read on a phone, not enough to wash out the armor.',
        '[Do red and green mean anything, such as class, faction, or mode? ________]',
      ],
    },
    supporting_colors: [
      { role: 'Heraldry shadow, antique brass', hex: '#7A5C1E', share: '1–3%' },
      { role: 'HUD lines and type', hex: '#E8E8E8, plus the frame light color', share: 'under 3%' },
      { role: 'Background, night steel', hex: '#0C0E11', share: 'n/a' },
    ],
    base_prompt: BASE_PROMPT,
    frame_card_addon: FRAME_CARD_ADDON,
    negative_prompt: NEGATIVE_PROMPT,
    negative_prompt_note: 'Franchise names appear in the negative prompt only, to steer away from them. Never put them in a positive prompt.',
    mecha_influence_rule: {
      summary: 'Classic mecha anime is a general style influence only. Do not reproduce a named character or mecha design.',
      ok: [
        'Tall, armored mobile-suit proportions',
        'White-and-gold or white-and-red armor schemes',
        'A forehead fin or antenna as a general idea',
        'Mechanical wing language: layered feather-blades, struts, thrusters',
        'Hard-edged panel lines and vents',
      ],
      not_ok: [
        'Reproducing or closely tracing any existing named character or mecha design, including its exact head, face mask, chest vents, wing shape, or overall layout',
        'Franchise names, model numbers, unit names, or series designations from existing works, in the art, on the HUD, or in prompts',
        'Prompting for an existing franchise or character by name',
        'Using a franchise image as a direct image-to-image source',
      ],
    },
    heraldry_rule: {
      summary: 'Every WingXAI crest must be an original design. Never reproduce a real government seal or insignia.',
      rules: [
        'Never reproduce the Seal of the President, the Great Seal of the United States, the Vice President seal, or any agency, military, or state seal or insignia.',
        'Avoid a round badge that combines an eagle, a ring of stars, and lettering.',
        'No real seal text or mottos, and no real company or agency logos.',
        'Placed next to any real seal, the crest should read as clearly different at a glance in shape, layout, and text.',
      ],
    },
    frame_card_layout: {
      header: 'WINGXAI · PROTOTYPE FRAME',
      fields: ['name', 'pilot', 'role', 'handle', 'unit_code', 'class', 'quote', 'systems', 'affiliation'],
      unit_code_pattern: 'WX-[##]',
      rules: [
        'Affiliations are fictional only. No real companies, agencies, products, or brands.',
        'The pilot is a fictional callsign. Never a real person.',
        'The handle is fictional or WingXAI-owned. Never a real person account.',
        'The quote is an original line written for the frame. Never a real person quote.',
      ],
    },
    modifiers: [
      { mode: 'cute', bends: 'Compact rounder chassis, bigger helmet, stubby folded wings, soft glow' },
      { mode: 'menacing', bends: 'Extreme low angle, wings fully spread, bright seams, smoke and sparks' },
      { mode: 'minimal', bends: 'Flat shapes, 4–5 colors, no texture noise' },
      { mode: 'detailed', bends: 'Macro weave, engraved crest, dense card' },
      { mode: 'parade', bends: 'White-and-gold armor, ceremonial pose' },
      { mode: 'gallery-card', bends: 'Frame card on, centered hero' },
    ],
    reference_rules: [
      'Describe the style in words and generate from the words.',
      'If image references are used, use several at low strength. Team default strength is still undecided.',
      'Change at least three things from any reference: pose, head design, wing shape, crest design, camera angle, or card contents.',
      'If a side-by-side comparison reads as a copy, rework it.',
      'Do not post mood board images as WingXAI art.',
    ],
    agent_recipe: [
      'Call get_style_card and take the base prompt, negative prompt, mecha influence and heraldry rules, frame card layout, and mode modifiers.',
      'Optionally call search_monsters for 2–3 reference frames in the target mode, scheme, or light.',
      'Build the prompt as base prompt + scheme + light + mode modifier + the frame-specific idea. Add the frame card add-on for gallery posts.',
      'Fill the frame card with fictional values only.',
      'Never add a real person, real company, real seal, or franchise name or character to the positive prompt or the card.',
      'Self-check against the belongs-in-the-family checklist before publishing.',
    ],
    hard_rules: [
      "No real person's name, likeness, handle, quote, or pilot credit",
      'No real company, brand, or product affiliation',
      'Crest is an original design, with no real seal or government insignia',
      'Not a reproduction or close trace of any existing mecha or anime character',
      'Not a copy or close edit of any single reference image',
    ],
    provenance: PROVENANCE,
    ...loadMarkdown(),
  };
}
