import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm4 } from './blok2-asm4';

describe('Blok2Asm4', () => {
  let component: Blok2Asm4;
  let fixture: ComponentFixture<Blok2Asm4>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm4]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm4);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
