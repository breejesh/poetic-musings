import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoemPlayerComponent } from './poem-player.component';

describe('PoemPlayerComponent', () => {
  let component: PoemPlayerComponent;
  let fixture: ComponentFixture<PoemPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoemPlayerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoemPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
