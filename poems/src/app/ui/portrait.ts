import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Poet } from '../core/models';
import { hash, initials } from '../core/format';

/** A poet's portrait (monochrome by default) with a typographic monogram fallback. */
@Component({
  selector: 'app-portrait',
  template: `
    @if (src() && failed() !== src()) {
      <img [src]="src()" [alt]="label()" loading="lazy" decoding="async" (error)="failed.set(src())" />
    } @else {
      <span class="monogram" [style.--tone]="tone()" [style.--l]="light()" [attr.aria-label]="label()">{{ letters() }}</span>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: var(--portrait-radius, 50%);
      background: var(--surface-3);
      flex-shrink: 0;
      isolation: isolate;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: var(--portrait-filter, grayscale(1) contrast(1.05));
      transition: filter 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .monogram {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 400;
      font-size: var(--monogram-size, 2.4em);
      letter-spacing: -0.02em;
      color: oklch(0.96 0.01 80 / 0.9);
      background:
        repeating-linear-gradient(calc(var(--tone) * 1deg), transparent 0 7px, oklch(1 0 0 / 0.04) 7px 8px),
        oklch(var(--l) 0.008 70);
      container-type: size;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portrait {
  readonly poet = input<Poet | null | undefined>(null);
  /** Name to use when there's no poet record (e.g. anonymous poems). */
  readonly name = input<string>('');
  readonly size = input<'sm' | 'lg'>('sm');

  protected failed = signal<string | null>(null);
  protected label = computed(() => this.poet()?.name ?? this.name());
  protected letters = computed(() => initials(this.label()));
  protected tone = computed(() => hash(this.label()) % 180);
  protected light = computed(() => 0.24 + (hash(this.label()) % 17) * 0.012);
  protected src = computed(() => {
    const p = this.poet();
    return p?.hasPortrait ? `portraits/${this.size() === 'lg' ? 320 : 96}/${p.slug}.webp` : null;
  });
}
