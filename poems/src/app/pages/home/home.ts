import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { LibraryService } from '../../core/library.service';
import { UiService } from '../../core/ui.service';
import { ERAS, PoemLine, Track } from '../../core/models';
import { duration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { Cover } from '../../ui/cover';
import { PoemCard } from '../../ui/poem-card';
import { PoetCard } from '../../ui/poet-card';
import { TrackList } from '../../ui/track-list';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, Portrait, Cover, PoemCard, PoetCard, TrackList],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected catalog = inject(CatalogService);
  protected player = inject(PlayerService);
  protected library = inject(LibraryService);
  private ui = inject(UiService);

  protected eras = ERAS;
  protected today = new Date();
  protected greeting = (() => {
    const h = this.today.getHours();
    return h < 5 ? 'Still up?' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 22 ? 'Good evening' : 'Good night';
  })();

  protected potd = computed(() => this.catalog.poemOfTheDay(this.today));
  protected potdLines = signal<PoemLine[]>([]);
  protected potdDuration = computed(() => duration(this.potd()?.seconds ?? 0));

  protected top = computed(() => this.catalog.tracks().slice(0, 100));
  protected poets = computed(() => this.catalog.popularPoets().slice(0, 18));
  protected recent = computed(() =>
    this.library
      .history()
      .slice(0, 12)
      .map((h) => this.catalog.track(h.slug))
      .filter((t): t is Track => !!t),
  );
  protected quick = computed(() => this.catalog.tracks().filter((t) => t.seconds <= 55 && t.lines >= 4).slice(0, 16));
  protected epics = computed(() => this.catalog.tracks().filter((t) => t.seconds >= 300).slice(0, 16));
  protected movements = computed(() => this.catalog.movements().filter((m) => m.name !== 'Contemporary').slice(0, 8));
  protected eraCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const e of ERAS) counts.set(e.slug, this.catalog.eraTracks(e).length);
    return counts;
  });

  constructor() {
    effect(() => {
      const t = this.potd();
      if (!t) return;
      this.catalog.poem(t.slug).then(
        (d) => {
          // An excerpt: the first stanza, up to six lines.
          const out: PoemLine[] = [];
          for (const l of d.lines) {
            if (!l[1]) break;
            out.push(l);
            if (out.length === 6) break;
          }
          this.potdLines.set(out);
        },
        () => this.potdLines.set([]),
      );
    });
  }

  protected playPotd() {
    const t = this.potd();
    if (!t) return;
    if (this.player.track()?.slug === t.slug && this.player.playing()) this.player.pause();
    else this.player.play(t);
  }

  protected likePotd() {
    const t = this.potd();
    if (!t) return;
    const liked = this.library.toggleLike(t.slug);
    this.ui.toast(liked ? 'Added to Liked Poems' : 'Removed from Liked Poems', 'heart');
  }

  protected playMovement(slug: string) {
    const m = this.catalog.movement(slug);
    if (m) this.player.playAll(this.catalog.movementTracks(m).slice(0, 50), { shuffle: true });
  }
}
