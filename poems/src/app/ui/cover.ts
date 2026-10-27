import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { hash } from '../core/format';

type Shape =
  | { t: 'c'; cx: number; cy: number; r: number; fill?: string; stroke?: string; sw?: number; o?: number }
  | { t: 'r'; x: number; y: number; w: number; h: number; fill: string; o?: number }
  | { t: 'p'; d: string; fill?: string; stroke?: string; sw?: number; o?: number }
  | { t: 'x'; x: number; y: number; text: string; size: number; fill: string };

interface Art {
  bg: string;
  shapes: Shape[];
  rotate: number;
}

// Muted, print-like palettes: [background, foreground, accent].
const PALETTES: [string, string, string][] = [
  ['#161513', '#efe7d8', '#c8553d'],
  ['#efe7d8', '#161513', '#c8553d'],
  ['#1f2a36', '#e9e1d2', '#d9a441'],
  ['#c8553d', '#f3eadb', '#161513'],
  ['#d9a441', '#1b1a17', '#f6efe2'],
  ['#6f8a6e', '#f2ece0', '#1b1a17'],
  ['#e5ded1', '#3b4d61', '#c8553d'],
  ['#5b4256', '#efe4d6', '#e0a98f'],
  ['#2b2926', '#d8cfc0', '#8fa3a8'],
  ['#c98f86', '#1d1b19', '#f4ece0'],
  ['#e9e4da', '#2b2926', '#6f8a6e'],
  ['#233a3a', '#eadfcc', '#e07a5f'],
];

/** Small seeded PRNG so a poem always gets the same artwork. */
function rng(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compose(seed: string, title: string): Art {
  const h = hash(seed);
  const r = rng(h);
  const between = (a: number, b: number) => a + r() * (b - a);
  const [bg, fg, ac] = PALETTES[h % PALETTES.length];
  const shapes: Shape[] = [];
  let rotate = 0;

  switch (Math.floor(r() * 8)) {
    case 0: {
      // Sun over a horizon.
      const horizon = between(58, 74);
      shapes.push({ t: 'c', cx: between(30, 70), cy: horizon - between(4, 16), r: between(20, 32), fill: ac });
      shapes.push({ t: 'r', x: 0, y: horizon, w: 100, h: 100 - horizon, fill: fg });
      for (let i = 1; i < 4; i++) shapes.push({ t: 'r', x: 0, y: horizon + i * 6, w: 100, h: 1.2, fill: bg, o: 0.35 });
      break;
    }
    case 1: {
      // Concentric rings from a corner — a record's grooves.
      const cx = r() > 0.5 ? 0 : 100;
      const cy = r() > 0.5 ? 0 : 100;
      for (let i = 14; i > 0; i--) shapes.push({ t: 'c', cx, cy, r: i * 9, stroke: i % 3 === 0 ? ac : fg, sw: i % 3 === 0 ? 3 : 1, fill: 'none' });
      shapes.push({ t: 'c', cx: 100 - cx * 0.6 - 20, cy: 100 - cy * 0.6 - 20, r: 9, fill: ac });
      break;
    }
    case 2: {
      // Horizontal bands of varying weight, one in accent.
      rotate = [0, 0, 90, -24][Math.floor(r() * 4)];
      let y = -30;
      let i = 0;
      const accentAt = Math.floor(between(2, 6));
      while (y < 130) {
        const hgt = between(4, 16);
        if (i % 2 === 0) shapes.push({ t: 'r', x: -30, y, w: 160, h: hgt, fill: i === accentAt * 2 ? ac : fg });
        y += hgt + between(2, 9);
        i++;
      }
      break;
    }
    case 3: {
      // Bauhaus arches.
      const cols = 2;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * 50;
          const y = row * 34 + 30;
          const fill = (row + col) % 3 === 0 ? ac : fg;
          shapes.push({ t: 'p', d: `M${x} ${y} a25 25 0 0 1 50 0 z`, fill, o: (row + col) % 2 ? 0.9 : 1 });
        }
      }
      break;
    }
    case 4: {
      // Halftone dots growing towards a focal point.
      const fx = between(10, 90);
      const fy = between(10, 90);
      for (let gx = 0; gx < 9; gx++) {
        for (let gy = 0; gy < 9; gy++) {
          const x = 6 + gx * 11;
          const y = 6 + gy * 11;
          const d = Math.hypot(x - fx, y - fy);
          const rad = Math.max(0.6, 5.2 - d / 16);
          shapes.push({ t: 'c', cx: x, cy: y, r: rad, fill: d < 18 ? ac : fg });
        }
      }
      break;
    }
    case 5: {
      // Waves — the rhythm of verse.
      const amp = between(3, 9);
      const freq = between(1.5, 3.5);
      for (let i = 0; i < 9; i++) {
        const y0 = 12 + i * 10;
        let d = `M-5 ${y0}`;
        for (let x = 0; x <= 110; x += 5) d += ` L${x} ${(y0 + Math.sin((x / 100) * Math.PI * freq + i * 0.6) * amp * (0.4 + i / 10)).toFixed(1)}`;
        shapes.push({ t: 'p', d, stroke: i === 4 ? ac : fg, sw: i === 4 ? 3 : 1.4, fill: 'none' });
      }
      break;
    }
    case 6: {
      // A giant initial, cropped.
      const letter = (title.match(/[A-Za-z]/)?.[0] ?? '·').toUpperCase();
      shapes.push({ t: 'c', cx: between(55, 80), cy: between(20, 45), r: between(14, 24), fill: ac });
      shapes.push({ t: 'x', x: between(-6, 12), y: between(98, 116), text: letter, size: 132, fill: fg });
      break;
    }
    default: {
      // Diagonal split with a circle across the seam.
      shapes.push({ t: 'p', d: 'M0 100 L100 0 L100 100 Z', fill: ac });
      shapes.push({ t: 'c', cx: between(35, 65), cy: between(35, 65), r: between(16, 26), fill: fg });
      shapes.push({ t: 'c', cx: between(15, 85), cy: between(15, 85), r: 3, fill: bg });
    }
  }
  return { bg, shapes, rotate };
}

/** Generative "album art" for a poem — the same seed always produces the same sleeve. */
@Component({
  selector: 'app-cover',
  template: `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" [attr.fill]="art().bg" />
      <g [attr.transform]="'rotate(' + art().rotate + ' 50 50)'">
        @for (s of art().shapes; track $index) {
          @switch (s.t) {
            @case ('c') {
              <circle [attr.cx]="$any(s).cx" [attr.cy]="$any(s).cy" [attr.r]="$any(s).r" [attr.fill]="$any(s).fill ?? 'none'" [attr.stroke]="$any(s).stroke ?? null" [attr.stroke-width]="$any(s).sw ?? null" [attr.opacity]="$any(s).o ?? null" />
            }
            @case ('r') {
              <rect [attr.x]="$any(s).x" [attr.y]="$any(s).y" [attr.width]="$any(s).w" [attr.height]="$any(s).h" [attr.fill]="$any(s).fill" [attr.opacity]="$any(s).o ?? null" />
            }
            @case ('p') {
              <path [attr.d]="$any(s).d" [attr.fill]="$any(s).fill ?? 'none'" [attr.stroke]="$any(s).stroke ?? null" [attr.stroke-width]="$any(s).sw ?? null" [attr.opacity]="$any(s).o ?? null" stroke-linecap="round" />
            }
            @case ('x') {
              <text [attr.x]="$any(s).x" [attr.y]="$any(s).y" [attr.font-size]="$any(s).size" [attr.fill]="$any(s).fill" font-family="Fraunces, Georgia, serif" font-style="italic" font-weight="400">{{ $any(s).text }}</text>
            }
          }
        }
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: var(--cover-radius, 10px);
      isolation: isolate;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* Printed-paper grain over the artwork. */
    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.5;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cover {
  readonly seed = input.required<string>();
  readonly title = input('');
  protected art = computed(() => compose(this.seed(), this.title()));
}
