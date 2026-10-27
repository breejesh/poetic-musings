import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Sidebar } from './layout/sidebar/sidebar';
import { PlayerBar } from './layout/player-bar/player-bar';
import { MobileNav } from './layout/mobile-nav/mobile-nav';
import { CommandPalette } from './layout/command-palette/command-palette';
import { Stage } from './layout/stage/stage';
import { QueuePanel } from './layout/queue-panel/queue-panel';
import { Toasts } from './layout/toasts';
import { Shortcuts } from './layout/shortcuts';
import { PlayerService } from './core/player.service';
import { LibraryService } from './core/library.service';
import { CatalogService } from './core/catalog.service';
import { UiService } from './core/ui.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, PlayerBar, MobileNav, CommandPalette, Stage, QueuePanel, Toasts, Shortcuts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:keydown)': 'onKey($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected player = inject(PlayerService);
  protected catalog = inject(CatalogService);
  protected ui = inject(UiService);
  private library = inject(LibraryService);
  private router = inject(Router);
  private main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    this.restoreScrollPerPage();
  }

  /**
   * The content pane (not the window) scrolls, so handle scroll position here: new pages start at
   * the top, back/forward returns to where you were, and query-only changes (search typing) don't jump.
   */
  private restoreScrollPerPage() {
    const saved = new Map<number, number>();
    const path = (url: string) => url.split(/[?#]/)[0];
    let fromUrl = '';
    let restoreTo: number | null = null;
    this.router.events.subscribe((e) => {
      const el = this.main().nativeElement;
      if (e instanceof NavigationStart) {
        fromUrl = this.router.url;
        saved.set(history.state?.navigationId ?? 0, el.scrollTop);
        restoreTo = e.navigationTrigger === 'popstate' && e.restoredState ? (saved.get(e.restoredState.navigationId) ?? 0) : null;
      } else if (e instanceof NavigationEnd) {
        if (restoreTo === null && path(fromUrl) === path(e.urlAfterRedirects)) return;
        const top = restoreTo ?? 0;
        requestAnimationFrame(() => el.scrollTo({ top }));
      }
    });
  }

  protected onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const typing = target.closest('input, textarea, select, [contenteditable="true"]');

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.ui.paletteOpen.update((o) => !o);
      return;
    }
    if (e.key === 'Escape') {
      if (this.ui.paletteOpen()) this.ui.paletteOpen.set(false);
      else if (this.ui.shortcutsOpen()) this.ui.shortcutsOpen.set(false);
      else if (this.ui.queueOpen()) this.ui.queueOpen.set(false);
      else if (this.ui.stageOpen()) this.ui.stageOpen.set(false);
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || this.ui.paletteOpen()) return;
    // Let focused buttons/links handle Space & Enter themselves.
    const onControl = target.closest('button, a, [role="slider"], [tabindex]:not(body)');

    switch (e.key) {
      case ' ':
      case 'k':
        if (e.key === ' ' && onControl) return;
        e.preventDefault();
        this.player.toggle();
        break;
      case 'ArrowRight':
        if (onControl?.getAttribute('role') === 'slider') return;
        if (e.shiftKey) this.player.next();
        else this.player.seekLine(this.player.lineIndex() + 1);
        break;
      case 'ArrowLeft':
        if (onControl?.getAttribute('role') === 'slider') return;
        if (e.shiftKey) this.player.prev();
        else this.player.seekLine(this.player.lineIndex() - 1);
        break;
      case 'n':
        this.player.next();
        break;
      case 'p':
        this.player.prev();
        break;
      case 's':
        this.player.toggleShuffle();
        this.ui.toast(this.player.shuffle() ? 'Shuffle on' : 'Shuffle off', 'shuffle');
        break;
      case 'r':
        this.player.cycleRepeat();
        this.ui.toast({ off: 'Repeat off', all: 'Repeat all', one: 'Repeat this poem' }[this.player.repeat()], 'repeat');
        break;
      case 'l': {
        const t = this.player.track();
        if (t) {
          const liked = this.library.toggleLike(t.slug);
          this.ui.toast(liked ? 'Added to Liked Poems' : 'Removed from Liked Poems', 'heart');
        }
        break;
      }
      case 'f':
        if (this.player.track()) this.ui.stageOpen.update((o) => !o);
        break;
      case 'q':
        this.ui.queueOpen.update((o) => !o);
        break;
      case 't':
        this.ui.toggleTheme();
        break;
      case '/':
        e.preventDefault();
        this.ui.paletteOpen.set(true);
        break;
      case '?':
        this.ui.shortcutsOpen.update((o) => !o);
        break;
    }
  }
}
