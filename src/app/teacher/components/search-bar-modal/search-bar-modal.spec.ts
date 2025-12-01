import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchBarModal } from './search-bar-modal';

describe('SearchBarModal', () => {
  let component: SearchBarModal;
  let fixture: ComponentFixture<SearchBarModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchBarModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
