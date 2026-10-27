import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../ui/icon';
import { UiService } from '../../core/ui.service';
import { PlayerService } from '../../core/player.service';

/** Phone/tablet chrome: a slim top bar and a bottom tab bar. */
@Component({
  selector: 'app-mobile-nav',
  imports: [RouterLink, RouterLinkActive, Icon],
  template: `
    <header class="top">
      <a routerLink="/" class="brand" aria-label="Poetic Musings — home"><img src="logo.svg" alt="" width="120" height="64" /></a>
      <div class="actions">
        <button class="icon-btn" type="button" (click)="player.surprise()" aria-label="Surprise me"><app-icon name="dice" /></button>
        <button class="icon-btn" type="button" (click)="ui.toggleTheme()" aria-label="Toggle theme">
          <app-icon [name]="ui.isDark() ? 'sun' : 'moon'" />
        </button>
      </div>
    </header>
    <nav class="tabs" aria-label="Main">
      @for (t of tabs; track t.path) {
        <a [routerLink]="t.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: t.path === '/' }">
          <app-icon [name]="t.icon" />
          <span>{{ t.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    .top {
      grid-area: top;
      position: relative;
      z-index: 25;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px var(--gutter) 6px;
      background: color-mix(in oklab, var(--bg) 82%, transparent);
      backdrop-filter: blur(14px) saturate(1.4);
      border-bottom: 1px solid var(--line);
    }
    .brand img { display: block; width: 104px; height: auto; filter: var(--logo-filter); }
    .actions { display: flex; gap: 2px; color: var(--ink-2); }
    .tabs {
      grid-area: tabs;
      position: relative;
      z-index: 31;
      height: calc(var(--mobile-nav-h) + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: var(--stage);
      color: var(--stage-ink-2);
      border-top: 1px solid rgb(255 255 255 / 0.06);
    }
    .tabs a {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      text-decoration: none;
      color: inherit;
      font: 500 0.68rem var(--font-ui);
      letter-spacing: 0.02em;
      transition: color 0.15s;
    }
    .tabs a app-icon { font-size: 1.15rem; }
    .tabs a.active { color: var(--stage-ink); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileNav {
  protected ui = inject(UiService);
  protected player = inject(PlayerService);
  protected tabs = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/browse', label: 'Browse', icon: 'grid' },
    { path: '/search', label: 'Search', icon: 'search' },
    { path: '/favourites', label: 'Library', icon: 'library' },
  ];
}
