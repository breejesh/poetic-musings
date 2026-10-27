export type Category = 'classic' | 'contemporary';

export interface Poet {
  slug: string;
  name: string;
  born: number | null;
  died: number | null;
  movements: string[];
  state: string;
  hasPortrait: boolean;
  /** A verified biography is available (see CatalogService.bio). */
  hasBio: boolean;
  /** Best (lowest) chart position among this poet's poems. */
  topRank: number;
  poems: Track[];
}

/** A poem as it appears in lists — "track" metadata without the text. */
export interface Track {
  slug: string;
  title: string;
  /** Display name; may differ from poet.name for co-authored poems. */
  author: string;
  poet: Poet | null;
  year: number | null;
  /** Estimated read-aloud length in seconds. */
  seconds: number;
  lines: number;
  category: Category;
  /** 1-based popularity position on poets.org. */
  rank: number;
}

/** A single rendered line: indent level and sanitised inline HTML. Empty html = stanza break. */
export type PoemLine = [indent: number, html: string];

export interface PoemDetail {
  slug: string;
  title: string;
  author: string;
  poet: string | null;
  year: number | null;
  lines: PoemLine[];
}

/** Short biography (Wikipedia intro, CC BY-SA 4.0). */
export interface PoetBio {
  bio: string[];
  /** One-line summary, e.g. "American poet, essayist and journalist (1819–1892)". */
  description: string;
  /** Wikipedia article URL — shown as attribution. */
  source: string;
}

export interface Movement {
  slug: string;
  name: string;
  poets: Poet[];
}

export interface Era {
  slug: string;
  label: string;
  title: string;
  blurb: string;
  from: number;
  to: number;
}

export const ERAS: Era[] = [
  { slug: 'renaissance', label: '1500s', title: 'Renaissance & Before', blurb: 'Sonnets, songs and the birth of English verse.', from: 0, to: 1659 },
  { slug: 'restoration', label: '1700s', title: 'Wit & Enlightenment', blurb: 'Couplets, satire and the age of reason.', from: 1660, to: 1789 },
  { slug: 'romantic', label: '1800s', title: 'The Romantic Century', blurb: 'Nature, the sublime, and the fearless heart.', from: 1790, to: 1899 },
  { slug: 'modern', label: '1900s', title: 'Modern Voices', blurb: 'Fractured forms for a fractured world.', from: 1900, to: 1949 },
  { slug: 'postwar', label: '1950s', title: 'Post-war & Beyond', blurb: 'Beats, confessions, and the open field.', from: 1950, to: 1999 },
  { slug: 'now', label: '2000s', title: 'New Millennium', blurb: 'The poems being written right now.', from: 2000, to: 9999 },
];
