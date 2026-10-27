import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Track } from '../core/models';
import { PlayerService } from '../core/player.service';
import { duration } from '../core/format';
import { Icon } from './icon';
import { Portrait } from './portrait';
import { EqBars } from './eq-bars';
import { Cover } from './cover';

/** A poem as an "album": generative sleeve art, the poet as a small badge, title below. */
@Component({
  selector: 'app-poem-card',
  imports: [RouterLink, Icon, Portrait, EqBars, Cover],
  template: `
    <div class="frame">
      <a class="sleeve" [routerLink]="['/poem', track().slug]" [attr.aria-label]="track().title + ' by ' + track().author">
        <app-cover class="art" [seed]="track().slug" [title]="track().title" />
        <app-portrait class="badge-pic" [poet]="track().poet" [name]="track().author" />
        @if (badge()) {
          <span class="badge">{{ badge() }}</span>
        }
        @if (current() && player.engaged()) {
          <app-eq class="eq" [playing]="player.playing()" />
        }
      </a>
      <button class="play" type="button" (click)="play()" [attr.aria-label]="'Play ' + track().title">
        <app-icon [name]="current() && player.playing() ? 'pause' : 'play'" [fill]="true" />
      </button>
    </div>
    <a class="meta" [routerLink]="['/poem', track().slug]" tabindex="-1">
      <span class="t">{{ track().title }}</span>
      <span class="s">{{ track().author }} · {{ dur() }}</span>
    </a>
  `,
  styleUrl: './poem-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemCard {
  protected player = inject(PlayerService);
  readonly track = input.required<Track>();
  /** The list this card belongs to — becomes the queue when played. */
  readonly queue = input<Track[] | undefined>(undefined);
  readonly badge = input<string>('');

  protected current = computed(() => this.player.track()?.slug === this.track().slug);
  protected dur = computed(() => duration(this.track().seconds));

  protected play() {
    if (this.current() && this.player.playing()) this.player.pause();
    else this.player.play(this.track(), this.queue());
  }
}
