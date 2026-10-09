/**
 * Original WingXAI placeholder silhouettes.
 *
 * These are geometric drawings made for this repo. They are not traced from
 * any reference, person, seal, or franchise design. The crest is a hex plate
 * and a mechanical eagle: no circle of stars, no motto, no official seal.
 * The barcode on the card SVG is decorative and does not encode a URL.
 *
 * Run from /gallery: node scripts/render-placeholders.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets');

const INK = {
  bg: '#0C0E11',
  carbon: '#16181B',
  plate: '#3A3F45',
  brass: '#C9A227',
  brassShadow: '#7A5C1E',
  red: '#FF1E2D',
  green: '#2BFF6A',
  white: '#E9EAEC',
  hud: '#E8E8E8',
};

const FRAMES = [
  {
    id: 'WX-01',
    title: 'Ash Ladder',
    scheme: 'carbon',
    spread: 0.92,
    rise: 1,
    canvasW: 640,
    stance: 1,
    bulk: 1,
    fin: 'none',
    wingLight: INK.green,
    chestLight: INK.red,
    visorLight: INK.red,
  },
  {
    id: 'WX-04',
    title: 'Green Meridian',
    scheme: 'carbon',
    spread: 0.7,
    rise: 1.25,
    canvasW: 640,
    stance: 0.82,
    bulk: 0.88,
    fin: 'mast',
    wingLight: INK.green,
    chestLight: INK.green,
    visorLight: INK.green,
  },
  {
    id: 'WX-07',
    title: 'Pale Standard',
    scheme: 'parade',
    spread: 0.84,
    rise: 0.7,
    canvasW: 640,
    stance: 0.94,
    bulk: 1,
    fin: 'blade',
    wingLight: INK.green,
    chestLight: INK.red,
    visorLight: INK.red,
  },
  {
    id: 'WX-12',
    title: 'Cinder Vault',
    scheme: 'carbon',
    spread: 1,
    rise: 0.25,
    canvasW: 960,
    stance: 1.18,
    bulk: 1.12,
    fin: 'none',
    wingLight: INK.red,
    chestLight: INK.red,
    visorLight: INK.red,
  },
  {
    id: 'WX-15',
    title: 'Hex Choir',
    scheme: 'carbon',
    spread: 0.8,
    rise: 1.05,
    canvasW: 640,
    stance: 0.9,
    bulk: 0.96,
    fin: 'vents',
    wingLight: INK.green,
    chestLight: INK.red,
    visorLight: INK.green,
  },
];

const CARD_W = 800;
const CARD_H = 1200;
const FIGURE_H = 960;

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function eagle(cx, cy, s) {
  const x = (sign, n) => (cx + sign * n * s).toFixed(1);
  const y = (n) => (cy + n * s).toFixed(1);
  const wing = (sign) =>
    `${x(sign, 3)},${y(-6)} ${x(sign, 30)},${y(-1)} ${x(sign, 16)},${y(7)} ${x(sign, 2)},${y(3)}`;
  const body = `${cx.toFixed(1)},${y(-12)} ${x(1, 6)},${y(2)} ${cx.toFixed(1)},${y(18)} ${x(-1, 6)},${y(2)}`;
  return `
    <polygon points="${wing(-1)}" fill="${INK.brass}"/>
    <polygon points="${wing(1)}" fill="${INK.brass}"/>
    <polygon points="${body}" fill="${INK.brassShadow}"/>
    <polygon points="${cx.toFixed(1)},${y(-16)} ${x(1, 4)},${y(-8)} ${x(-1, 4)},${y(-8)}" fill="${INK.brass}"/>
  `;
}

function crest(cx, cy, r) {
  return `
    <polygon points="${hexPoints(cx, cy, r)}" fill="${INK.carbon}" stroke="${INK.brass}" stroke-width="3"/>
    <polygon points="${hexPoints(cx, cy, r * 0.78)}" fill="none" stroke="${INK.brassShadow}" stroke-width="2"/>
    ${eagle(cx, cy + r * 0.06, r / 34)}
  `;
}

function feathers(frame, cx) {
  const specs = [
    { y: 330, len: 200, rise: 150 },
    { y: 378, len: 236, rise: 78 },
    { y: 426, len: 250, rise: 8 },
    { y: 474, len: 228, rise: -62 },
    { y: 522, len: 190, rise: -120 },
  ];
  const parts = [];
  for (const side of [-1, 1]) {
    specs.forEach((spec, index) => {
      const root = cx + side * 86;
      const room = side > 0 ? frame.canvasW - 16 - root : root - 16;
      const len = Math.min(spec.len * frame.spread, room);
      const tipX = root + side * len;
      const tipY = spec.y - spec.rise * frame.rise * frame.spread;
      const thickness = 11 + (index % 2);
      const points = [
        `${root},${spec.y - thickness}`,
        `${tipX.toFixed(1)},${tipY.toFixed(1)}`,
        `${root},${spec.y + thickness}`,
        `${root - side * 18},${spec.y}`,
      ].join(' ');
      parts.push(`<polygon points="${points}" fill="${INK.carbon}" stroke="${INK.plate}" stroke-width="2"/>`);
      parts.push(
        `<line x1="${root}" y1="${spec.y}" x2="${tipX.toFixed(1)}" y2="${tipY.toFixed(1)}" stroke="${frame.wingLight}" stroke-width="2" stroke-linecap="square"/>`,
      );
    });
  }
  return parts.join('\n');
}

function fin(frame, cx) {
  if (frame.fin === 'mast') {
    return `<polygon points="${cx - 8},168 ${cx + 8},168 ${cx + 5},118 ${cx - 5},118" fill="${INK.plate}" stroke="${INK.brass}" stroke-width="2"/>`;
  }
  if (frame.fin === 'blade') {
    return `<polygon points="${cx - 6},176 ${cx + 10},170 ${cx + 34},96 ${cx + 8},150" fill="${INK.white}" stroke="${INK.brass}" stroke-width="2"/>`;
  }
  if (frame.fin === 'vents') {
    return `
      <rect x="${cx - 78}" y="214" width="22" height="6" fill="${frame.visorLight}"/>
      <rect x="${cx + 56}" y="214" width="22" height="6" fill="${frame.visorLight}"/>
    `;
  }
  return '';
}

function figureBody(frame) {
  const cx = frame.canvasW / 2;
  const plate = frame.scheme === 'parade' ? INK.white : INK.plate;
  const trim = frame.scheme === 'parade' ? INK.brass : INK.plate;
  const joint = INK.carbon;
  const shoulder = 118 * frame.bulk;
  const waist = 78 * frame.bulk;
  const hip = 96 * frame.stance;
  const legGap = 18 * frame.stance;

  const torso = [
    `${cx - shoulder},300`,
    `${cx + shoulder},300`,
    `${cx + waist},620`,
    `${cx - waist},620`,
  ].join(' ');

  return `
    ${feathers(frame, cx)}
    <polygon points="${cx - shoulder - 28},318 ${cx - shoulder + 16},292 ${cx - shoulder + 8},430 ${cx - shoulder - 46},454" fill="${joint}" stroke="${trim}" stroke-width="2"/>
    <polygon points="${cx + shoulder + 28},318 ${cx + shoulder - 16},292 ${cx + shoulder - 8},430 ${cx + shoulder + 46},454" fill="${joint}" stroke="${trim}" stroke-width="2"/>
    <polygon points="${torso}" fill="${plate}" stroke="${INK.brass}" stroke-width="2"/>
    <polygon points="${cx - waist + 10},470 ${cx + waist - 10},470 ${cx + waist - 18},600 ${cx - waist + 18},600" fill="${joint}" opacity="0.55"/>
    <line x1="${cx - shoulder + 24}" y1="360" x2="${cx + shoulder - 24}" y2="360" stroke="${frame.chestLight}" stroke-width="3"/>
    <line x1="${cx - waist + 16}" y1="560" x2="${cx + waist - 16}" y2="560" stroke="${frame.chestLight}" stroke-width="3"/>
    <line x1="${cx}" y1="318" x2="${cx}" y2="600" stroke="${INK.bg}" stroke-width="2" opacity="0.7"/>
    ${crest(cx, 455, 62)}
    <polygon points="${cx - 46},188 ${cx + 46},188 ${cx + 58},250 ${cx + 34},292 ${cx - 34},292 ${cx - 58},250" fill="${plate}" stroke="${INK.brass}" stroke-width="2"/>
    <rect x="${cx - 36}" y="226" width="72" height="8" fill="${frame.visorLight}"/>
    ${fin(frame, cx)}
    <rect x="${cx - shoulder - 8}" y="430" width="34" height="150" fill="${joint}" stroke="${trim}" stroke-width="2"/>
    <rect x="${cx + shoulder - 26}" y="430" width="34" height="150" fill="${joint}" stroke="${trim}" stroke-width="2"/>
    <polygon points="${cx - hip - legGap},620 ${cx - legGap},620 ${cx - legGap - 8},900 ${cx - hip - legGap - 16},900" fill="${plate}" stroke="${INK.brass}" stroke-width="2"/>
    <polygon points="${cx + legGap},620 ${cx + hip + legGap},620 ${cx + hip + legGap + 16},900 ${cx + legGap + 8},900" fill="${plate}" stroke="${INK.brass}" stroke-width="2"/>
    <rect x="${cx - hip - legGap + 8}" y="700" width="16" height="4" fill="${frame.chestLight}"/>
    <text x="${cx}" y="940" text-anchor="middle" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="22" letter-spacing="3">${esc(frame.id)}</text>
  `;
}

function figureSvg(frame) {
  const plate = frame.scheme === 'parade' ? INK.white : INK.plate;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${frame.canvasW}" height="${FIGURE_H}" viewBox="0 0 ${frame.canvasW} ${FIGURE_H}" role="img">
  <title>${esc(frame.id)} ${esc(frame.title)} placeholder</title>
  <desc>Original WingXAI geometric placeholder. Carbon or parade plating, blade-feather wings, LED seams, and a hex eagle crest. Not a seal and not a franchise design.</desc>
  <rect width="100%" height="100%" fill="${INK.bg}"/>
  <pattern id="twill" width="10" height="10" patternUnits="userSpaceOnUse">
    <path d="M0 10 L10 0" stroke="${plate}" stroke-width="1" opacity="0.45"/>
  </pattern>
  <rect width="100%" height="100%" fill="url(#twill)" opacity="0.35"/>
  ${figureBody(frame)}
</svg>
`;
}

function barcode(seed) {
  const bars = [];
  let x = 48;
  for (let i = 0; i < 46; i += 1) {
    const n = seed.charCodeAt(i % seed.length) + i * 17;
    const w = 2 + (n % 4);
    const h = 36 + (n % 18);
    bars.push(`<rect x="${x}" y="${1148 - h}" width="${w}" height="${h}" fill="${INK.hud}"/>`);
    x += w + 2;
    if (x > 360) break;
  }
  return bars.join('\n');
}

function cardSvg(frame, dossier) {
  const rows = [
    ['NAME', dossier.name],
    ['PILOT', dossier.pilot],
    ['ROLE', dossier.role],
    ['HANDLE', dossier.handle],
    ['UNIT CODE', dossier.unit_code],
    ['CLASS', dossier.class],
    ['AFFILIATION', dossier.affiliation],
  ];
  const rowMarkup = rows
    .map(([label, value], index) => {
      const y = 640 + index * 42;
      return `
        <text x="48" y="${y}" fill="${INK.brass}" font-family="ui-monospace, monospace" font-size="14" letter-spacing="2">${esc(label)}</text>
        <text x="230" y="${y}" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="20">${esc(value)}</text>
      `;
    })
    .join('\n');
  const systems = dossier.systems
    .map((system, index) => {
      const mark = system.status === 'ok' ? '☑' : '☐';
      return `<text x="${48 + index * 180}" y="1048" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="18">${mark} ${esc(system.name)}</text>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" role="img">
  <title>${esc(frame.id)} frame card placeholder</title>
  <desc>Original WingXAI dossier card for ${esc(dossier.name)}. Decorative barcode. Fictional pilot and affiliation.</desc>
  <!-- Decorative barcode. It does not encode a URL or an official identifier. -->
  <rect width="100%" height="100%" fill="${INK.bg}"/>
  <rect x="16" y="16" width="${CARD_W - 32}" height="${CARD_H - 32}" fill="none" stroke="${INK.brass}" stroke-width="2"/>
  <text x="40" y="58" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="20" letter-spacing="3">WINGXAI · PROTOTYPE FRAME</text>
  <line x1="40" y1="74" x2="760" y2="74" stroke="${frame.chestLight}" stroke-width="2"/>
  <svg x="50" y="92" width="700" height="500" viewBox="0 0 ${frame.canvasW} ${FIGURE_H}" preserveAspectRatio="xMidYMid meet">
    ${figureBody(frame)}
  </svg>
  ${rowMarkup}
  <rect x="40" y="916" width="720" height="78" fill="none" stroke="${frame.wingLight}" stroke-width="1"/>
  <text x="56" y="962" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="18">${esc(dossier.quote)}</text>
  ${systems}
  <text x="400" y="1124" fill="${INK.hud}" font-family="ui-monospace, monospace" font-size="18" letter-spacing="2">${esc(frame.id)}</text>
  ${barcode(frame.id)}
</svg>
`;
}

const DOSSIERS = {
  'WX-01': {
    name: 'Ash Ladder',
    pilot: 'KESTREL',
    role: 'Ridge Interceptor',
    handle: '@wx_ashladder',
    unit_code: 'WX-01',
    class: 'Ridge Interceptor',
    affiliation: 'Northline Prototype Yard',
    quote: 'Hold the dark. Light only the seams.',
    systems: [
      { name: 'ARMOR', status: 'ok' },
      { name: 'WINGS', status: 'ok' },
      { name: 'OPTICS', status: 'ok' },
      { name: 'CREST', status: 'off' },
    ],
  },
  'WX-04': {
    name: 'Green Meridian',
    pilot: 'HALYARD',
    role: 'Night Guardian',
    handle: '@wx_meridian',
    unit_code: 'WX-04',
    class: 'Ward Frame',
    affiliation: 'Meridian Test Cohort',
    quote: 'The weave keeps the watch the visor will not blink.',
    systems: [
      { name: 'ARMOR', status: 'ok' },
      { name: 'WINGS', status: 'ok' },
      { name: 'OPTICS', status: 'ok' },
      { name: 'CREST', status: 'ok' },
    ],
  },
  'WX-07': {
    name: 'Pale Standard',
    pilot: 'ORRERY',
    role: 'Parade Vanguard',
    handle: '@wx_palestandard',
    unit_code: 'WX-07',
    class: 'Ceremony Frame',
    affiliation: 'First Unveiling Cohort',
    quote: 'White plate, carbon joints, a crest with no seal.',
    systems: [
      { name: 'ARMOR', status: 'ok' },
      { name: 'WINGS', status: 'ok' },
      { name: 'OPTICS', status: 'ok' },
      { name: 'CREST', status: 'ok' },
    ],
  },
  'WX-12': {
    name: 'Cinder Vault',
    pilot: 'BRACK',
    role: 'Low-Angle Striker',
    handle: '@wx_cindervault',
    unit_code: 'WX-12',
    class: 'Menace Frame',
    affiliation: 'Vault Prototype Cell',
    quote: 'Spread the blades. The visor speaks first.',
    systems: [
      { name: 'ARMOR', status: 'ok' },
      { name: 'WINGS', status: 'ok' },
      { name: 'OPTICS', status: 'ok' },
      { name: 'CREST', status: 'off' },
    ],
  },
  'WX-15': {
    name: 'Hex Choir',
    pilot: 'SABLE',
    role: 'Seam Warden',
    handle: '@wx_hexchoir',
    unit_code: 'WX-15',
    class: 'Choir Frame',
    affiliation: 'Hex Yard Atelier',
    quote: 'Count the seams. The crest answers in brass.',
    systems: [
      { name: 'ARMOR', status: 'ok' },
      { name: 'WINGS', status: 'ok' },
      { name: 'OPTICS', status: 'ok' },
      { name: 'CREST', status: 'ok' },
    ],
  },
};

function markSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img">
  <title>WingXAI mark</title>
  <rect width="64" height="64" fill="${INK.bg}"/>
  ${crest(32, 32, 26)}
</svg>
`;
}

await mkdir(outDir, { recursive: true });
await writeFile(path.join(root, 'public', 'favicon.svg'), markSvg());

for (const frame of FRAMES) {
  const slug = frame.id.toLowerCase();
  await writeFile(path.join(outDir, `${slug}.svg`), figureSvg(frame));
  await writeFile(path.join(outDir, `${slug}-card.svg`), cardSvg(frame, DOSSIERS[frame.id]));
  process.stdout.write(`${frame.id} figure ${frame.canvasW}x${FIGURE_H} card ${CARD_W}x${CARD_H}\n`);
}
