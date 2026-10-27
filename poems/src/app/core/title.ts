import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE = 'Poetic Musings';

/** Static route titles; pages with dynamic titles call PageTitle.set(). */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot) {
    const t = this.buildTitle(snapshot);
    if (t) this.title.setTitle(`${t} · ${SITE}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PageTitle {
  private title = inject(Title);
  set(text: string | null | undefined) {
    this.title.setTitle(text ? `${text} · ${SITE}` : SITE);
  }
}
