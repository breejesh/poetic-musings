import { Injectable, computed } from '@angular/core';
import { storedSignal } from './storage';

interface HistoryEntry {
  slug: string;
  at: number;
}

/**
 * The listener's own library: liked poems, listening history and play counts.
 * Device-local for now; the shape maps 1:1 onto a per-user Firestore document later.
 */
@Injectable({ providedIn: 'root' })
export class LibraryService {
  /** Most recently liked first. */
  readonly likes = storedSignal<string[]>('likes', []);
  readonly history = storedSignal<HistoryEntry[]>('history', []);
  readonly plays = storedSignal<Record<string, number>>('plays', {});

  private readonly likeSet = computed(() => new Set(this.likes()));

  isLiked(slug: string): boolean {
    return this.likeSet().has(slug);
  }

  toggleLike(slug: string): boolean {
    const liked = this.isLiked(slug);
    this.likes.update((l) => (liked ? l.filter((s) => s !== slug) : [slug, ...l]));
    return !liked;
  }

  /** Records that a poem was opened (history) — deduped to the latest visit. */
  visit(slug: string) {
    this.history.update((h) => [{ slug, at: Date.now() }, ...h.filter((e) => e.slug !== slug)].slice(0, 200));
  }

  /** Records a completed "listen". */
  countPlay(slug: string) {
    this.plays.update((p) => ({ ...p, [slug]: (p[slug] ?? 0) + 1 }));
  }

  playCount(slug: string): number {
    return this.plays()[slug] ?? 0;
  }

  clearHistory() {
    this.history.set([]);
  }
}
