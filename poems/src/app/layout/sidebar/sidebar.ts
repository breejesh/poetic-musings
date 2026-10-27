import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../ui/icon';
import { LibraryService } from '../../core/library.service';
import { PlayerService } from '../../core/player.service';
import { UiService } from '../../core/ui.service';

export const NAV = {
  discover: [
    { path: '/', label: 'Read Now', icon: 'home', exact: true },
    { path: '/browse', label: 'Browse', icon: 'grid', exact: false },
    { path: '/charts', label: 'Top 100', icon: 'charts', exact: false },
  ],
  genres: [
    { path: '/classics', label: 'Classics', icon: 'feather', exact: false },
    { path: '/contemporary', label: 'Contemporary', icon: 'pen', exact: false },
    { path: '/poets', label: 'Poets', icon: 'users', exact: false },
  ],
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected library = inject(LibraryService);
  protected player = inject(PlayerService);
  protected ui = inject(UiService);
  protected nav = NAV;
  protected isMac = /Mac|iPhone|iPad/.test(navigator.platform);
}
