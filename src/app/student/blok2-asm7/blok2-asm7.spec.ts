import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm7 } from './blok2-asm7';

describe('Blok2Asm7', () => {
  let component: Blok2Asm7;
  let fixture: ComponentFixture<Blok2Asm7>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm7]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm7);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
