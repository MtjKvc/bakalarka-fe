import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm10 } from './blok2-asm10';

describe('Blok2Asm10', () => {
  let component: Blok2Asm10;
  let fixture: ComponentFixture<Blok2Asm10>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm10]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm10);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
