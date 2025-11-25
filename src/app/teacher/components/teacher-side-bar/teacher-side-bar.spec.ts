import { ComponentFixture, TestBed } from '@angular/core/testing';

import {TeacherSidebarComponent, } from './teacher-side-bar';

describe('TeacherSideBar', () => {
  let component: TeacherSidebarComponent;
  let fixture: ComponentFixture<TeacherSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeacherSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
