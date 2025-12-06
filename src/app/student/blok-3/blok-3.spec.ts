import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok3 } from './blok-3';

describe('Blok3', () => {
  let component: Blok3;
  let fixture: ComponentFixture<Blok3>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok3]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok3);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
