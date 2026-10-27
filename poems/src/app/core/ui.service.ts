import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { storedSignal } from './storage';

export type ThemePref = 'system' | 'light' | 'dark';

interface Toast {
  id: number;
  text: string;
  icon?: string;
}

/** App-wide chrome state: theme, overlays and toasts. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private doc = inject(DOCUMENT);

  readonly theme = storedSignal<ThemePref>('theme', 'system');
  readonly paletteOpen = signal(false);
  readonly stageOpen = signal(false);
  readonly queueOpen = signal(false);
  readonly shortcutsOpen = signal(false);
  readonly toasts = signal<Toast[]>([]);
  private toastId = 0;

  constructor() {
    effect(() => {
      const t = this.theme();
      const root = this.doc.documentElement;
      if (t === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', t);
    });
  }

  isDark(): boolean {
    const t = this.theme();
    if (t !== 'system') return t === 'dark';
    return this.doc.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  toggleTheme() {
    this.theme.set(this.isDark() ? 'light' : 'dark');
  }

  toast(text: string, icon?: string) {
    const id = ++this.toastId;
    this.toasts.update((t) => [...t.slice(-2), { id, text, icon }]);
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 2600);
  }

  async share(title: string, path: string) {
    const url = new URL(path, this.doc.baseURI).href;
    const nav = this.doc.defaultView?.navigator;
    try {
      if (nav?.share) {
        await nav.share({ title, url });
        return;
      }
      await nav?.clipboard.writeText(url);
      this.toast('Link copied to clipboard', 'link');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') this.toast('Could not share this poem');
    }
  }
}
