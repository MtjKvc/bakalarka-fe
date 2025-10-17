import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm2 } from './blok2-asm2';

describe('Blok2Asm2', () => {
  let component: Blok2Asm2;
  let fixture: ComponentFixture<Blok2Asm2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
