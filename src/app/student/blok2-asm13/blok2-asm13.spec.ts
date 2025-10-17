import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm13 } from './blok2-asm13';

describe('Blok2Asm13', () => {
  let component: Blok2Asm13;
  let fixture: ComponentFixture<Blok2Asm13>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm13]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm13);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
