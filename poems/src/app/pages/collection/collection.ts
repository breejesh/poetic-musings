import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { PageTitle } from '../../core/title';
import { Poet, Track } from '../../core/models';
import { longDuration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { PoetCard } from '../../ui/poet-card';
import { TrackList } from '../../ui/track-list';
import { SORTS, SortKey, sortTracks } from '../genre/genre';

interface View {
  eyebrow: string;
  title: string;
  label: string;
  blurb: string;
  tracks: Track[];
  poets: Poet[];
  numbering: 'rank' | 'index';
}

/** A playlist-style page for the charts, an era, or a movement. */
@Component({
  selector: 'app-collection',
  imports: [RouterLink, Icon, Portrait, PoetCard, TrackList],
  templateUrl: './collection.html',
  styleUrl: './collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPage {
  private catalog = inject(CatalogService);
  protected player = inject(PlayerService);
  private title = inject(PageTitle);

  readonly kind = input<'charts' | 'era' | 'movement'>('charts');
  readonly slug = input<string>('');

  protected sorts = SORTS;
  protected sort = signal<SortKey>('popular');

  protected view = computed<View | null>(() => {
    if (!this.catalog.ready()) return null;
    switch (this.kind()) {
      case 'charts': {
        const tracks = this.catalog.tracks().slice(0, 100);
        return {
          eyebrow: 'Chart',
          title: 'Top 100',
          label: '100',
          blurb: 'The hundred most-read poems in the collection — the standards every reader comes back to.',
          tracks,
          poets: uniquePoets(tracks, 14),
          numbering: 'rank',
        };
      }
      case 'era': {
        const era = this.catalog.era(this.slug());
        if (!era) return null;
        const tracks = this.catalog.eraTracks(era);
        return {
          eyebrow: era.to > 3000 ? `${era.from} – today` : `${era.from || 'Up'} – ${era.to}`,
          title: era.title,
          label: era.label,
          blurb: era.blurb,
          tracks,
          poets: uniquePoets(tracks, 14),
          numbering: 'index',
        };
      }
      case 'movement': {
        const m = this.catalog.movement(this.slug());
        if (!m) return null;
        return {
          eyebrow: 'Movement',
          title: m.name,
          label: m.name
            .split(/[\s/]+/)
            .map((w) => w[0])
            .join('')
            .slice(0, 3),
          blurb: `${m.poets.length} poets associated with ${m.name}, and every poem of theirs in the collection.`,
          tracks: this.catalog.movementTracks(m),
          poets: m.poets.slice(0, 18),
          numbering: 'index',
        };
      }
    }
  });

  protected notFound = computed(() => this.catalog.ready() && !this.view());
  protected sorted = computed(() => sortTracks(this.view()?.tracks ?? [], this.sort()));
  protected time = computed(() => longDuration((this.view()?.tracks ?? []).reduce((s, t) => s + t.seconds, 0)));

  constructor() {
    effect(() => {
      const v = this.view();
      if (v && this.kind() !== 'charts') this.title.set(v.title);
    });
  }

  protected play(shuffle = false) {
    this.player.playAll(this.sorted().slice(0, 200), { shuffle });
  }
}

function uniquePoets(tracks: Track[], n: number): Poet[] {
  const seen = new Map<string, Poet>();
  for (const t of tracks) {
    if (t.poet && !seen.has(t.poet.slug)) seen.set(t.poet.slug, t.poet);
    if (seen.size >= n) break;
  }
  return [...seen.values()];
}
