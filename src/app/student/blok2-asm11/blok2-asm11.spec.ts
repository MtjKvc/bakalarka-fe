import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm11 } from './blok2-asm11';

describe('Blok2Asm11', () => {
  let component: Blok2Asm11;
  let fixture: ComponentFixture<Blok2Asm11>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm11]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm11);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
