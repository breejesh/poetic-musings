import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/player.service';
import { LibraryService } from '../../core/library.service';
import { UiService } from '../../core/ui.service';
import { duration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { Waveform } from '../../ui/waveform';

@Component({
  selector: 'app-player-bar',
  imports: [RouterLink, Icon, Portrait, Waveform],
  templateUrl: './player-bar.html',
  styleUrl: './player-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBar {
  protected player = inject(PlayerService);
  protected library = inject(LibraryService);
  protected ui = inject(UiService);

  protected elapsed = computed(() => duration(this.player.position() / 1000 / this.player.speed()));
  protected remaining = computed(() => duration(this.player.total() / 1000 / this.player.speed()));
  protected liked = computed(() => {
    const t = this.player.track();
    return !!t && this.library.isLiked(t.slug);
  });
  protected currentLine = computed(() => {
    const t = this.player.timeline();
    const i = this.player.lineIndex();
    return t && this.player.engaged() && i >= 0 ? t.text[i] : '';
  });

  protected like() {
    const t = this.player.track();
    if (!t) return;
    const liked = this.library.toggleLike(t.slug);
    this.ui.toast(liked ? 'Added to Liked Poems' : 'Removed from Liked Poems', 'heart');
  }

  protected share() {
    const t = this.player.track();
    if (t) this.ui.share(`${t.title} — ${t.author}`, `poem/${t.slug}`);
  }

  protected openStage(e: Event) {
    // On phones the whole mini player opens the stage; on desktop only the vinyl does.
    if ((e.target as HTMLElement).closest('button, a') || !matchMedia('(max-width: 1023px)').matches) return;
    this.ui.stageOpen.set(true);
  }
}
