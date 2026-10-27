import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  output,
} from '@angular/core';
import { PoemLine } from '../core/models';

/**
 * Renders a poem's lines, always at full contrast. Once a poem is started, the current line is
 * marked and fills in as it's read; the view follows along unless the reader scrolls away.
 */
@Component({
  selector: 'app-poem-text',
  template: `
    <div class="poem" [class.engaged]="engaged()" [class.stage]="variant() === 'stage'">
      @for (line of lines(); track $index; let i = $index) {
        @if (line[1]) {
          <p
            class="line"
            [class.active]="i === active()"
            [class.past]="engaged() && i < active()"
            [style.--indent]="line[0]"
            [style.--p]="i === active() ? progress() : null"
            [attr.data-i]="i"
            [innerHTML]="line[1]"
            (click)="engaged() && lineClick.emit(i)"
          ></p>
        } @else {
          <div class="stanza" aria-hidden="true"></div>
        }
      }
    </div>
  `,
  styleUrl: './poem-text.scss',
  host: {
    '(wheel)': 'userScrolled()',
    '(touchmove)': 'userScrolled()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemText {
  private el = inject(ElementRef<HTMLElement>);

  readonly lines = input.required<PoemLine[]>();
  /** Index into lines of the active line, -1 for none. */
  readonly active = input(-1);
  readonly engaged = input(false);
  /** 0–1 progress through the active line (karaoke wipe). */
  readonly progress = input(0);
  /** Whether to keep the active line in view. */
  readonly follow = input(false);
  readonly variant = input<'page' | 'stage'>('page');
  readonly lineClick = output<number>();

  private pausedUntil = 0;

  constructor() {
    afterRenderEffect(() => {
      const i = this.active();
      if (!this.follow() || i < 0 || Date.now() < this.pausedUntil) return;
      const node = (this.el.nativeElement as HTMLElement).querySelector<HTMLElement>(`[data-i="${i}"]`);
      node?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    });
  }

  protected userScrolled() {
    // Let the reader look around; pick up following again shortly after.
    this.pausedUntil = Date.now() + 3500;
  }
}
