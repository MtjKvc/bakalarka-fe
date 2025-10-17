import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Blok2 } from './blok-2';

describe('Blok2', () => {
  let component: Blok2;
  let fixture: ComponentFixture<Blok2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Blok2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Blok2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
