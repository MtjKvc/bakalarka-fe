import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstExercise } from './first-exercise';

describe('FirstExercise', () => {
  let component: FirstExercise;
  let fixture: ComponentFixture<FirstExercise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstExercise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FirstExercise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
