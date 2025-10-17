import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm8 } from './blok2-asm8';

describe('Blok2Asm8', () => {
  let component: Blok2Asm8;
  let fixture: ComponentFixture<Blok2Asm8>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm8]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm8);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
