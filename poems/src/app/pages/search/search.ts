import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, input, linkedSignal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { Icon } from '../../ui/icon';
import { PoetCard } from '../../ui/poet-card';
import { TrackList } from '../../ui/track-list';

@Component({
  selector: 'app-search',
  imports: [RouterLink, Icon, PoetCard, TrackList],
  template: `
    <div class="page">
      <label class="box">
        <app-icon name="search" />
        <input
          #box
          type="search"
          placeholder="Poems, poets, movements…"
          autocomplete="off"
          [value]="query()"
          (input)="update($any($event.target).value)"
        />
      </label>

      @if (query().trim()) {
        @if (results().poets.length) {
          <section class="section">
            <div class="section-head"><h2>Poets</h2></div>
            <div class="shelf poets">
              @for (p of results().poets; track p.slug) {
                <app-poet-card [poet]="p" />
              }
            </div>
          </section>
        }
        @if (results().movements.length) {
          <section class="section">
            <div class="chips">
              @for (m of results().movements; track m.slug) {
                <a class="chip" [routerLink]="['/movement', m.slug]"><app-icon name="compass" /> {{ m.name }}</a>
              }
            </div>
          </section>
        }
        <section class="section">
          <div class="section-head"><h2>Poems</h2></div>
          @if (results().poems.length) {
            <app-track-list [tracks]="results().poems" />
          } @else {
            <div class="empty"><h3>No poems match “{{ query() }}”</h3><p>Try a title, a poet, or fewer words.</p></div>
          }
        </section>
      } @else {
        <section class="section">
          <div class="section-head"><h2>Try</h2></div>
          <div class="chips">
            @for (s of suggestions; track s) {
              <button class="chip" type="button" (click)="update(s)">{{ s }}</button>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    .box {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0 1.2rem;
      border-radius: 99px;
      background: var(--surface);
      border: 1px solid var(--line);
      box-shadow: var(--shadow-1);
      color: var(--ink-3);
      font-size: 1.15rem;
    }
    .box:focus-within { border-color: var(--ink-3); }
    .box input {
      flex: 1;
      height: 3.6rem;
      border: 0;
      outline: none;
      background: transparent;
      font: 400 1.3rem var(--font-serif);
      color: var(--ink);
      min-width: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  private catalog = inject(CatalogService);
  private router = inject(Router);
  private box = viewChild<ElementRef<HTMLInputElement>>('box');

  /** ?q= query param. */
  readonly q = input<string>('');
  protected query = linkedSignal(() => this.q() ?? '');
  protected results = computed(() => this.catalog.search(this.query(), 60));
  protected suggestions = ['love', 'Emily Dickinson', 'night', 'Harlem Renaissance', 'sonnet', 'Langston Hughes', 'river', 'Mary Oliver', 'grief', 'spring'];

  constructor() {
    afterNextRender(() => this.box()?.nativeElement.focus());
  }

  protected update(v: string) {
    this.query.set(v);
    this.router.navigate([], { queryParams: { q: v || null }, replaceUrl: true });
  }
}
