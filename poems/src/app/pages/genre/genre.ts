import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { Poet, Track } from '../../core/models';
import { longDuration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { PoetCard } from '../../ui/poet-card';
import { TrackList } from '../../ui/track-list';

export type SortKey = 'popular' | 'newest' | 'oldest' | 'az' | 'shortest';

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'az', label: 'A–Z' },
  { key: 'shortest', label: 'Shortest' },
];

export function sortTracks(tracks: Track[], key: SortKey): Track[] {
  const year = (t: Track) => t.year ?? 0;
  switch (key) {
    case 'popular':
      return tracks;
    case 'newest':
      return [...tracks].sort((a, b) => year(b) - year(a) || a.rank - b.rank);
    case 'oldest':
      return [...tracks].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.rank - b.rank);
    case 'az':
      return [...tracks].sort((a, b) => a.title.localeCompare(b.title));
    case 'shortest':
      return [...tracks].sort((a, b) => a.seconds - b.seconds || a.rank - b.rank);
  }
}

const COPY = {
  classic: {
    title: 'Classics',
    icon: 'feather',
    blurb:
      'Before the wars rewired the world, poets wrote by candle and gaslight — sonnets and odes, ballads and elegies. From Shakespeare’s sonnets to Dickinson’s dashes and Whitman’s long breath, these are the poems that taught English how to sing.',
  },
  contemporary: {
    title: 'Contemporary',
    icon: 'pen',
    blurb:
      'Since 1950 poetry has broken wide open — confessional and conversational, political and playful, written in every accent of the language. The Beats and the New York School, Black Arts and slam, and the poets publishing right now.',
  },
};

@Component({
  selector: 'app-genre',
  imports: [Icon, PoetCard, TrackList],
  templateUrl: './genre.html',
  styleUrl: './genre.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenrePage {
  private catalog = inject(CatalogService);
  protected player = inject(PlayerService);

  /** From route data. */
  readonly category = input<'classic' | 'contemporary'>('classic');

  protected sorts = SORTS;
  protected sort = signal<SortKey>('popular');
  protected copy = computed(() => COPY[this.category()]);

  protected all = computed(() => (this.category() === 'classic' ? this.catalog.classics() : this.catalog.contemporary()));
  protected sorted = computed(() => sortTracks(this.all(), this.sort()));

  protected stats = computed(() => {
    const tracks = this.all();
    const poets = new Set<string>();
    let min = Infinity;
    let max = -Infinity;
    let secs = 0;
    for (const t of tracks) {
      if (t.poet) poets.add(t.poet.slug);
      if (t.year) {
        min = Math.min(min, t.year);
        max = Math.max(max, t.year);
      }
      secs += t.seconds;
    }
    return {
      poems: tracks.length.toLocaleString(),
      poets: poets.size.toLocaleString(),
      span: Number.isFinite(min) ? `${min}–${max}` : '',
      time: longDuration(secs),
    };
  });

  protected poets = computed(() => {
    const seen = new Set<string>();
    const out: Poet[] = [];
    for (const t of this.all()) {
      if (t.poet && !seen.has(t.poet.slug)) {
        seen.add(t.poet.slug);
        out.push(t.poet);
        if (out.length === 16) break;
      }
    }
    return out;
  });

  protected isPlayingHere = computed(() => {
    const t = this.player.track();
    return !!t && this.player.playing() && t.category === this.category();
  });

  protected play(shuffle = false) {
    if (this.isPlayingHere() && !shuffle) {
      this.player.pause();
      return;
    }
    this.player.playAll(this.sorted().slice(0, 200), { shuffle });
  }
}
