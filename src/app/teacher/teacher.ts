import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';

import { AuthService } from '../core/auth/auth.service';
import { TeacherContextService } from '../core/context/teacher-context.service';
import { LoggerService } from '../core/logging/logger.service';

import { TeacherHeader, UserInfo } from './components/teacher-header/teacher-header';
import { TeacherSidebarComponent } from './components/teacher-side-bar/teacher-side-bar';
import { Blocks } from './components/blocks/blocks';
import { AssignmentsComponent } from './components/assignments/assignments';
import { ExercisesComponent } from './components/exercises/exercises';
import { UsersComponent } from './components/users/users';
import { Students } from './components/students/students';
import { StudentUploadComponent } from './components/student-upload/student-upload';
import { Attendance } from './components/attendance/attendance';
import { GradingComponent } from './components/grading/grading';
import { SearchBarModalComponent } from './components/search-bar-modal/search-bar-modal';
import { Logs } from './components/logs/logs';
import { SidebarButton } from '../shared/models/interfaces';
import { StudentBasic } from '../shared/models/interfaces';
import { SubstitutionComponent } from './components/substitution/substitution';

@Component({
  selector: 'app-teacher',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    TeacherHeader,
    Blocks,
    TeacherSidebarComponent,
    AssignmentsComponent,
    ExercisesComponent,
    UsersComponent,
    Students,
    StudentUploadComponent,
    Attendance,
    GradingComponent,
    Logs,
    SubstitutionComponent,
    SearchBarModalComponent
  ],
  templateUrl: './teacher.html',
})
export class Teacher implements OnInit {
  private logger = inject(LoggerService);
  private authService = inject(AuthService);
  public contextService = inject(TeacherContextService);

  public currentUser: UserInfo & { id: number | null } = {
    id: null,
    meno: 'Používateľ',
    rola: 'USER'
  }

  public isSidebarOpen: boolean = false;
  public selectedStudent: StudentBasic | null = null;

  public sidebarButtons: SidebarButton[] = [
    { label: 'Dochádzka', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false, },
    { label: 'Hodnotenie', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: true, },
    { label: 'Záznamy', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false, },
    { label: 'Suplovanie', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false, },
    { label: 'Nahrávanie', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false, },
    { label: 'Používatelia', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false, },
    { label: 'Študenti', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false, },
    { label: 'Cvičenia', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false, },
    { label: 'Bloky', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false, },
    { label: 'Zadania', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false, },
  ];

  private searchBarConfig = {
    isAdminAvailable: true,
    isTeacherAvailable: true,
    isHelperAvailable: false
  };

  public get isSearchBarVisible(): boolean {
    if (this.isAdmin()) return this.searchBarConfig.isAdminAvailable;
    if (this.isTeacher()) return this.searchBarConfig.isTeacherAvailable;
    if (this.isHelper()) return this.searchBarConfig.isHelperAvailable;
    return false;
  }

  public ngOnInit(): void {
    this.logger.log('Teacher component initialized');

    const user = this.authService.currentUserValue;

    this.currentUser = {
      id: user.id,
      meno: user.meno,
      rola: user.rola
    };

    this.contextService.loadCurrentExercises().subscribe({
      next: () => this.logger.log('Context exercises loaded'),
      error: (err) => this.logger.error('Chyba pri načítaní cvičení:', err)
    });
  }

  public get activeView(): string {
    return this.contextService.activeView();
  }

  public onLogout(): void {
    this.contextService.clearContext();
    this.authService.logout();
  }

  public onToggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  public onStudentFound(student: StudentBasic): void {
    this.selectedStudent = student;
  }

  public onModalClose(): void {
    this.selectedStudent = null;
  }

  public onSearchIconClick(): void {
    this.logger.log('Mobile search icon clicked');
  }

  public isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  public isTeacher(): boolean {
    return this.authService.hasRole('TEACHER');
  }

  public isHelper(): boolean {
    return this.authService.hasRole('HELPER');
  }

  public onSidebarButtonClick(buttonLabel: string): void {
    this.contextService.setActiveView(buttonLabel);
    this.isSidebarOpen = false;
  }
}