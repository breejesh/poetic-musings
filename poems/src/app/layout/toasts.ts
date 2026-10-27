import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiService } from '../core/ui.service';
import { Icon } from '../ui/icon';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (t of ui.toasts(); track t.id) {
        <div class="toast">
          @if (t.icon) {
            <app-icon [name]="t.icon" [fill]="t.icon === 'heart'" />
          }
          {{ t.text }}
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      left: 50%;
      bottom: calc(var(--player-h) + 20px);
      transform: translateX(-50%);
      z-index: 95;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    @media (max-width: 1023px) {
      .stack { bottom: calc(var(--mobile-nav-h) + 90px + env(safe-area-inset-bottom)); }
    }
    .toast {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.7rem 1.1rem;
      border-radius: 99px;
      background: var(--paper-white);
      color: #141312;
      font: 500 0.88rem var(--font-ui);
      box-shadow: 0 12px 34px rgb(0 0 0 / 0.28);
      animation: toast 2.6s var(--ease) both;
      white-space: nowrap;
    }
    .toast app-icon { color: #e5245e; font-size: 0.95rem; }
    @keyframes toast {
      0% { opacity: 0; transform: translateY(10px) scale(0.96); }
      10%, 85% { opacity: 1; transform: none; }
      100% { opacity: 0; transform: translateY(-4px); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  protected ui = inject(UiService);
}
