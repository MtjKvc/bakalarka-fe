import { TestBed } from '@angular/core/testing';

import { TeacherContext } from './teacher-context';

describe('TeacherContext', () => {
  let service: TeacherContext;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TeacherContext);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
