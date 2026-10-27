// Converts the raw poets.org scrape in ../scripts into the static data the app serves:
//   public/data/catalog.json        compact index of every poem + poet (loaded once)
//   public/data/poems/<slug>.json   one file per poem with its parsed lines
//   public/data/poets/<slug>.json   poet biography (from ../scripts/bios.json, see tools/fetch-bios.mjs)
//   public/portraits/{96,320}/<slug>.webp
//
// Usage: node tools/build-data.mjs [--if-missing] [--skip-images]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, '../scripts');
const OUT_DATA = path.join(ROOT, 'public/data');
const OUT_POEMS = path.join(OUT_DATA, 'poems');
const OUT_POETS = path.join(OUT_DATA, 'poets');
const BIOS = path.join(SRC, 'bios.json');
const OUT_PORTRAITS = path.join(ROOT, 'public/portraits');
const CATALOG = path.join(OUT_DATA, 'catalog.json');

const args = new Set(process.argv.slice(2));
if (args.has('--if-missing') && fs.existsSync(CATALOG)) process.exit(0);

// Words per minute for a measured, read-aloud pace. Drives the "track length".
const WPM = 130;
// Poems published before this year are filed under Classics.
const CLASSIC_BEFORE = 1950;

// ---------------------------------------------------------------- helpers

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…' };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code !== 13 ? String.fromCodePoint(code) : '';
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '');
const plain = (html) => decode(stripTags(html)).replace(/\s+/g, ' ').trim();

function readPages(dir) {
  const files = fs.readdirSync(path.join(SRC, dir)).filter((f) => /^data_\d+\.json$/.test(f));
  files.sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)));
  return files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(SRC, dir, f), 'utf8')).rows);
}

const year = (s) => {
  const m = String(s ?? '').match(/\d{3,4}/);
  const y = m ? parseInt(m[0], 10) : NaN;
  // Guard against scraped noise like "15" or "0019".
  return y >= 600 && y <= new Date().getFullYear() + 1 ? y : null;
};

// ---------------------------------------------------------------- body -> lines

const INLINE = { em: 'em', i: 'em', strong: 'strong', b: 'strong', u: 'u', sup: 'sup', sub: 'sub', s: 's', strike: 's' };

/**
 * Turns the poem's HTML body into lines. Each line is [indent, html] where html only
 * contains balanced inline tags; an empty html marks a stanza break.
 */
export function parseBody(body) {
  let h = body.replace(/&#13;|\r/g, '');
  h = h.replace(/<(style|script|iframe|noscript)[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<img[^>]*>/gi, '');

  // <pre> keeps its own line breaks and spacing.
  h = h.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => {
    const lines = inner.replace(/\t/g, '    ').split('\n');
    return '<p>' + lines.map((l) => l.replace(/ {2,}/g, (sp) => ' '.repeat(sp.length)).replace(/^ /, ' ')).join('<br>') + '</p>';
  });

  h = h.replace(/[ \t\n]+/g, ' ');
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<\/?(p|blockquote|h[1-6]|ul|ol|table|tbody|center|hr)\b[^>]*>/gi, '\n\n');
  h = h.replace(/<\/?(div|li|tr)\b[^>]*>/gi, '\n');
  h = h.replace(/<\/td>/gi, '\n');

  // Keep a small set of inline tags (normalised, attributes dropped); strip everything else.
  h = h.replace(/<(\/?)([a-z0-9]+)\b[^>]*>/gi, (_, close, tag) => {
    const t = INLINE[tag.toLowerCase()];
    return t ? `<${close}${t}>` : '';
  });

  const out = [];
  const open = [];
  for (const raw of h.split('\n')) {
    const prefix = open.map((t) => `<${t}>`).join('');
    let line = raw.replace(/\s+$/, '');
    for (const m of line.matchAll(/<(\/?)(em|strong|u|sup|sub|s)>/g)) {
      if (m[1]) {
        const i = open.lastIndexOf(m[2]);
        if (i >= 0) open.splice(i, 1);
      } else open.push(m[2]);
    }
    const suffix = [...open].reverse().map((t) => `</${t}>`).join('');
    const lead = line.match(/^(?:\s| |<[^>]+>)*/)[0];
    const indent = (stripTags(lead).match(/[\s ]/g) || []).length;
    line = lead.replace(/[\s ]/g, '') + line.slice(lead.length);
    const html = (prefix + line + suffix).replace(/<(em|strong|u|sup|sub|s)><\/\1>/g, '');
    if (!plain(html)) {
      if (out.length && out[out.length - 1][1] !== '') out.push([0, '']);
      continue;
    }
    out.push([Math.min(Math.round(indent / 2), 24), html.trim()]);
  }
  while (out.length && out[out.length - 1][1] === '') out.pop();
  return out;
}

/** Drop pronunciation guides like "( YAYTS; " and keep the intro to a readable length. */
function tidyBio(bio) {
  const paras = bio
    .replace(/\(\s*[^();\d]*?[A-Z]{2,}[^();\d]*;\s*/g, '(')
    .replace(/,?\s*[A-Z][a-z]+:\s*(?=[;)])/g, '') // empty "Vietnamese: ;" left after stripping IPA
    .replace(/\(\s*;\s*/g, '(')
    .replace(/\(\s*\)/g, '')
    .split(/\n\n+/);
  const out = [];
  let len = 0;
  for (const p of paras) {
    if (out.length && len + p.length > 1100) break;
    out.push(p);
    len += p.length;
  }
  return out;
}

// ---------------------------------------------------------------- build

function build() {
  const rawPoets = readPages('poets');
  const rawPoems = readPages('poems');

  const poetInfo = new Map();
  for (const p of rawPoets) {
    const slug = p.view_node.split('/')[2];
    if (!slug || poetInfo.has(slug)) continue;
    poetInfo.set(slug, {
      name: plain(p.poets),
      born: year(p.field_dob),
      died: year(p.field_dod),
      movements: p.field_school_movement.split(',').map((s) => plain(s)).filter(Boolean),
      state: plain(p.field_state),
    });
  }

  fs.rmSync(OUT_POEMS, { recursive: true, force: true });
  fs.mkdirSync(OUT_POEMS, { recursive: true });

  const seen = new Set();
  const poetIndex = new Map();
  const poets = [];
  const poems = [];
  const imageDir = path.join(SRC, 'images');
  const images = new Set(fs.readdirSync(imageDir).map((f) => f.replace(/\.jpg$/, '')));

  for (const p of rawPoems) {
    const slug = p.view_node.split('/')[2];
    if (!slug || seen.has(slug) || !/^[a-z0-9-]+$/i.test(slug)) continue;
    const lines = parseBody(p.body || '');
    if (!lines.length) continue;
    seen.add(slug);

    const authorSlug = (p.field_author.match(/href="\/poet\/([^"]+)"/) || [])[1] ?? null;
    const authorText = plain(p.field_author) || 'Anonymous';
    let poetIdx = -1;
    if (authorSlug) {
      if (!poetIndex.has(authorSlug)) {
        const info = poetInfo.get(authorSlug) ?? { name: authorText, born: null, died: null, movements: [], state: '' };
        poetIndex.set(authorSlug, poets.length);
        poets.push([authorSlug, info.name, info.born, info.died, info.movements.join('|'), info.state, images.has(authorSlug) ? 1 : 0]);
      }
      poetIdx = poetIndex.get(authorSlug);
    }
    const poetName = poetIdx >= 0 ? poets[poetIdx][1] : authorText;

    const text = lines.map(([, l]) => plain(l)).join(' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    const lineCount = lines.filter(([, l]) => l).length;
    const stanzas = lines.filter(([, l]) => !l).length + 1;
    const seconds = Math.max(12, Math.round((words / WPM) * 60 + stanzas * 1.2));

    let published = year(p.field_date_published);
    const died = poetIdx >= 0 ? poets[poetIdx][3] : null;
    const classic = published ? published < CLASSIC_BEFORE : died != null && died < CLASSIC_BEFORE;
    const title = plain(p.title) || 'Untitled';

    // [slug, title, poetIdx, authorOverride, year, seconds, lineCount, category(0 classic,1 contemporary)]
    poems.push([slug, title, poetIdx, authorText !== poetName ? authorText : 0, published, seconds, lineCount, classic ? 0 : 1]);

    fs.writeFileSync(
      path.join(OUT_POEMS, slug + '.json'),
      JSON.stringify({ slug, title, author: authorText, poet: authorSlug, year: published, lines }),
    );
  }

  // Biographies (verified Wikipedia intros, CC BY-SA). Flag each poet so the app knows to fetch one.
  fs.rmSync(OUT_POETS, { recursive: true, force: true });
  fs.mkdirSync(OUT_POETS, { recursive: true });
  const bios = fs.existsSync(BIOS) ? JSON.parse(fs.readFileSync(BIOS, 'utf8')) : {};
  let withBio = 0;
  for (const poet of poets) {
    const b = bios[poet[0]];
    poet.push(b ? 1 : 0);
    if (!b) continue;
    withBio++;
    fs.writeFileSync(path.join(OUT_POETS, poet[0] + '.json'), JSON.stringify({ bio: tidyBio(b.bio), description: b.description, source: b.url }));
  }

  fs.writeFileSync(CATALOG, JSON.stringify({ v: 1, built: new Date().toISOString(), poets, poems }));
  console.log(`[data] ${withBio} poet biographies`);
  const size = (fs.statSync(CATALOG).size / 1024).toFixed(0);
  console.log(`[data] ${poems.length} poems, ${poets.length} poets → catalog.json (${size} KB)`);
  return poets.filter((p) => p[6]).map((p) => p[0]);
}

async function portraits(slugs) {
  const sharp = (await import('sharp')).default;
  const sizes = [96, 320];
  for (const s of sizes) fs.mkdirSync(path.join(OUT_PORTRAITS, String(s)), { recursive: true });
  const todo = slugs.filter((slug) => sizes.some((s) => !fs.existsSync(path.join(OUT_PORTRAITS, String(s), slug + '.webp'))));
  let done = 0;
  const worker = async () => {
    while (todo.length) {
      const slug = todo.pop();
      const src = path.join(SRC, 'images', slug + '.jpg');
      try {
        for (const s of sizes) {
          await sharp(src).resize(s, s, { fit: 'cover', position: 'attention' }).webp({ quality: s > 100 ? 74 : 68 }).toFile(path.join(OUT_PORTRAITS, String(s), slug + '.webp'));
        }
      } catch (e) {
        console.warn(`[data] portrait failed for ${slug}: ${e.message}`);
      }
      if (++done % 250 === 0) console.log(`[data] portraits ${done}…`);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`[data] portraits ready (${slugs.length})`);
}

const withImages = build();
if (!args.has('--skip-images')) await portraits(withImages);
