import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { ERAS } from '../../core/models';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';

@Component({
  selector: 'app-browse',
  imports: [RouterLink, Icon, Portrait],
  template: `
    <div class="page">
      <header>
        <p class="eyebrow">Browse</p>
        <h1 class="display">Find your next poem</h1>
      </header>

      <section class="section genres">
        <a class="genre classic" routerLink="/classics">
          <app-icon name="feather" class="g-icon" />
          <span class="g-name">Classics</span>
          <span class="g-sub">{{ catalog.classics().length.toLocaleString() }} poems · before 1950</span>
        </a>
        <a class="genre contemporary" routerLink="/contemporary">
          <app-icon name="pen" class="g-icon" />
          <span class="g-name">Contemporary</span>
          <span class="g-sub">{{ catalog.contemporary().length.toLocaleString() }} poems · 1950 to now</span>
        </a>
        <a class="genre charts" routerLink="/charts">
          <app-icon name="charts" class="g-icon" />
          <span class="g-name">Top 100</span>
          <span class="g-sub">The most-read poems</span>
        </a>
        <a class="genre poets" routerLink="/poets">
          <app-icon name="users" class="g-icon" />
          <span class="g-name">Poets</span>
          <span class="g-sub">{{ catalog.poets().length.toLocaleString() }} voices</span>
        </a>
      </section>

      <section class="section">
        <div class="section-head"><h2>Eras</h2></div>
        <div class="eras">
          @for (e of eras; track e.slug) {
            <a class="era" [routerLink]="['/era', e.slug]">
              <span class="era-label">{{ e.label }}</span>
              <span class="era-title">{{ e.title }}</span>
            </a>
          }
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Movements & schools</h2></div>
        <div class="movements">
          @for (m of movements(); track m.slug) {
            <a class="movement" [routerLink]="['/movement', m.slug]">
              <span class="faces">
                @for (p of m.poets.slice(0, 3); track p.slug) {
                  <app-portrait class="face" [poet]="p" />
                }
              </span>
              <span class="m-text">
                <span class="m-name">{{ m.name }}</span>
                <span class="m-sub">{{ m.poets.length }} poets</span>
              </span>
            </a>
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './browse.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowsePage {
  protected catalog = inject(CatalogService);
  protected eras = ERAS;
  protected movements = computed(() => this.catalog.movements().filter((m) => m.poets.length >= 2));
}
