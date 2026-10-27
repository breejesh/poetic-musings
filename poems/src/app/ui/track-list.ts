import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Track } from '../core/models';
import { PlayerService } from '../core/player.service';
import { LibraryService } from '../core/library.service';
import { UiService } from '../core/ui.service';
import { duration } from '../core/format';
import { Icon } from './icon';
import { Cover } from './cover';
import { EqBars } from './eq-bars';
import { InView } from './in-view';

/** A tracklist of poems — click a row to play it (the list becomes the queue). */
@Component({
  selector: 'app-track-list',
  imports: [RouterLink, Icon, Cover, EqBars, InView],
  templateUrl: './track-list.html',
  styleUrl: './track-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackList {
  protected player = inject(PlayerService);
  protected library = inject(LibraryService);
  private ui = inject(UiService);

  readonly tracks = input.required<Track[]>();
  /** What the number column shows: chart rank, position in this list, or nothing. */
  readonly numbering = input<'rank' | 'index' | 'none'>('index');
  readonly showPoet = input(true);
  readonly showYear = input(true);
  readonly pageSize = input(50);
  /** Hard cap — no "load more" past it. */
  readonly max = input<number | null>(null);

  protected limit = signal(50);
  protected visible = computed(() => this.tracks().slice(0, Math.min(this.limit(), this.max() ?? Infinity)));
  protected hasMore = computed(() => this.visible().length < Math.min(this.tracks().length, this.max() ?? Infinity));
  protected duration = duration;

  constructor() {
    // Reset paging whenever the list itself changes (new sort, new page).
    effect(() => {
      this.tracks();
      this.limit.set(untracked(this.pageSize));
    });
  }

  protected more() {
    if (this.hasMore()) this.limit.update((l) => l + this.pageSize());
  }

  protected isCurrent(t: Track) {
    return this.player.track()?.slug === t.slug;
  }

  protected play(t: Track, e?: Event) {
    if ((e?.target as HTMLElement | undefined)?.closest('a, button')) return;
    if (this.isCurrent(t) && this.player.playing()) {
      this.player.pause();
      return;
    }
    this.player.play(t, this.tracks());
  }

  protected like(t: Track) {
    const liked = this.library.toggleLike(t.slug);
    this.ui.toast(liked ? `Added “${t.title}” to Liked Poems` : 'Removed from Liked Poems', 'heart');
  }
}
