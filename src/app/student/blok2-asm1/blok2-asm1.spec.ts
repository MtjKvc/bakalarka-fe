import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2Asm1 } from './blok2-asm1';

describe('Blok2Asm1', () => {
  let component: Blok2Asm1;
  let fixture: ComponentFixture<Blok2Asm1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2Asm1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2Asm1);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
