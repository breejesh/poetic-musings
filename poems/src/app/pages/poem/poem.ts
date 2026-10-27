import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { PlayerService } from '../../core/player.service';
import { LibraryService } from '../../core/library.service';
import { UiService } from '../../core/ui.service';
import { PageTitle } from '../../core/title';
import { duration, lifespan, plural } from '../../core/format';
import { Icon } from '../../ui/icon';
import { Portrait } from '../../ui/portrait';
import { PoemText } from '../../ui/poem-text';
import { TrackList } from '../../ui/track-list';
import { Waveform } from '../../ui/waveform';
import { Cover } from '../../ui/cover';

@Component({
  selector: 'app-poem',
  imports: [RouterLink, Icon, Portrait, PoemText, TrackList, Waveform, Cover],
  templateUrl: './poem.html',
  styleUrl: './poem.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoemPage {
  private catalog = inject(CatalogService);
  protected player = inject(PlayerService);
  protected library = inject(LibraryService);
  protected ui = inject(UiService);
  private title = inject(PageTitle);

  readonly slug = input.required<string>();

  protected track = computed(() => (this.catalog.ready() ? this.catalog.track(this.slug()) : undefined));
  protected notFound = computed(() => this.catalog.ready() && !this.track());
  /** The page shows the player's current poem — they're kept in sync. */
  protected isCurrent = computed(() => this.player.track()?.slug === this.slug());
  protected detail = computed(() => (this.isCurrent() ? this.player.detail() : null));
  protected loadFailed = computed(() => this.isCurrent() && !this.player.loading() && !this.player.detail());

  protected elapsed = computed(() => duration(this.player.position() / 1000 / this.player.speed()));
  protected liked = computed(() => this.library.isLiked(this.slug()));
  protected duration = computed(() => duration((this.track()?.seconds ?? 0) / this.player.speed()));
  protected plays = computed(() => this.library.playCount(this.slug()));
  protected life = computed(() => {
    const p = this.track()?.poet;
    return p ? lifespan(p.born, p.died) : '';
  });
  protected aboutLine = computed(() => {
    const p = this.track()?.poet;
    return p ? [this.life(), p.state, plural(p.poems.length, 'poem')].filter(Boolean).join(' · ') : '';
  });
  /** First sentences of the poet's biography, for the "About the poet" card. */
  protected bioExcerpt = signal('');
  protected more = computed(() => {
    const t = this.track();
    return t?.poet ? t.poet.poems.filter((p) => p.slug !== t.slug) : [];
  });
  protected upNext = computed(() => (this.isCurrent() ? this.player.upNext().slice(0, 12) : []));
  protected next = computed(() => this.player.upNext()[0]);

  constructor() {
    effect(() => {
      const t = this.track();
      if (!t) {
        if (this.notFound()) this.title.set('Poem not found');
        return;
      }
      this.title.set(`${t.title} — ${t.author}`);
      untracked(() => this.player.open(t));
    });
    effect(() => {
      const poet = this.track()?.poet;
      this.bioExcerpt.set('');
      if (!poet?.hasBio) return;
      this.catalog.bio(poet).then((b) => {
        if (!b || this.track()?.poet !== poet) return;
        this.bioExcerpt.set(excerpt(b.bio[0] ?? '', 280));
      });
    });
  }

  protected readMins(seconds: number) {
    return seconds < 30 ? '<1' : String(Math.round(seconds / 60));
  }

  protected toggle() {
    const t = this.track();
    if (!t) return;
    if (!this.isCurrent()) this.player.play(t);
    else this.player.toggle();
  }

  protected like() {
    const liked = this.library.toggleLike(this.slug());
    this.ui.toast(liked ? 'Added to Liked Poems' : 'Removed from Liked Poems', 'heart');
  }

  protected share() {
    const t = this.track();
    if (t) this.ui.share(`${t.title} — ${t.author}`, `poem/${t.slug}`);
  }
}

/** Whole sentences up to roughly `max` characters. */
function excerpt(text: string, max: number): string {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let out = '';
  for (const s of sentences) {
    if (out && out.length + s.length > max) break;
    out += s;
  }
  return (out || text.slice(0, max)).trim() + (out.length < text.length ? ' …' : '');
}
