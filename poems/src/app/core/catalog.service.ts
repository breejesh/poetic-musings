import { Injectable, computed, signal } from '@angular/core';
import { ERAS, Era, Movement, Poet, PoemDetail, PoetBio, Track } from './models';
import { fold, hash, slugify } from './format';

type RawPoet = [slug: string, name: string, born: number | null, died: number | null, movements: string, state: string, portrait: 0 | 1, bio?: 0 | 1];
type RawPoem = [slug: string, title: string, poet: number, author: string | 0, year: number | null, seconds: number, lines: number, category: 0 | 1];

interface SearchEntry {
  track?: Track;
  poet?: Poet;
  text: string;
}

export interface SearchResults {
  poems: Track[];
  poets: Poet[];
  movements: Movement[];
}

/** Read-only index of every poem and poet, loaded once from /data/catalog.json. */
@Injectable({ providedIn: 'root' })
export class CatalogService {

  private readonly state = signal<{ tracks: Track[]; poets: Poet[] } | null>(null);
  readonly error = signal<string | null>(null);
  readonly ready = computed(() => this.state() !== null);

  /** All catalogued poems in chart order. */
  readonly tracks = computed(() => this.state()?.tracks ?? []);
  readonly poets = computed(() => this.state()?.poets ?? []);
  readonly popularPoets = computed(() => [...this.poets()].sort((a, b) => a.topRank - b.topRank));
  readonly classics = computed(() => this.tracks().filter((t) => t.category === 'classic'));
  readonly contemporary = computed(() => this.tracks().filter((t) => t.category === 'contemporary'));

  private readonly bySlug = computed(() => new Map(this.tracks().map((t) => [t.slug, t])));
  private readonly poetBySlug = computed(() => new Map(this.poets().map((p) => [p.slug, p])));

  readonly movements = computed<Movement[]>(() => {
    const map = new Map<string, Movement>();
    for (const poet of this.popularPoets()) {
      for (const name of poet.movements) {
        const slug = slugify(name);
        let m = map.get(slug);
        if (!m) map.set(slug, (m = { slug, name, poets: [] }));
        m.poets.push(poet);
      }
    }
    return [...map.values()].sort((a, b) => b.poets.length - a.poets.length);
  });

  private searchIndex: SearchEntry[] | null = null;
  private detailCache = new Map<string, Promise<PoemDetail>>();
  private bioCache = new Map<string, Promise<PoetBio | null>>();

  constructor() {
    this.load();
  }

  private async load() {
    try {
      const res = await fetch('data/catalog.json');
      if (!res.ok) throw new Error(`catalog.json ${res.status}`);
      const raw = (await res.json()) as { poets: RawPoet[]; poems: RawPoem[] };
      const poets: Poet[] = raw.poets.map(([slug, name, born, died, movements, state, portrait, bio]) => ({
        slug,
        name,
        born,
        died,
        movements: movements ? movements.split('|') : [],
        state,
        hasPortrait: portrait === 1,
        hasBio: bio === 1,
        topRank: Number.MAX_SAFE_INTEGER,
        poems: [],
      }));
      const tracks: Track[] = raw.poems.map(([slug, title, poetIdx, author, year, seconds, lines, category], i) => {
        const poet = poetIdx >= 0 ? poets[poetIdx] : null;
        const track: Track = {
          slug,
          title,
          author: author || poet?.name || 'Anonymous',
          poet,
          year,
          seconds,
          lines,
          category: category === 0 ? 'classic' : 'contemporary',
          rank: i + 1,
        };
        if (poet) {
          poet.poems.push(track);
          poet.topRank = Math.min(poet.topRank, track.rank);
        }
        return track;
      });
      this.state.set({ tracks, poets });
    } catch (e) {
      console.error(e);
      this.error.set('The library could not be loaded. Run "npm run data" and reload.');
    }
  }

  track(slug: string): Track | undefined {
    return this.bySlug().get(slug);
  }

  poet(slug: string): Poet | undefined {
    return this.poetBySlug().get(slug);
  }

  movement(slug: string): Movement | undefined {
    return this.movements().find((m) => m.slug === slug);
  }

  era(slug: string): Era | undefined {
    return ERAS.find((e) => e.slug === slug);
  }

  eraTracks(era: Era): Track[] {
    return this.tracks().filter((t) => t.year != null && t.year >= era.from && t.year <= era.to);
  }

  movementTracks(m: Movement): Track[] {
    return m.poets.flatMap((p) => p.poems).sort((a, b) => a.rank - b.rank);
  }

  poem(slug: string): Promise<PoemDetail> {
    let p = this.detailCache.get(slug);
    if (!p) {
      p = fetch(`data/poems/${encodeURIComponent(slug)}.json`).then((r) => {
        if (!r.ok) throw new Error(`Poem "${slug}" not found`);
        return r.json() as Promise<PoemDetail>;
      });
      p.catch(() => this.detailCache.delete(slug));
      this.detailCache.set(slug, p);
    }
    return p;
  }

  /** The poet's biography, or null when none is available. */
  bio(poet: Poet): Promise<PoetBio | null> {
    if (!poet.hasBio) return Promise.resolve(null);
    let p = this.bioCache.get(poet.slug);
    if (!p) {
      p = fetch(`data/poets/${encodeURIComponent(poet.slug)}.json`)
        .then((r) => (r.ok ? (r.json() as Promise<PoetBio>) : null))
        .catch(() => null);
      this.bioCache.set(poet.slug, p);
    }
    return p;
  }

  /** Deterministic pick from the best-known poems (top of the charts), changing at local midnight. */
  poemOfTheDay(date = new Date()): Track | undefined {
    const pool = this.tracks().slice(0, 150).filter((t) => t.lines >= 6 && t.lines <= 60);
    if (!pool.length) return undefined;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return pool[hash(key) % pool.length];
  }

  random(pool: Track[] = this.tracks().slice(0, 4000)): Track | undefined {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** "Radio" for a poem opened directly: more from the poet, then neighbours on the charts. */
  radio(track: Track, size = 40): Track[] {
    const out: Track[] = [];
    const seen = new Set([track.slug]);
    const add = (t: Track) => {
      if (!seen.has(t.slug)) {
        seen.add(t.slug);
        out.push(t);
      }
    };
    track.poet?.poems.slice(0, 8).forEach(add);
    const pool = track.category === 'classic' ? this.classics() : this.contemporary();
    const start = Math.max(0, pool.findIndex((t) => t.rank >= track.rank) - 4);
    for (let i = 0; out.length < size && i < 400; i++) {
      // Interleave a stride through the charts so the queue doesn't feel alphabetical or samey.
      const t = pool[(start + i * 7 + (hash(track.slug) % 7)) % Math.max(1, pool.length)];
      if (t) add(t);
    }
    return out.slice(0, size);
  }

  search(query: string, limit = 30): SearchResults {
    const q = fold(query);
    if (!q) return { poems: [], poets: [], movements: [] };
    this.searchIndex ??= [
      ...this.tracks().map((track) => ({ track, text: fold(track.title) })),
      ...this.poets().map((poet) => ({ poet, text: fold(poet.name) })),
    ];
    const terms = q.split(' ');
    const score = (text: string): number => {
      const bare = text.replace(/^(the|a|an) /, '');
      if (text === q || bare === q) return 100;
      if (text.startsWith(q) || bare.startsWith(q)) return 80;
      if (text.includes(' ' + q)) return 60;
      // Every term must start a word ("night" finds "Night Song", not "Lynne Knight").
      const words = text.split(' ');
      if (terms.every((t) => words.some((w) => w.startsWith(t)))) return 25;
      return 0;
    };

    const poems: [number, Track][] = [];
    const poets: [number, Poet][] = [];
    for (const e of this.searchIndex) {
      const s = score(e.text);
      if (!s) continue;
      if (e.track) poems.push([s - Math.log10(e.track.rank || 1) * 4, e.track]);
      else if (e.poet) poets.push([s - Math.log10(e.poet.topRank) * 4 + Math.min(e.poet.poems.length, 20) * 0.3, e.poet]);
    }
    // A poet match also surfaces their best poems.
    poets.sort((a, b) => b[0] - a[0]);
    for (const [s, poet] of poets.slice(0, 3)) {
      for (const t of poet.poems.slice(0, 5)) poems.push([s - 20 - Math.log10(t.rank) * 2, t]);
    }
    poems.sort((a, b) => b[0] - a[0]);
    const seen = new Set<string>();
    return {
      poems: poems.map(([, t]) => t).filter((t) => !seen.has(t.slug) && seen.add(t.slug)).slice(0, limit),
      poets: poets.map(([, p]) => p).slice(0, 12),
      movements: this.movements().filter((m) => fold(m.name).includes(q)).slice(0, 6),
    };
  }
}
