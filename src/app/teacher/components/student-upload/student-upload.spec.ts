import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentUpload } from './student-upload';

describe('StudentUpload', () => {
  let component: StudentUpload;
  let fixture: ComponentFixture<StudentUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentUpload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
