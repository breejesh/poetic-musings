import { DOCUMENT, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogService } from './catalog.service';
import { LibraryService } from './library.service';
import { PoemDetail, Track } from './models';
import { shuffle as shuffled, stripHtml } from './format';
import { storedSignal } from './storage';

export type PlayState = 'idle' | 'playing' | 'paused' | 'ended';
export type RepeatMode = 'off' | 'one';

/** Per-line timing for a poem — the "audio" the player scrubs through. */
export interface Timeline {
  /** Plain text of each spoken line. */
  text: string[];
  /** Index into PoemDetail.lines for each spoken line. */
  source: number[];
  /** Start time of each line in ms (at 1× speed). */
  starts: number[];
  /** End time of each line in ms (before any stanza pause). */
  ends: number[];
  /** Relative visual weight of each line, 0–1, for the waveform. */
  weight: number[];
  total: number;
}

// Reading pace at 1×: a brisk read-aloud (~160 wpm) with a short breath between stanzas.
// Keep in step with WPM / STANZA_SECONDS in tools/build-data.mjs, which estimates track lengths.
const WPM = 162;
const STANZA_PAUSE = 960;

export function buildTimeline(detail: PoemDetail): Timeline {
  const t: Timeline = { text: [], source: [], starts: [], ends: [], weight: [], total: 0 };
  let at = 0;
  let longest = 1;
  detail.lines.forEach(([, html], i) => {
    if (!html) {
      at += STANZA_PAUSE;
      return;
    }
    const text = stripHtml(html);
    const words = text.split(/\s+/).filter(Boolean).length;
    t.text.push(text);
    t.source.push(i);
    t.starts.push(at);
    t.weight.push(text.length);
    longest = Math.max(longest, text.length);
    at += Math.max(720, 200 + (words * 60000) / WPM);
    t.ends.push(at);
  });
  t.total = at;
  t.weight = t.weight.map((w) => 0.18 + 0.82 * Math.min(1, w / longest));
  return t;
}

/** Index of the line playing at `ms` (binary search over starts). */
export function lineAt(starts: number[], ms: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= ms) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * The poem "player". A poem plays like a track: lines light up at a read-aloud pace
 * and the queue, shuffle and repeat work. A finished poem stops unless autoplay is turned on.
 */
@Injectable({ providedIn: 'root' })
export class PlayerService {
  private catalog = inject(CatalogService);
  private library = inject(LibraryService);
  private router = inject(Router);
  private win = inject(DOCUMENT).defaultView!;

  readonly track = signal<Track | null>(null);
  readonly detail = signal<PoemDetail | null>(null);
  readonly loading = signal(false);
  readonly queue = signal<Track[]>([]);
  readonly index = signal(0);
  readonly state = signal<PlayState>('idle');
  /** Playback position in ms at 1× speed. */
  readonly position = signal(0);

  readonly speed = storedSignal<number>('speed', 1);
  readonly shuffle = storedSignal<boolean>('shuffle', false);
  readonly repeat = storedSignal<RepeatMode>('repeat', 'off');
  /** Start the next poem when one finishes. Off by default — the reader chooses when to move on. */
  readonly autoplay = storedSignal<boolean>('autoplay', false);

  readonly playing = computed(() => this.state() === 'playing');
  /** True once the listener has started this poem — lines become seekable. */
  readonly engaged = computed(() => this.state() !== 'idle');

  readonly timeline = computed(() => {
    const d = this.detail();
    return d ? buildTimeline(d) : null;
  });
  readonly total = computed(() => this.timeline()?.total ?? (this.track()?.seconds ?? 0) * 1000);
  readonly progress = computed(() => (this.total() ? Math.min(1, this.position() / this.total()) : 0));
  /** Index into the timeline of the line being "played". */
  readonly lineIndex = computed(() => {
    const t = this.timeline();
    return t ? lineAt(t.starts, this.position()) : -1;
  });
  /** Index into PoemDetail.lines of the active line, or -1 when nothing is playing. */
  readonly activeLine = computed(() => {
    const t = this.timeline();
    const i = this.lineIndex();
    return t && this.engaged() && i >= 0 ? t.source[i] : -1;
  });
  /** 0–1 through the active line — drives the karaoke wipe. */
  readonly lineProgress = computed(() => {
    const t = this.timeline();
    const i = this.lineIndex();
    if (!t || i < 0 || !this.engaged()) return 0;
    return Math.max(0, Math.min(1, (this.position() - t.starts[i]) / (t.ends[i] - t.starts[i])));
  });
  readonly upNext = computed(() => this.queue().slice(this.index() + 1));

  private frame = 0;
  private lastTick = 0;
  private loadToken = 0;

  constructor() {
    // "Repeat all" no longer exists (poems don't auto-advance); treat an old saved value as off.
    if ((this.repeat() as string) === 'all') this.repeat.set('off');
    this.setupMediaSession();
    // Restore the last poem into the bar (paused) once the catalog is available.
    effect(() => {
      if (!this.catalog.ready() || untracked(this.track)) return;
      const last = untracked(this.library.history)[0];
      const t = last && this.catalog.track(last.slug);
      if (t) untracked(() => this.load(t, { autoplay: false, record: false }));
    });
  }

  // ------------------------------------------------------------------ loading

  /** Called by the poem page — makes the opened poem the current track without playing it. */
  open(track: Track) {
    if (this.track()?.slug === track.slug) return;
    this.load(track, { autoplay: false });
  }

  /** Start playing `track`, optionally from a list that becomes the queue, and show it. */
  play(track: Track, queue?: Track[]) {
    if (this.track()?.slug === track.slug && !queue) {
      this.resume();
    } else {
      this.load(track, { autoplay: true, queue });
    }
    this.router.navigate(['/poem', track.slug]);
  }

  playAll(tracks: Track[], opts: { shuffle?: boolean } = {}) {
    if (!tracks.length) return;
    if (opts.shuffle !== undefined) this.shuffle.set(opts.shuffle);
    const list = opts.shuffle ? shuffled(tracks) : tracks;
    this.play(list[0], list);
  }

  async load(track: Track, opts: { autoplay: boolean; queue?: Track[]; record?: boolean }) {
    const token = ++this.loadToken;
    let queue = opts.queue ?? this.queue();
    let idx = queue.findIndex((t) => t.slug === track.slug);
    if (idx < 0) {
      queue = [track, ...this.catalog.radio(track)];
      idx = 0;
    }
    this.queue.set(queue);
    this.index.set(idx);
    this.track.set(track);
    this.position.set(0);
    this.state.set(opts.autoplay ? 'paused' : 'idle');
    this.loading.set(true);
    if (opts.record !== false) this.library.visit(track.slug);
    try {
      const detail = await this.catalog.poem(track.slug);
      if (token !== this.loadToken) return;
      this.detail.set(detail);
    } catch (e) {
      if (token !== this.loadToken) return;
      console.error(e);
      this.detail.set(null);
    } finally {
      if (token === this.loadToken) this.loading.set(false);
    }
    if (opts.autoplay && token === this.loadToken) this.resume();
  }

  // ------------------------------------------------------------------ transport

  toggle() {
    if (this.playing()) this.pause();
    else this.resume();
  }

  resume() {
    if (!this.track()) {
      const t = this.catalog.poemOfTheDay();
      if (t) this.play(t);
      return;
    }
    if (!this.timeline()) return;
    if (this.state() === 'ended' || this.position() >= this.total()) this.position.set(0);
    this.state.set('playing');
    this.startLoop();
  }

  pause() {
    if (this.state() !== 'playing') return;
    this.state.set('paused');
    this.stopLoop();
  }

  seek(ms: number) {
    const total = this.total();
    this.position.set(Math.max(0, Math.min(total - 1, ms)));
    if (this.state() === 'ended') this.state.set('paused');
    if (this.state() === 'idle') this.state.set('paused');
  }

  seekLine(i: number) {
    const t = this.timeline();
    if (!t) return;
    const clamped = Math.max(0, Math.min(t.starts.length - 1, i));
    this.seek(t.starts[clamped]);
  }

  /** Seek to the timeline line that renders PoemDetail.lines[source]. */
  seekSource(source: number, andPlay = true) {
    const t = this.timeline();
    if (!t) return;
    const i = t.source.indexOf(source);
    if (i < 0) return;
    this.seekLine(i);
    if (andPlay && !this.playing()) this.resume();
  }

  /** Skip to the next poem in the queue; it starts playing if `play` (default: if something is playing now). */
  next(play = this.playing()) {
    const queue = this.queue();
    if (!queue.length) return;
    let i: number;
    if (this.shuffle() && queue.length > 1) {
      do i = Math.floor(Math.random() * queue.length);
      while (i === this.index());
    } else {
      i = this.index() + 1;
    }
    if (i >= queue.length) {
      // Skipping past the end of the queue: top it up with a fresh "radio" selection.
      const current = this.track();
      const more = current ? this.catalog.radio(current).filter((t) => !queue.some((q) => q.slug === t.slug)) : [];
      if (!more.length) return;
      this.queue.set([...queue, ...more]);
    }
    this.goTo(i, play);
  }

  prev() {
    if (this.position() > 3000 || this.index() === 0) {
      this.seek(0);
      return;
    }
    this.goTo(this.index() - 1, this.playing());
  }

  /** Jump to an item in the queue. */
  goTo(i: number, autoplay = true) {
    const track = this.queue()[i];
    if (!track) return;
    const wasShowing = this.isShowing(this.track()?.slug);
    this.load(track, { autoplay, queue: this.queue() });
    if (wasShowing) this.router.navigate(['/poem', track.slug]);
  }

  surprise() {
    const t = this.catalog.random();
    if (t) this.play(t, [t, ...this.catalog.radio(t)]);
  }

  toggleAutoplay() {
    this.autoplay.update((a) => !a);
  }

  toggleShuffle() {
    this.shuffle.update((s) => !s);
  }

  cycleRepeat() {
    this.repeat.update((r) => (r === 'one' ? 'off' : 'one'));
  }

  cycleSpeed() {
    const steps = [0.75, 1, 1.25, 1.5, 2];
    this.speed.update((s) => steps[(steps.indexOf(s) + 1) % steps.length] ?? 1);
  }

  private isShowing(slug: string | undefined): boolean {
    return !!slug && decodeURIComponent(this.router.url.split('?')[0]) === `/poem/${slug}`;
  }

  // ------------------------------------------------------------------ clock

  private startLoop() {
    this.stopLoop();
    this.lastTick = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(250, now - this.lastTick);
      this.lastTick = now;
      if (this.state() !== 'playing') return;
      const t = this.timeline();
      if (!t) return;
      const pos = this.position() + dt * this.speed();
      if (pos >= t.total) {
        this.position.set(t.total);
        this.ended();
        return;
      }
      this.position.set(pos);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  private stopLoop() {
    cancelAnimationFrame(this.frame);
  }

  private ended() {
    this.stopLoop();
    const track = this.track();
    if (track) this.library.countPlay(track.slug);
    if (this.repeat() === 'one') {
      this.position.set(0);
      this.resume();
      return;
    }
    this.state.set('ended');
    // Only move on by itself when the reader has asked for autoplay.
    if (this.autoplay()) this.next(true);
  }

  // ------------------------------------------------------------------ OS integration

  private setupMediaSession() {
    const ms = this.win.navigator.mediaSession;
    if (!ms) return;
    const handlers: [MediaSessionAction, () => void][] = [
      ['play', () => this.resume()],
      ['pause', () => this.pause()],
      ['nexttrack', () => this.next()],
      ['previoustrack', () => this.prev()],
    ];
    for (const [action, fn] of handlers) {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        /* unsupported action */
      }
    }
    effect(() => {
      const t = this.track();
      if (!t || typeof MediaMetadata === 'undefined') return;
      ms.metadata = new MediaMetadata({
        title: t.title,
        artist: t.author,
        album: 'Poetic Musings',
        artwork: t.poet?.hasPortrait ? [{ src: `portraits/320/${t.poet.slug}.webp`, sizes: '320x320', type: 'image/webp' }] : [],
      });
    });
    effect(() => (ms.playbackState = this.playing() ? 'playing' : 'paused'));
  }
}
