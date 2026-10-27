import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Poet } from '../core/models';
import { lifespan, plural } from '../core/format';
import { Portrait } from './portrait';

/** Circular "artist" tile. */
@Component({
  selector: 'app-poet-card',
  imports: [RouterLink, Portrait],
  template: `
    <a [routerLink]="['/poet', poet().slug]">
      <app-portrait class="pic" [poet]="poet()" size="lg" />
      <span class="name">{{ poet().name }}</span>
      <span class="sub">{{ sub() }}</span>
    </a>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    a {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem 1rem;
      border-radius: 16px;
      text-decoration: none;
      color: inherit;
      transition: background 0.2s;
    }
    a:hover { background: var(--hover); }
    a:hover .pic { --portrait-filter: grayscale(0) contrast(1); transform: scale(1.03); }
    .pic {
      width: 100%;
      margin-bottom: 0.6rem;
      box-shadow: var(--shadow-1);
      transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
      --monogram-size: 3rem;
    }
    .name {
      font: 500 1rem/1.25 var(--font-display);
      color: var(--ink);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sub {
      font: 400 0.78rem/1.3 var(--font-ui);
      color: var(--ink-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoetCard {
  readonly poet = input.required<Poet>();
  protected sub = computed(() => lifespan(this.poet().born, this.poet().died) || plural(this.poet().poems.length, 'poem'));
}
