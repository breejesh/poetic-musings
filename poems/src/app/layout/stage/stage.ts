import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, viewChild, afterNextRender } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/player.service';
import { LibraryService } from '../../core/library.service';
import { UiService } from '../../core/ui.service';
import { duration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { Waveform } from '../../ui/waveform';
import { PoemText } from '../../ui/poem-text';

/** Full-screen "Now Playing": the poem as giant synced lyrics over the poet's portrait. */
@Component({
  selector: 'app-stage',
  imports: [RouterLink, Icon, Portrait, Waveform, PoemText],
  templateUrl: './stage.html',
  styleUrl: './stage.scss',
  host: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Now playing' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stage {
  protected player = inject(PlayerService);
  protected library = inject(LibraryService);
  protected ui = inject(UiService);
  private closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');

  protected elapsed = computed(() => duration(this.player.position() / 1000 / this.player.speed()));
  protected total = computed(() => duration(this.player.total() / 1000 / this.player.speed()));
  protected liked = computed(() => !!this.player.track() && this.library.isLiked(this.player.track()!.slug));
  protected bg = computed(() => {
    const p = this.player.track()?.poet;
    return p?.hasPortrait ? `url(portraits/320/${p.slug}.webp)` : 'none';
  });

  constructor() {
    afterNextRender(() => this.closeBtn()?.nativeElement.focus());
  }

  protected like() {
    const t = this.player.track();
    if (t) this.library.toggleLike(t.slug);
  }

  protected close() {
    this.ui.stageOpen.set(false);
  }
}
