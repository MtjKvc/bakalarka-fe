import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok1 } from './blok-1';

describe('Blok1', () => {
  let component: Blok1;
  let fixture: ComponentFixture<Blok1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok1);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
