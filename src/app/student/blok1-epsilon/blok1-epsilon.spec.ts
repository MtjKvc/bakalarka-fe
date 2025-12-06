import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok1Epsilon } from './blok1-epsilon';

describe('Blok1Epsilon', () => {
  let component: Blok1Epsilon;
  let fixture: ComponentFixture<Blok1Epsilon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok1Epsilon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok1Epsilon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
