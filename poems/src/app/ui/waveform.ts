import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, signal } from '@angular/core';
import { PlayerService, lineAt } from '../core/player.service';
import { duration } from '../core/format';

/**
 * The player's progress bar, drawn as a waveform where every bar is a line of the poem:
 * long lines are tall, short lines are short. Click or drag to scrub.
 */
@Component({
  selector: 'app-waveform',
  template: `
    <div
      class="wave"
      role="slider"
      tabindex="0"
      aria-label="Seek"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="totalSec()"
      [attr.aria-valuenow]="positionSec()"
      [attr.aria-valuetext]="positionLabel()"
      (pointerdown)="down($event)"
      (pointermove)="move($event)"
      (pointerup)="up($event)"
      (pointerleave)="hover.set(null)"
      (keydown.arrowright)="player.seekLine(player.lineIndex() + 1); $event.preventDefault()"
      (keydown.arrowleft)="player.seekLine(player.lineIndex() - 1); $event.preventDefault()"
    >
      <div class="layer base">
        @for (h of bars(); track $index) {
          <i [style.height.%]="h * 100"></i>
        }
      </div>
      <div class="layer played" [style.clip-path]="clip()">
        @for (h of bars(); track $index) {
          <i [style.height.%]="h * 100"></i>
        }
      </div>
      @if (hover() !== null) {
        <div class="hover-line" [style.left.%]="hover()! * 100"></div>
        @if (hoverText(); as text) {
          <div class="tip" [style.left.%]="clampTip(hover()!) * 100">
            <b>{{ hoverTime() }}</b> {{ text }}
          </div>
        }
      }
    </div>
  `,
  styleUrl: './waveform.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Waveform {
  protected player = inject(PlayerService);
  readonly maxBars = input(80);
  readonly showTip = input(true);

  protected hover = signal<number | null>(null);
  private dragging = false;
  /** Rendered width — the bar count adapts so bars stay distinct on narrow screens. */
  private width = signal(0);

  constructor() {
    const el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
    const ro = new ResizeObserver(([e]) => this.width.set(e.contentRect.width));
    ro.observe(el);
    inject(DestroyRef).onDestroy(() => ro.disconnect());
  }

  protected bars = computed(() => {
    const t = this.player.timeline();
    const fit = this.width() ? Math.floor(this.width() / 5) : this.maxBars();
    const max = Math.max(16, Math.min(this.maxBars(), fit));
    if (!t || !t.starts.length) return Array.from({ length: Math.min(max, 48) }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i * 1.7)));
    // Always draw `max` slim bars; each line spans as many bars as its duration, with a little
    // texture so it reads like audio, and stanza pauses dip to near-silence.
    return Array.from({ length: max }, (_, i) => {
      const at = ((i + 0.5) / max) * t.total;
      const line = lineAt(t.starts, at);
      if (at > t.ends[line]) return 0.08;
      const texture = 0.78 + 0.22 * Math.abs(Math.sin(i * 2.3 + line * 0.7));
      return (t.weight[line] ?? 0.2) * texture;
    });
  });

  protected clip = computed(() => `inset(0 ${(100 - this.player.progress() * 100).toFixed(2)}% 0 0)`);
  protected totalSec = computed(() => Math.round(this.player.total() / 1000));
  protected positionSec = computed(() => Math.round(this.player.position() / 1000));
  protected positionLabel = computed(() => `${duration(this.positionSec())} of ${duration(this.totalSec())}`);

  protected hoverText = computed(() => {
    const t = this.player.timeline();
    const h = this.hover();
    if (!this.showTip() || !t || h === null) return '';
    const text = t.text[lineAt(t.starts, h * t.total)] ?? '';
    return text.length > 64 ? text.slice(0, 62) + '…' : text;
  });
  protected hoverTime = computed(() => duration(((this.hover() ?? 0) * this.player.total()) / 1000 / this.player.speed()));

  protected clampTip(x: number) {
    return Math.min(0.82, Math.max(0.18, x));
  }

  private fraction(e: PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  }

  protected down(e: PointerEvent) {
    this.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.player.seek(this.fraction(e) * this.player.total());
  }

  protected move(e: PointerEvent) {
    const f = this.fraction(e);
    this.hover.set(f);
    if (this.dragging) this.player.seek(f * this.player.total());
  }

  protected up(e: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    if (e.pointerType !== 'mouse') this.hover.set(null);
  }
}
