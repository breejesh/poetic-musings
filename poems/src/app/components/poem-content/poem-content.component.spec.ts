import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoemContentComponent } from './poem-content.component';

describe('PoemContentComponent', () => {
  let component: PoemContentComponent;
  let fixture: ComponentFixture<PoemContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoemContentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoemContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
