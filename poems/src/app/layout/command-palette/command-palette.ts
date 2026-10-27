import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { UiService } from '../../core/ui.service';
import { LibraryService } from '../../core/library.service';
import { Poet, Track } from '../../core/models';
import { duration, lifespan, plural } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { Cover } from '../../ui/cover';

interface Item {
  kind: 'poem' | 'poet' | 'movement' | 'action';
  id: string;
  title: string;
  sub: string;
  icon?: string;
  track?: Track;
  poet?: Poet | null;
  run: () => void;
}

/** ⌘K — jump to any poem, poet or movement from anywhere. */
@Component({
  selector: 'app-command-palette',
  imports: [Icon, Portrait, Cover],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette {
  private catalog = inject(CatalogService);
  private player = inject(PlayerService);
  private library = inject(LibraryService);
  private router = inject(Router);
  protected ui = inject(UiService);
  private input = viewChild<ElementRef<HTMLInputElement>>('input');

  protected query = signal('');
  protected cursor = signal(0);

  protected items = computed<Item[]>(() => {
    const q = this.query().trim();
    if (!q) return this.suggestions();
    const r = this.catalog.search(q, 7);
    return [
      ...r.poems.map((t) => this.poemItem(t)),
      ...r.poets.slice(0, 4).map<Item>((p) => ({
        kind: 'poet',
        id: 'poet:' + p.slug,
        title: p.name,
        poet: p,
        sub: ['Poet', lifespan(p.born, p.died), plural(p.poems.length, 'poem')].filter(Boolean).join(' · '),
        run: () => this.go(['/poet', p.slug]),
      })),
      ...r.movements.slice(0, 3).map<Item>((m) => ({
        kind: 'movement',
        id: 'm:' + m.slug,
        title: m.name,
        sub: `Movement · ${m.poets.length} poets`,
        icon: 'compass',
        run: () => this.go(['/movement', m.slug]),
      })),
      {
        kind: 'action',
        id: 'all',
        title: `See all results for “${q}”`,
        sub: 'Search',
        icon: 'search',
        run: () => this.go(['/search'], { q }),
      },
    ];
  });

  private suggestions = computed<Item[]>(() => {
    const recent = this.library
      .history()
      .slice(0, 4)
      .map((h) => this.catalog.track(h.slug))
      .filter((t): t is Track => !!t);
    const actions: Item[] = [
      { kind: 'action', id: 'surprise', title: 'Surprise me', sub: 'Play a random poem', icon: 'dice', run: () => this.done(() => this.player.surprise()) },
      { kind: 'action', id: 'potd', title: 'Poem of the day', sub: 'Today’s pick', icon: 'sparkles', run: () => this.playPotd() },
      { kind: 'action', id: 'liked', title: 'Liked Poems', sub: 'Your library', icon: 'heart', run: () => this.go(['/favourites']) },
      { kind: 'action', id: 'theme', title: 'Toggle theme', sub: 'Light / dark', icon: this.ui.isDark() ? 'sun' : 'moon', run: () => this.done(() => this.ui.toggleTheme()) },
    ];
    return [...recent.map((t) => ({ ...this.poemItem(t), sub: 'Recently read · ' + t.author })), ...actions];
  });

  constructor() {
    afterNextRender(() => this.input()?.nativeElement.focus());
  }

  private poemItem(t: Track): Item {
    return {
      kind: 'poem',
      id: 'poem:' + t.slug,
      title: t.title,
      sub: `${t.author}${t.year ? ' · ' + t.year : ''} · ${duration(t.seconds)}`,
      track: t,
      poet: t.poet,
      run: () => this.go(['/poem', t.slug]),
    };
  }

  private playPotd() {
    const t = this.catalog.poemOfTheDay();
    this.done(() => t && this.player.play(t));
  }

  private done(fn: () => void) {
    this.close();
    fn();
  }

  private go(path: string[], queryParams?: Record<string, string>) {
    this.done(() => this.router.navigate(path, { queryParams }));
  }

  protected close() {
    this.ui.paletteOpen.set(false);
  }

  protected onInput(v: string) {
    this.query.set(v);
    this.cursor.set(0);
  }

  protected key(e: KeyboardEvent) {
    const n = this.items().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.cursor.update((c) => (c + 1) % n);
      this.scrollCursor();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.cursor.update((c) => (c - 1 + n) % n);
      this.scrollCursor();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = this.items()[this.cursor()];
      if (!item) return;
      // Shift+Enter plays a poem straight away.
      if (e.shiftKey && item.track) this.done(() => this.player.play(item.track!));
      else item.run();
    }
  }

  protected playItem(e: Event, item: Item) {
    e.stopPropagation();
    if (item.track) this.done(() => this.player.play(item.track!));
  }

  private scrollCursor() {
    queueMicrotask(() => document.querySelector('.palette .opt.on')?.scrollIntoView({ block: 'nearest' }));
  }
}
