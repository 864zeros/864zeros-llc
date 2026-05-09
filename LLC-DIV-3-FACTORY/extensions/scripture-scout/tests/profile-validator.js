// ============================================================
// PROFILE VALIDATOR — [FHG] ScriptureScout
// 864zeros LLC | For His Grace · Heritage-first technology
// Strike 012 / Quality Gate Q4 / 2026-05-08
// ============================================================
//
// Validation harness for the 3 production selector profiles.
//
// Tests:
//   1. BibleGateway "Clean-Room" — sanitizeFragment strips noise selectors
//      (.footnote, .versenum, .crossreference) before markdown conversion.
//   2. Blue Letter Bible "Precision" — metadata_extractor pulls reference
//      and translation from a real DOM into a JS object.
//   3. BibleHub "Table Integrity" — buildInterlinearTable produces a valid
//      GFM table with | Greek | Translit | English | Strongs | headers.
//   4. WCAG AA contrast audit for the Slate & Sage / Charcoal & Bronze /
//      Parchment palette tokens.
//
// USAGE
// -----
//   cd extensions/scripture-scout
//   npm install       # one-time, installs jsdom
//   npm test          # OR: node tests/profile-validator.js
//
// EXIT CODES
// ----------
//   0 = all tests passed
//   1 = one or more tests failed
// ============================================================

import { JSDOM } from 'jsdom';
import { sanitizeFragment, buildInterlinearTable } from '../lib/markdown-converter.js';
import { SELECTOR_PROFILES } from '../scripts/selectors.js';

// --- Install DOMParser globally so the converter functions work ---
const setupDom = new JSDOM('');
globalThis.DOMParser = setupDom.window.DOMParser;

// ============================================================
// Test runner
// ============================================================

const results = [];
let passed = 0;
let failed = 0;
let currentSection = '';

function section(label) {
  currentSection = label;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(label);
  console.log('─'.repeat(60));
}

function record(ok, label, detail) {
  if (ok) {
    passed++;
    results.push({ section: currentSection, status: 'PASS', label, detail: detail || '' });
    console.log(`  ✓ PASS · ${label}`);
  } else {
    failed++;
    results.push({ section: currentSection, status: 'FAIL', label, detail: detail || '' });
    console.log(`  ✗ FAIL · ${label}` + (detail ? ` — ${detail}` : ''));
  }
}

function assertOk(condition, label, detail) {
  return record(!!condition, label, detail);
}

function assertEqual(actual, expected, label) {
  const ok = actual === expected;
  return record(ok, label, ok ? '' : `expected "${expected}", got "${actual}"`);
}

function assertContains(haystack, needle, label) {
  const ok = typeof haystack === 'string' && haystack.includes(needle);
  return record(ok, label, ok ? '' : `expected to contain "${needle}"`);
}

function assertNotContains(haystack, needle, label) {
  const ok = typeof haystack === 'string' && !haystack.includes(needle);
  return record(ok, label, ok ? '' : `expected NOT to contain "${needle}"`);
}

// ============================================================
// Test 1: BibleGateway Clean-Room
// ============================================================

section('TEST 1 · BibleGateway Clean-Room (sanitizeFragment strips noise)');

const bgRawHtml = `
  <div class="passage-content">
    <h3 class="passage-display-tab">John 3:16</h3>
    <p>
      <span class="versenum">16</span>
      For God so loved the world<sup class="footnote"><a href="#fa">[a]</a></sup>,
      that he gave his only Son<sup class="crossreference"><a href="#cra">[A]</a></sup>,
      that whoever believes in him should not perish but have eternal life.
    </p>
    <p>
      <span class="chapternum">17</span>
      For God did not send his Son into the world to condemn the world<a class="bibleref">[ref]</a>.
    </p>
  </div>
`;

const bgNoise = SELECTOR_PROFILES['biblegateway.com'].selectors.noise;
const bgCleaned = sanitizeFragment(bgRawHtml, bgNoise);

assertOk(bgNoise.length === 6, 'BG profile declares 6 noise selectors');
assertNotContains(bgCleaned, 'class="versenum"', 'BG · .versenum stripped');
assertNotContains(bgCleaned, 'class="footnote"', 'BG · .footnote stripped');
assertNotContains(bgCleaned, 'class="crossreference"', 'BG · .crossreference stripped');
assertNotContains(bgCleaned, 'class="chapternum"', 'BG · .chapternum stripped');
assertNotContains(bgCleaned, 'class="bibleref"', 'BG · .bibleref stripped');
assertContains(bgCleaned, 'For God so loved the world', 'BG · prose preserved (verse 16)');
assertContains(bgCleaned, 'that he gave his only Son', 'BG · prose preserved');
assertContains(bgCleaned, 'For God did not send his Son', 'BG · prose preserved (verse 17)');

// ============================================================
// Test 2: Blue Letter Bible Precision
// ============================================================

section('TEST 2 · Blue Letter Bible Precision (metadata_extractor)');

const blbHtml = `
  <html>
    <head><title>BLB · John 3:16</title></head>
    <body>
      <header>
        <div class="verse-ref">John 3:16</div>
        <div class="translation-id">KJV</div>
      </header>
      <div class="verse-text">
        For God so loved the world, that he gave his only begotten Son,
        that whosoever believeth in him should not perish, but have everlasting life.
      </div>
    </body>
  </html>
`;

const blbDom = new JSDOM(blbHtml);
const blbDoc = blbDom.window.document;
const blbProfile = SELECTOR_PROFILES['blueletterbible.org'];
const blbMeta = blbProfile.metadata_extractor(blbDoc);

assertEqual(blbMeta.reference, 'John 3:16', 'BLB · reference extracted');
assertEqual(blbMeta.translation, 'KJV', 'BLB · translation extracted');
assertOk(typeof blbMeta.timestamp === 'string', 'BLB · timestamp is a string');
assertOk(blbMeta.timestamp.includes('T') && blbMeta.timestamp.includes('Z'), 'BLB · timestamp is ISO 8601');

// Translation fallback when missing
const blbHtmlNoTrans = `
  <html><body>
    <div class="verse-ref">Genesis 1:1</div>
    <div class="verse-text">In the beginning...</div>
  </body></html>
`;
const blbDocNoTrans = new JSDOM(blbHtmlNoTrans).window.document;
const blbMetaNoTrans = blbProfile.metadata_extractor(blbDocNoTrans);
assertEqual(blbMetaNoTrans.translation, 'KJV', 'BLB · translation falls back to KJV when missing');

// ============================================================
// Test 3: BibleHub Interlinear Table Integrity
// ============================================================

section('TEST 3 · BibleHub Interlinear Table Integrity (buildInterlinearTable)');

const bhInterlinearHtml = `
  <table class="interlinear">
    <tr><th>Strongs</th><th>Greek</th><th>Translit</th><th>English</th></tr>
    <tr>
      <td class="strongsnum">G2316</td>
      <td class="greek">θεός</td>
      <td class="translit">theos</td>
      <td class="english">God</td>
    </tr>
    <tr>
      <td class="strongsnum">G3173</td>
      <td class="greek">μέγας</td>
      <td class="translit">megas</td>
      <td class="english">great</td>
    </tr>
    <tr>
      <td class="strongsnum">G2962</td>
      <td class="greek">κύριος</td>
      <td class="translit">kurios</td>
      <td class="english">Lord</td>
    </tr>
  </table>
`;

const bhTable = buildInterlinearTable(bhInterlinearHtml);

assertOk(bhTable !== null, 'BH · returns table (not null)');
assertContains(bhTable, '| Greek | Translit | English | Strongs |', 'BH · GFM header row');
assertContains(bhTable, '| --- | --- | --- | --- |', 'BH · GFM separator row');
assertContains(bhTable, 'θεός', 'BH · Greek word θεός in table');
assertContains(bhTable, 'theos', 'BH · transliteration in table');
assertContains(bhTable, 'God', 'BH · English in table');
assertContains(bhTable, 'G2316', 'BH · Strongs in table');
assertContains(bhTable, 'κύριος', 'BH · 3rd row Greek (κύριος) in table');
assertContains(bhTable, 'kurios', 'BH · 3rd row translit in table');

// Verify the table has at least 5 lines (header + separator + 3 data rows)
const bhLineCount = bhTable.split('\n').length;
assertOk(bhLineCount >= 5, `BH · table has ≥5 lines (got ${bhLineCount})`);

// Cell-position fallback (no class names, raw <td> cells)
const bhRawTable = `
  <table class="interlinear">
    <tr>
      <td>G2316</td><td>θεός</td><td>theos</td><td>God</td>
    </tr>
  </table>
`;
const bhFallback = buildInterlinearTable(bhRawTable);
assertOk(bhFallback !== null, 'BH · cell-position fallback returns table');
assertContains(bhFallback, 'θεός', 'BH · cell-position: Greek extracted');
assertContains(bhFallback, 'theos', 'BH · cell-position: translit extracted');
assertContains(bhFallback, 'God', 'BH · cell-position: English extracted');
assertContains(bhFallback, 'G2316', 'BH · cell-position: Strongs extracted');

// Pipe escaping safety (rare but possible in some texts)
const bhPipeTest = `
  <table class="interlinear">
    <tr>
      <td class="greek">α|β</td>
      <td class="translit">alpha|beta</td>
      <td class="english">A | B</td>
      <td class="strongsnum">G0001</td>
    </tr>
  </table>
`;
const bhPipeResult = buildInterlinearTable(bhPipeTest);
assertContains(bhPipeResult, '\\|', 'BH · pipes inside cells are GFM-escaped');

// ============================================================
// Test 4: WCAG AA Contrast Audit (palette accessibility)
// ============================================================

section('TEST 4 · WCAG AA Contrast Audit (Parchment + Charcoal palettes)');

function relativeLuminance(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hexA, hexB) {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function auditPair(label, fg, bg, requireNormal = true) {
  const ratio = contrastRatio(fg, bg);
  const passNormal = ratio >= 4.5;
  const passLarge = ratio >= 3.0;
  const passAAA = ratio >= 7.0;
  const required = requireNormal ? passNormal : passLarge;
  record(
    required,
    `${label} — fg ${fg} on bg ${bg}: ratio ${ratio.toFixed(2)}:1 ${
      passAAA ? '(AAA)' : passNormal ? '(AA normal)' : passLarge ? '(AA large only)' : '(FAILS)'
    }`,
    required ? '' : `WCAG AA${requireNormal ? ' normal-text' : ' large-text'} requires ${requireNormal ? '≥ 4.5:1' : '≥ 3.0:1'}`
  );
}

// Pair as specified in directive: #F5F5F5 (Warm-White) + #A67C52 (regular Bronze, default --oia-sage in dark theme)
auditPair('Bronze on Warm-White (literal directive: #F5F5F5 + #A67C52)', '#A67C52', '#F5F5F5');

// Actual Light-theme combo (Parchment + deeper Bronze) per scripture-scout's [data-theme="light"]
auditPair('Deeper Bronze on Parchment (FHG Light theme actual: #8C6743 + #F5EDD8)', '#8C6743', '#F5EDD8');

// FHG Dark theme — Warm White text on Charcoal background (the default)
auditPair('Warm-White on Charcoal (FHG Dark text-on-bg)', '#F5F5F5', '#2D2D2D');

// FHG Dark theme — Bronze accent on Charcoal (button text on charcoal cards)
auditPair('Bronze on Charcoal (FHG Dark accent-on-bg)', '#A67C52', '#3D3D3D');

// FHG Light theme — Deep Brown text on Parchment (body text)
auditPair('Deep Brown on Parchment (FHG Light text-on-bg)', '#2D2419', '#F5EDD8');

// ============================================================
// Output summary
// ============================================================

console.log(`\n${'═'.repeat(60)}`);
console.log(`SUMMARY — ${passed + failed} tests · ${passed} passed · ${failed} failed`);
console.log(`${'═'.repeat(60)}\n`);

const sectionStats = {};
for (const r of results) {
  if (!sectionStats[r.section]) sectionStats[r.section] = { pass: 0, fail: 0 };
  sectionStats[r.section][r.status === 'PASS' ? 'pass' : 'fail']++;
}
for (const [sect, stat] of Object.entries(sectionStats)) {
  const allPass = stat.fail === 0;
  console.log(`${allPass ? '✓' : '✗'} ${sect.padEnd(48)} ${stat.pass}/${stat.pass + stat.fail}`);
}

if (failed > 0) {
  console.log('\nFailures detail:');
  for (const r of results.filter((x) => x.status === 'FAIL')) {
    console.log(`  · [${r.section}] ${r.label}${r.detail ? ' — ' + r.detail : ''}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
