import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Little animated equaliser shown next to whatever is playing. */
@Component({
  selector: 'app-eq',
  template: '<i></i><i></i><i></i><i></i>',
  host: { '[class.paused]': '!playing()', 'aria-label': 'Now playing', role: 'img' },
  styles: `
    :host {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      width: 16px;
      height: 14px;
    }
    i {
      flex: 1;
      background: currentColor;
      border-radius: 1px;
      animation: eq 0.9s ease-in-out infinite alternate;
      height: 30%;
    }
    i:nth-child(2) { animation-delay: -0.35s; animation-duration: 0.7s; }
    i:nth-child(3) { animation-delay: -0.6s; animation-duration: 1.1s; }
    i:nth-child(4) { animation-delay: -0.15s; animation-duration: 0.8s; }
    :host(.paused) i { animation-play-state: paused; }
    @keyframes eq {
      0% { height: 20%; }
      50% { height: 100%; }
      100% { height: 45%; }
    }
    @media (prefers-reduced-motion: reduce) {
      i { animation: none; height: 60%; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EqBars {
  readonly playing = input(true);
}
