import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm6 } from './blok2-asm6';

describe('Blok2Asm6', () => {
  let component: Blok2Asm6;
  let fixture: ComponentFixture<Blok2Asm6>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm6]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm6);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
