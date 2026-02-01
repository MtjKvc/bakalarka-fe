import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common'; 
import { Router } from '@angular/router';

import { AuthService } from '../core/auth/auth.service';
import { TeacherContextService } from '../core/context/teacher-context';
import { LoggerService } from '../core/logging/logger';

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
import { SearchBarModalComponent, StudentSearchResult } from './components/search-bar-modal/search-bar-modal';
import { Logs } from './components/logs/logs'; 

interface SidebarButton {
  label: string;
  isAdminAvailable: boolean;
  isTeacherAvailable: boolean;
  isHelperAvailable: boolean;
}

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
    SearchBarModalComponent
  ],
  templateUrl: './teacher.html', 
  styleUrl: './teacher.css' 
})
export class Teacher implements OnInit {
  private logger = inject(LoggerService);
  private authService = inject(AuthService);
  public contextService = inject(TeacherContextService);
  private router = inject(Router);

  currentUser: UserInfo & { id: number | null } = { 
    id: null,
    meno: 'Používateľ',
    rola: 'USER'
  }
  
  activeView: string = 'default';
  isSidebarOpen: boolean = false; 
  selectedStudent: StudentSearchResult | null = null;

  sidebarButtons: SidebarButton[] = [
    { label: 'nahrávanie', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false,},    
    { label: 'dochádzka', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false,},     
    { label: 'používatelia', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false,},   
    { label: 'študenti', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false,},       
    { label: 'cvičenia', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false,},       
    { label: 'bloky', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false,},          
    { label: 'zadania', isAdminAvailable: true, isTeacherAvailable: false, isHelperAvailable: false,},        
    { label: 'hodnotenie', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: true,},
    { label: 'záznamy', isAdminAvailable: true, isTeacherAvailable: true, isHelperAvailable: false,},  
  ];

  searchBarConfig = {
    isAdminAvailable: true,
    isTeacherAvailable: true,
    isHelperAvailable: false
  };

  get isSearchBarVisible(): boolean {
    if (this.isAdmin()) return this.searchBarConfig.isAdminAvailable;
    if (this.isTeacher()) return this.searchBarConfig.isTeacherAvailable;
    if (this.isHelper()) return this.searchBarConfig.isHelperAvailable;
    return false;
  }

  constructor() { }

  ngOnInit(): void {
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

  onLogout(): void {
    this.contextService.clearContext();
    this.authService.logout();
  }

  onToggleSidebar(): void {
      this.isSidebarOpen = !this.isSidebarOpen;
  }
  
  onStudentFound(student: StudentSearchResult): void {
      this.selectedStudent = student;
  }

  onModalClose(): void {
      this.selectedStudent = null;
  }

  onSearchIconClick(): void {
      this.logger.log('Mobile search icon clicked');
  }

  isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  isTeacher(): boolean {
    return this.authService.hasRole('TEACHER');
  }

  isHelper(): boolean {
    return this.authService.hasRole('HELPER');
  }
  
  onSidebarButtonClick(buttonLabel: string): void {
    this.activeView = buttonLabel; 
    this.isSidebarOpen = false; 
  }
}