import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Manuals } from './manuals';

describe('Manuals', () => {
  let component: Manuals;
  let fixture: ComponentFixture<Manuals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manuals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Manuals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
