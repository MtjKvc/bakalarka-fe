import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm12 } from './blok2-asm12';

describe('Blok2Asm12', () => {
  let component: Blok2Asm12;
  let fixture: ComponentFixture<Blok2Asm12>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm12]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm12);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
