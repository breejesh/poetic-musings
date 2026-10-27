import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiService } from '../core/ui.service';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-shortcuts',
  imports: [Icon],
  template: `
    <div class="scrim" (click)="ui.shortcutsOpen.set(false)"></div>
    <div class="card" role="dialog" aria-modal="true" aria-labelledby="sc-title">
      <header>
        <h2 id="sc-title">Keyboard shortcuts</h2>
        <button class="icon-btn" type="button" (click)="ui.shortcutsOpen.set(false)" aria-label="Close"><app-icon name="close" /></button>
      </header>
      <dl>
        @for (s of keys; track s[1]) {
          <div>
            <dt>
              @for (k of s[0].split(' '); track $index) {
                <kbd>{{ k }}</kbd>
              }
            </dt>
            <dd>{{ s[1] }}</dd>
          </div>
        }
      </dl>
    </div>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; }
    .scrim { position: absolute; inset: 0; background: rgb(10 9 8 / 0.45); backdrop-filter: blur(4px); }
    .card {
      position: relative;
      width: min(520px, 100%);
      background: var(--bg-elev);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 18px 22px 22px;
      box-shadow: var(--shadow-2);
    }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    h2 { font-size: 1.5rem; }
    dl { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    dl > div { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--line); }
    dt { display: flex; gap: 3px; }
    dd { margin: 0; font-size: 0.85rem; color: var(--ink-2); text-align: right; }
    @media (max-width: 520px) { dl { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shortcuts {
  protected ui = inject(UiService);
  protected keys: [string, string][] = [
    ['Space', 'Play / pause'],
    ['N', 'Next poem'],
    ['P', 'Previous poem'],
    ['→', 'Next line'],
    ['←', 'Previous line'],
    ['S', 'Shuffle'],
    ['R', 'Repeat'],
    ['L', 'Like'],
    ['F', 'Stage mode'],
    ['Q', 'Queue'],
    ['T', 'Theme'],
    ['/', 'Search'],
    ['?', 'This help'],
  ];
}
