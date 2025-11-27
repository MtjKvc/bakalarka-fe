import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, TitleCasePipe } from '@angular/common'; 
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
import { TeacherContextService } from '../services/teacher-context';


interface SidebarButton {
  label: string;
  isAdminOnly: boolean; 
}

@Component({
  selector: 'app-teacher',
  standalone: true,
  imports: [
    CommonModule,
    NgIf, 
    TitleCasePipe, 
    TeacherHeader,
    Blocks, 
    TeacherSidebarComponent,
    AssignmentsComponent,
    ExercisesComponent,
    UsersComponent,
    Students,
    StudentUploadComponent,
    Attendance
  ],
  templateUrl: './teacher.html', 
  styleUrl: './teacher.css' 
})
export class Teacher implements OnInit {

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

 sidebarButtons: SidebarButton[] = [
    { label: 'nahrávanie', isAdminOnly: false },    
    { label: 'dochádzka', isAdminOnly: false },     
    { label: 'používatelia', isAdminOnly: true },   
    { label: 'študenti', isAdminOnly: true },       
    { label: 'cvičenia', isAdminOnly: true },       
    { label: 'bloky', isAdminOnly: true },          
    { label: 'zadania', isAdminOnly: true },        
    { label: 'hodnotenie', isAdminOnly: true }, 
  ];

  constructor() { }

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');

    if (token) {
      const userData = this.parseJwt(token);
      console.log('Dekódovaný token:', userData);

      if (userData) {
        // 1. ID
        if (userData.id) this.currentUser.id = userData.id;

        // 2. MENO (V tokene je "fullName")
        if (userData.fullName) {
           this.currentUser.meno = userData.fullName;
        }

        // 3. ROLA (V tokene je "role") - TOTO BOLA CHYBA
        if (userData.role) {
           this.currentUser.rola = userData.role;
        } else if (userData.roleEnum) {
           // Fallback, ak by sa to zmenilo
           this.currentUser.rola = userData.roleEnum;
        }
      }
    } else {
        // Fallback na localStorage len ak nemáme token
        const storedRole = localStorage.getItem('user_role');
        if (storedRole) this.currentUser.rola = storedRole;
    }

    // Načítanie cvičení
    this.contextService.loadCurrentExercises().subscribe({
      error: (err) => console.error('Chyba pri načítaní cvičení:', err)
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
      console.error('Chyba pri parsovaní tokenu:', e);
      return null;
    }
  }

  // --- Ostatné metódy ---

  onLogout(): void {
    this.isSidebarOpen = false;
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  onToggleSidebar(): void {
      this.isSidebarOpen = !this.isSidebarOpen;
  }
  
  onSearchSubmit(query: string): void {
      console.log(`Vyhľadávanie: "${query}"`);
  }

  onSearchIconClick(): void {
      console.log('Open mobile search');
  }

  isAdmin(): boolean {
    return this.currentUser.rola?.toUpperCase() === 'ADMIN';
  }
  
  onSidebarButtonClick(buttonLabel: string): void {
    this.activeView = buttonLabel; 
    this.isSidebarOpen = false; 
  }
}