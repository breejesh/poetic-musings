import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoemWidgetComponent } from './poem-widget.component';

describe('PoemWidgetComponent', () => {
  let component: PoemWidgetComponent;
  let fixture: ComponentFixture<PoemWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoemWidgetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoemWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
