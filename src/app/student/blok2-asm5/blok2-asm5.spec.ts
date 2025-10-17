import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm5 } from './blok2-asm5';

describe('Blok2Asm5', () => {
  let component: Blok2Asm5;
  let fixture: ComponentFixture<Blok2Asm5>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm5]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm5);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
