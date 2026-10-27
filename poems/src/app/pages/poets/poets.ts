import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CatalogService } from '../../core/catalog.service';
import { fold } from '../../core/format';
import { Icon } from '../../ui/icon';
import { PoetCard } from '../../ui/poet-card';
import { InView } from '../../ui/in-view';

type PoetSort = 'popular' | 'az' | 'prolific';

@Component({
  selector: 'app-poets',
  imports: [Icon, PoetCard, InView],
  template: `
    <div class="page">
      <header class="head">
        <div>
          <p class="eyebrow">Artists</p>
          <h1 class="display">Poets</h1>
          <p class="sub">{{ catalog.poets().length.toLocaleString() }} voices, from Sappho’s heirs to this year’s debuts.</p>
        </div>
        <label class="filter">
          <app-icon name="search" />
          <input class="field" type="search" placeholder="Filter poets…" [value]="query()" (input)="query.set($any($event.target).value)" />
        </label>
      </header>

      <div class="toolbar">
        <div class="chips">
          <button class="chip" type="button" [class.active]="sort() === 'popular'" (click)="sort.set('popular')">Popular</button>
          <button class="chip" type="button" [class.active]="sort() === 'prolific'" (click)="sort.set('prolific')">Most poems</button>
          <button class="chip" type="button" [class.active]="sort() === 'az'" (click)="sort.set('az')">A–Z</button>
        </div>
        <div class="letters" aria-label="Filter by surname initial">
          @for (l of letters; track l) {
            <button type="button" [class.on]="letter() === l" (click)="letter.set(letter() === l ? '' : l)">{{ l }}</button>
          }
        </div>
      </div>

      <div class="grid">
        @for (p of visible(); track p.slug) {
          <app-poet-card [poet]="p" />
        } @empty {
          @if (catalog.ready()) {
            <div class="empty"><h3>No poets match</h3><p>Try a different spelling.</p></div>
          } @else {
            @for (i of placeholders; track i) {
              <div class="skeleton ph"></div>
            }
          }
        }
      </div>
      @if (visible().length < filtered().length) {
        <div class="more" (appInView)="limit.set(limit() + 60)"></div>
      }
    </div>
  `,
  styles: `
    .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
    .head .sub { margin-top: 0.6rem; font-size: 1rem; }
    .filter { position: relative; width: min(320px, 100%); display: block; }
    .filter app-icon { position: absolute; left: 1rem; top: 50%; translate: 0 -50%; color: var(--ink-3); }
    .filter .field { padding-left: 2.8rem; border-radius: 99px; }
    .toolbar { display: flex; flex-direction: column; gap: 0.9rem; margin: 2rem 0 1.2rem; }
    .letters { display: flex; flex-wrap: wrap; gap: 2px; }
    .letters button {
      all: unset; cursor: pointer; width: 2rem; height: 2rem; display: grid; place-items: center;
      border-radius: 8px; font: 600 0.8rem var(--font-ui); color: var(--ink-3);
    }
    .letters button:hover { background: var(--hover); color: var(--ink); }
    .letters button.on { background: var(--ink); color: var(--bg); }
    .letters button:focus-visible { outline: 2px solid var(--focus); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px 12px; }
    .grid .empty { grid-column: 1 / -1; }
    .ph { aspect-ratio: 0.8; border-radius: 16px; }
    .more { height: 1px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoetsPage {
  protected catalog = inject(CatalogService);
  protected query = signal('');
  protected sort = signal<PoetSort>('popular');
  protected letter = signal('');
  protected limit = signal(60);
  protected letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  protected placeholders = Array.from({ length: 12 }, (_, i) => i);

  private surname = (name: string) => fold(name).split(' ').pop() ?? '';

  protected filtered = computed(() => {
    const q = fold(this.query());
    const letter = this.letter().toLowerCase();
    let list = this.catalog.popularPoets();
    if (q) list = list.filter((p) => fold(p.name).includes(q));
    if (letter) list = list.filter((p) => this.surname(p.name).startsWith(letter));
    switch (this.sort()) {
      case 'az':
        return [...list].sort((a, b) => this.surname(a.name).localeCompare(this.surname(b.name)));
      case 'prolific':
        return [...list].sort((a, b) => b.poems.length - a.poems.length || a.topRank - b.topRank);
      default:
        return list;
    }
  });
  protected visible = computed(() => this.filtered().slice(0, this.limit()));

  constructor() {
    effect(() => {
      this.filtered();
      untracked(() => this.limit.set(60));
    });
  }
}
