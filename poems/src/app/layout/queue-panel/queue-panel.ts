import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PlayerService } from '../../core/player.service';
import { UiService } from '../../core/ui.service';
import { duration, longDuration } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Cover } from '../../ui/cover';
import { EqBars } from '../../ui/eq-bars';

/** Slide-over listing what's playing and what's up next. */
@Component({
  selector: 'app-queue-panel',
  imports: [Icon, Cover, EqBars],
  template: `
    <div class="scrim" (click)="ui.queueOpen.set(false)"></div>
    <aside class="panel" role="dialog" aria-label="Queue">
      <header>
        <h2>Queue</h2>
        <button class="icon-btn" type="button" (click)="ui.queueOpen.set(false)" aria-label="Close queue"><app-icon name="close" /></button>
      </header>
      @if (player.track(); as t) {
        <p class="eyebrow">Now playing</p>
        <div class="item current">
          <app-cover class="pic" [seed]="t.slug" [title]="t.title" />
          <span class="text"><b>{{ t.title }}</b><small>{{ t.author }}</small></span>
          <app-eq [playing]="player.playing()" />
        </div>
      }
      <p class="eyebrow next">
        Up next
        <span>{{ upcoming().length }} poems · {{ upcomingLength() }}</span>
      </p>
      <ol class="list">
        @for (t of upcoming(); track t.slug; let i = $index) {
          <li>
            <button class="item" type="button" (click)="player.goTo(player.index() + 1 + i)">
              <app-cover class="pic" [seed]="t.slug" [title]="t.title" />
              <span class="text"><b>{{ t.title }}</b><small>{{ t.author }}</small></span>
              <span class="dur">{{ dur(t.seconds) }}</span>
            </button>
          </li>
        } @empty {
          <li class="none">Nothing queued. Press next and we'll find something.</li>
        }
      </ol>
    </aside>
  `,
  styleUrl: './queue-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuePanel {
  protected player = inject(PlayerService);
  protected ui = inject(UiService);
  protected upcoming = computed(() => this.player.upNext().slice(0, 60));
  protected upcomingLength = computed(() => longDuration(this.player.upNext().reduce((s, t) => s + t.seconds, 0)));
  protected dur = duration;
}
