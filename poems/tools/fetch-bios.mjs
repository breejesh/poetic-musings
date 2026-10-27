// Fetches a short biography for every poet from Wikipedia (CC BY-SA 4.0) into ../scripts/bios.json.
// Each match is verified (must describe a writer, and must mention the poet's birth year when we know it),
// so namesakes and disambiguation pages are skipped rather than shown as the wrong person.
// Resumable: poets already in bios.json are skipped. Run `npm run data` afterwards to publish.
//
// Usage: node tools/fetch-bios.mjs [--retry-missing]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'public/data/catalog.json');
const OUT = path.resolve(ROOT, '../scripts/bios.json');
const API = 'https://en.wikipedia.org/w/api.php';
const HEADERS = { 'User-Agent': 'PoeticMusings-build/1.0 (poetry reading site; bio import script)' };
const WRITER = /\b(poet|poetry|poetess|writer|author|novelist|playwright|dramatist|essayist|translator|lyricist|songwriter|hymn ?writer|critic|man of letters|memoirist|librettist)\b/i;

if (!fs.existsSync(CATALOG)) {
  console.error('Run `npm run data` first (needs public/data/catalog.json).');
  process.exit(1);
}
const { poets } = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const bios = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const retry = process.argv.includes('--retry-missing');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function query(titles) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    prop: 'extracts|description|info',
    inprop: 'url',
    exintro: '1',
    explaintext: '1',
    exlimit: '20',
    maxlag: '5',
    titles: titles.join('|'),
  });
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(`${API}?${params}`, { headers: HEADERS });
    if (res.ok) {
      const json = await res.json();
      if (!json.error) return json.query;
    }
    // Respect Wikimedia's rate limits (429 + Retry-After).
    const wait = Number(res.headers.get('retry-after')) || 2 * (attempt + 1);
    await sleep((wait + 1) * 1000);
  }
  throw new Error('Wikipedia API failed for: ' + titles.join(', '));
}

/** Map requested title → page, following normalisations and redirects. */
function resolve(q, title) {
  let t = title;
  for (const n of q.normalized ?? []) if (n.from === t) t = n.to;
  for (const r of q.redirects ?? []) if (r.from === t) t = r.to;
  return q.pages.find((p) => p.title === t);
}

function accept(page, born) {
  if (!page || page.missing || !page.extract) return false;
  const head = `${page.description ?? ''} ${page.extract.slice(0, 400)}`;
  if (/may refer to|refers? to the same term|common personal name/i.test(head)) return false;
  if (!WRITER.test(head)) return false;
  if (born && ![born - 1, born, born + 1].some((y) => head.includes(String(y)))) return false;
  return true;
}

function clean(extract) {
  return extract
    .replace(/\(\s*[;,]\s*/g, '(') // leftover pronunciation stubs: "( ; born …"
    .replace(/\s*\(\s*\)/g, '')
    .replace(/\[[^\]]*\]/g, '') // IPA and footnote brackets
    .replace(/ {2,}/g, ' ')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n\n');
}

async function run(candidates, label) {
  for (let i = 0; i < candidates.length; i += 20) {
    const batch = candidates.slice(i, i + 20);
    const q = await query(batch.map((c) => c.title));
    for (const c of batch) {
      const page = resolve(q, c.title);
      if (accept(page, c.born)) {
        bios[c.slug] = { bio: clean(page.extract), description: page.description ?? '', url: page.canonicalurl ?? page.fullurl, title: page.title };
      } else if (!bios[c.slug]) {
        bios[c.slug] = null;
      }
    }
    fs.writeFileSync(OUT, JSON.stringify(bios, null, 1));
    process.stdout.write(`\r[bios] ${label}: ${Math.min(i + 20, candidates.length)}/${candidates.length}`);
    await sleep(1000);
  }
  process.stdout.write('\n');
}

// [slug, name, born, died, movements, state, portrait]
const todo = poets.filter(([slug]) => !(slug in bios) || (retry && bios[slug] === null));
await run(todo.map(([slug, name, born]) => ({ slug, title: name, born })), 'by name');
// Second pass for namesakes and ambiguous names: "Name (poet)".
const misses = todo.filter(([slug]) => bios[slug] === null);
await run(misses.map(([slug, name, born]) => ({ slug, title: `${name} (poet)`, born })), 'as "(poet)"');

const found = Object.values(bios).filter(Boolean).length;
console.log(`[bios] ${found} of ${poets.length} poets have a verified Wikipedia biography → ${path.relative(ROOT, OUT)}`);
