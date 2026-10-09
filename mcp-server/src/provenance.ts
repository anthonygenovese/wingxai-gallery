/**
 * Provenance attached to every tool payload.
 * real_people: false means no real people. franchise_designs: false means no franchise designs.
 * license is still a placeholder; the owner has not chosen terms. See the style card, section 7.2.
 */
export const PROVENANCE = {
  source: 'wingxai.gallery',
  license: '[license id]',
  original_design: true,
  real_people: false,
  franchise_designs: false,
  statement: 'No real people. No franchise designs.',
  references: 'mood board, style only',
} as const;

export function provenanceLine(): string {
  return 'Provenance: source wingxai.gallery; license [license id]; original_design true; no real people; no franchise designs.';
}
