import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { PageTitle } from '../../core/title';
import { Poet, PoetBio } from '../../core/models';
import { lifespan, longDuration, slugify } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { PoetCard } from '../../ui/poet-card';
import { TrackList } from '../../ui/track-list';
import { SORTS, SortKey, sortTracks } from '../genre/genre';

@Component({
  selector: 'app-poet',
  imports: [RouterLink, Icon, Portrait, PoetCard, TrackList],
  templateUrl: './poet.html',
  styleUrl: './poet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoetPage {
  private catalog = inject(CatalogService);
  protected player = inject(PlayerService);
  private title = inject(PageTitle);

  readonly slug = input.required<string>();

  protected sorts = SORTS;
  protected sort = signal<SortKey>('popular');
  protected poet = computed(() => this.catalog.poet(this.slug()));
  protected notFound = computed(() => this.catalog.ready() && !this.poet());
  protected bio = signal<PoetBio | null>(null);
  protected bioLoading = signal(false);
  /** A plain-language intro for poets without a biography. */
  protected fallbackBio = computed(() => {
    const p = this.poet();
    if (!p) return '';
    const parts = [this.life() && `(${this.life()})`, p.movements.length && `associated with ${p.movements.join(' and ')}`, p.state && `from ${p.state}`].filter(Boolean);
    const count = p.poems.length === 1 ? 'one poem' : `${p.poems.length} poems`;
    return `${p.name}${parts.length ? ' ' + parts.join(', ') : ''} has ${count} in this collection${p.topRank <= 500 ? ', including some of its most-read' : ''}.`;
  });
  protected life = computed(() => {
    const p = this.poet();
    return p ? lifespan(p.born, p.died) : '';
  });
  protected sorted = computed(() => sortTracks(this.poet()?.poems ?? [], this.sort()));
  protected totalTime = computed(() => longDuration((this.poet()?.poems ?? []).reduce((s, t) => s + t.seconds, 0)));
  protected movementLinks = computed(() => (this.poet()?.movements ?? []).map((name) => ({ name, slug: slugify(name) })));
  protected isPlayingHere = computed(() => this.player.playing() && this.player.track()?.poet?.slug === this.slug());

  /** "Fans also like": poets from the same movements, else chart neighbours. */
  protected related = computed<Poet[]>(() => {
    const p = this.poet();
    if (!p) return [];
    const out = new Map<string, Poet>();
    for (const m of p.movements) {
      for (const other of this.catalog.movement(slugify(m))?.poets ?? []) {
        if (other.slug !== p.slug) out.set(other.slug, other);
        if (out.size >= 14) break;
      }
    }
    if (out.size < 8) {
      const popular = this.catalog.popularPoets();
      const i = popular.indexOf(p);
      for (const other of popular.slice(Math.max(0, i - 6), i + 10)) {
        if (other.slug !== p.slug) out.set(other.slug, other);
      }
    }
    return [...out.values()].slice(0, 14);
  });

  constructor() {
    effect(() => {
      const p = this.poet();
      this.title.set(p ? p.name : this.notFound() ? 'Poet not found' : null);
    });
    effect(() => {
      const p = this.poet();
      this.bio.set(null);
      this.bioLoading.set(false);
      if (!p?.hasBio) return;
      this.bioLoading.set(true);
      this.catalog.bio(p).then((b) => {
        if (this.poet() !== p) return;
        this.bio.set(b);
        this.bioLoading.set(false);
      });
    });
  }

  protected play(shuffle = false) {
    if (this.isPlayingHere() && !shuffle) {
      this.player.pause();
      return;
    }
    this.player.playAll(this.sorted(), { shuffle });
  }
}
