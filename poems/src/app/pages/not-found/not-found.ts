import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/player.service';
import { Icon } from '../../ui/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon],
  template: `
    <div class="page lost">
      <p class="eyebrow">404</p>
      <h1 class="display">Lost in the margins</h1>
      <p class="verse">
        Two roads diverged in a URL,<br />
        and you — you took the one that isn’t there.
      </p>
      <div class="actions">
        <a class="btn" routerLink="/">Back to Listen Now</a>
        <button class="btn ghost" type="button" (click)="player.surprise()"><app-icon name="dice" /> Surprise me</button>
      </div>
    </div>
  `,
  styles: `
    .lost { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; gap: 1rem; }
    .verse { font: italic 400 1.4rem/1.6 var(--font-serif); color: var(--ink-2); }
    .actions { display: flex; gap: 0.6rem; margin-top: 1rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  protected player = inject(PlayerService);
}
