import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm9 } from './blok2-asm9';

describe('Blok2Asm9', () => {
  let component: Blok2Asm9;
  let fixture: ComponentFixture<Blok2Asm9>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm9]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm9);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
