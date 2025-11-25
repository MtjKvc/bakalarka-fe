import { TestBed } from '@angular/core/testing';

import { GenericCRUD } from './generic-crud';

describe('GenericCRUD', () => {
  let service: GenericCRUD;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenericCRUD);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
