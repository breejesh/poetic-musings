import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { LibraryService } from '../../core/library.service';
import { PlayerService } from '../../core/player.service';
import { Track } from '../../core/models';
import { longDuration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { TrackList } from '../../ui/track-list';

@Component({
  selector: 'app-library',
  imports: [RouterLink, Icon, TrackList],
  templateUrl: './library.html',
  styleUrl: './library.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPage {
  private catalog = inject(CatalogService);
  protected library = inject(LibraryService);
  protected player = inject(PlayerService);

  /** From route data. */
  readonly tab = input<'liked' | 'history'>('liked');

  private resolve = (slugs: string[]) => slugs.map((s) => this.catalog.track(s)).filter((t): t is Track => !!t);
  protected liked = computed(() => this.resolve(this.library.likes()));
  protected history = computed(() => this.resolve(this.library.history().map((h) => h.slug)));
  protected tracks = computed(() => (this.tab() === 'liked' ? this.liked() : this.history()));
  protected time = computed(() => longDuration(this.tracks().reduce((s, t) => s + t.seconds, 0)));

  protected play(shuffle = false) {
    this.player.playAll(this.tracks(), { shuffle });
  }
}
