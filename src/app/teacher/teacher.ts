import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
import { TeacherContextService } from '../services/teacher-context';
import { SearchBarModalComponent, StudentSearchResult } from './components/search-bar-modal/search-bar-modal';
import { Logs } from './components/logs/logs'; 
import { LoggerService } from '../services/logger';

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

  currentUser: UserInfo & { id: number | null } = { 
    id: null,
    meno: 'Používateľ',
    rola: 'USER'
  }
  
  activeView: string = 'default';
  
  router = inject(Router);
  http = inject(HttpClient);
  public contextService = inject(TeacherContextService);

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

  constructor() { }

  ngOnInit(): void {
    this.logger.log('Teacher component initialized');
    const token = localStorage.getItem('auth_token');

    if (token) {
      const userData = this.parseJwt(token);
      if (userData) {
        this.logger.log('User data parsed from token', { role: userData.role || userData.roleEnum, name: userData.fullName || userData.sub });
        if (userData.id) this.currentUser.id = userData.id;
        
        if (userData.fullName) {
           this.currentUser.meno = userData.fullName;
        } else if (userData.sub) {
           this.currentUser.meno = userData.sub;
        }
        
        if (userData.role) {
           this.currentUser.rola = userData.role;
        } else if (userData.roleEnum) {
           this.currentUser.rola = userData.roleEnum;
        }
      }
    }

    this.contextService.loadCurrentExercises().subscribe({
      next: () => this.logger.log('Context exercises loaded'),
      error: (err) => this.logger.error('Chyba pri načítaní cvičení:', err)
    });
  }

  private parseJwt(token: string): any {
    try {
      
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      this.logger.error('Failed to parse JWT', e);
      return null;
    }
  }

  onLogout(): void {
    this.logger.log('User logging out');
    localStorage.clear();
    this.router.navigate(['login']);
  }

  onToggleSidebar(): void {
      this.isSidebarOpen = !this.isSidebarOpen;
      this.logger.log(`Sidebar toggled. Open: ${this.isSidebarOpen}`);
  }
  
  onStudentFound(student: StudentSearchResult): void {
      this.logger.log('Student found via search', student.id);
      this.selectedStudent = student;
  }

  onModalClose(): void {
      this.selectedStudent = null;
  }

  onSearchIconClick(): void {
      this.logger.log('Mobile search icon clicked');
  }

  isAdmin(): boolean {
    return this.currentUser.rola?.toUpperCase() === 'ADMIN';
  }
  isTeacher(): boolean {
    return this.currentUser.rola?.toUpperCase() === 'TEACHER';
  }
  isHelper(): boolean {
    return this.currentUser.rola?.toUpperCase() === 'HELPER';
  }
  
  onSidebarButtonClick(buttonLabel: string): void {
    this.logger.log(`Navigating to view: ${buttonLabel}`);
    this.activeView = buttonLabel; 
    this.isSidebarOpen = false; 
  }
}