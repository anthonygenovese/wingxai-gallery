import assert from 'node:assert/strict';
import { matchBrand, scanPost, isClean, BRAND_LIST } from './brand-scanner.js';

// ---------- matchBrand ----------

assert.equal(matchBrand('Tesla is great', 'Tesla'), 'tesla', 'lowercase match works with capital input brand name (normalized)'); // note: matchBrand normalizes both sides, so 'Tesla' input -> 'tesla' needle
assert.equal(matchBrand('I love TESLA', 'tesla'), 'tesla', 'case-insensitive');
assert.equal(matchBrand('teslas everywhere', 'tesla'), null, 'plural does not match (whole-word)');
assert.equal(matchBrand('nottesla', 'tesla'), null, 'embedded does not match (whole-word)');
assert.equal(matchBrand('SpaceX launched today', 'SpaceX'), 'spacex', 'company with X suffix');
assert.equal(matchBrand('Starlink V3 satellites', 'Starlink'), 'starlink', 'product family name');
assert.equal(matchBrand("Hang 'Em High", 'Hang Em High'), null, 'apostrophe-bearing phrase not in list');
assert.equal(matchBrand('Wing Zero custom', 'Wing Zero'), 'wing zero', 'franchise name with space');
assert.equal(matchBrand('Elon Musk tweeted', 'Elon Musk'), 'elon musk', 'person name with space');
assert.equal(matchBrand('no brands here at all', 'Tesla'), null, 'clean text returns null');

// ---------- scanPost: clean ----------

{
  const r = scanPost('if you can not Hang \'Em High we can not relate.');
  assert.equal(r.clean, true, 'Halo reply is clean (no real brands)');
  assert.equal(r.hits.length, 0);
  assert.equal(r.action, 'map', 'clean posts still map normally');
  assert.equal(r.reason.includes('Safe to map'), true);
}

{
  const r = scanPost('Starship is the future of spaceflight.');
  assert.equal(r.clean, false);
  assert.ok(r.hits.some((h) => h.name === 'Starship'));
  assert.ok(r.categories.includes('company'));
  assert.equal(r.action, 'map', 'brand detected -> map topic, do not skip by default');
  assert.ok(r.reason.includes('Map the post'));
}

// ---------- scanPost: RP-01 ----------

{
  const rp01 = `
    SPACEX VARIANT STARLINK-06
    STARSHIP'S UPCOMING 14TH TEST FLIGHT WILL DELIVER 26
    STARLINK V3 SATELLITES TO ORBIT.
    EACH STARLINK V3 SATELLITE WILL ADD 1 TBPS.
    DEPLOYED FROM STARIHIP ON FALCON 9.
    UNIT TYPE: STARLINK V3 PROTOTYPE
  `;
  const r = scanPost(rp01);
  assert.equal(r.clean, false, 'RP-01 must be flagged');
  const names = r.hits.map((h) => h.name).sort();
  for (const expected of ['SpaceX', 'Starlink', 'Starlink V3', 'Starship', 'Falcon 9', 'Falcon']) {
    assert.ok(names.includes(expected), `RP-01 must catch ${expected}, got ${names.join(',')}`);
  }
  assert.ok(r.categories.includes('company'));
  assert.ok(r.categories.includes('product'));
  assert.ok(r.reason.includes('fictional'));
}

// ---------- scanPost: mixed real + fictional ----------

{
  const r = scanPost('My Gundam-inspired robot uses Tesla batteries and flies like a dragon.');
  assert.equal(r.clean, false);
  const names = r.hits.map((h) => h.name).sort();
  assert.deepEqual(names, ['Gundam', 'Tesla'].sort());
  assert.ok(r.categories.includes('franchise'));
  assert.ok(r.categories.includes('company'));
}

// ---------- isClean ----------

assert.equal(isClean('a quiet post about the weather'), true);
assert.equal(isClean('Tesla stock is up'), false);

// ---------- list integrity ----------

assert.ok(BRAND_LIST.length >= 60, `seed list should be substantial, got ${BRAND_LIST.length}`);
const names = BRAND_LIST.map((b) => b.name);
assert.equal(new Set(names).size, names.length, 'no duplicate brand names in the list');
for (const b of BRAND_LIST) {
  assert.ok(['company', 'product', 'franchise', 'person'].includes(b.category), `${b.name} has valid category`);
}

console.log('brand-scanner tests passed');
