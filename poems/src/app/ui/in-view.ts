import { Directive, ElementRef, OnDestroy, OnInit, inject, input, output } from '@angular/core';

/** Emits whenever the host scrolls into view (used for incremental list rendering). */
@Directive({ selector: '[appInView]' })
export class InView implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  readonly margin = input('600px');
  readonly appInView = output<void>();
  private observer?: IntersectionObserver;

  ngOnInit() {
    this.observer = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && this.appInView.emit(),
      { root: (this.el.nativeElement as HTMLElement).closest('main'), rootMargin: this.margin() },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
