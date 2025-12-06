import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm3 } from './blok2-asm3';

describe('Blok2Asm3', () => {
  let component: Blok2Asm3;
  let fixture: ComponentFixture<Blok2Asm3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm3]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm3);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
