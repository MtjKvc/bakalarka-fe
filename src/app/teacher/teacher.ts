import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, TitleCasePipe } from '@angular/common'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// Importy komponentov
import { TeacherHeader, UserInfo } from './components/teacher-header/teacher-header'; 
import { TeacherSidebarComponent } from './components/teacher-side-bar/teacher-side-bar';
import { Blocks } from './components/blocks/blocks';
// !!! PRIDANÉ: Import Assignments komponentu (upravte cestu podľa reality)
import { AssignmentsComponent } from './components/assignments/assignments'; 

interface SidebarButton {
  label: string;
  isAdminOnly: boolean; 
}

interface UserDetails {
  meno: string;
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
    AssignmentsComponent // !!! PRIDANÉ: Registrácia komponentu
  ],
  templateUrl: './teacher.html', 
  styleUrl: './teacher.css' 
})
export class Teacher implements OnInit {

  currentUser: UserInfo & { id: number | null } = { 
    id: null as number | null,
    meno: 'Používateľ',
    rola: 'USER'
  }
  
  activeView: string = 'default';
  
  router = inject(Router);
  http = inject(HttpClient);
  isSidebarOpen: boolean = false; 

  sidebarButtons: SidebarButton[] = [
    { label: 'student upload', isAdminOnly: false },
    { label: 'dochadzka', isAdminOnly: false },
    { label: 'users', isAdminOnly: true },
    { label: 'students', isAdminOnly: true },
    { label: 'exercises', isAdminOnly: true },
    { label: 'blocks', isAdminOnly: true },
    { label: 'assigments', isAdminOnly: true }, // Pozor na preklep, v HTML ho musíme zhodovať
  ];

  constructor() { }

  ngOnInit(): void {
    const role = localStorage.getItem('user_role');
    const id = localStorage.getItem('user_id');
    const sub = localStorage.getItem('user_sub');

    if (role) this.currentUser.rola = role;
    if (id) this.currentUser.id = parseInt(id, 10);
    if (sub) this.currentUser.meno = sub;

    if (this.currentUser.id) {
      this.http.get<UserDetails>(`http://localhost:8080/api/v1/user?id=${this.currentUser.id}`)
        .subscribe({
          next: (userDetails) => {
            this.currentUser.meno = userDetails.meno;
          },
          error: (err) => console.error(err)
        });
    }
  }

  onLogout(): void {
    this.isSidebarOpen = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_sub');
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
    return this.currentUser.rola.toUpperCase() === 'ADMIN';
  }
  
  onSidebarButtonClick(buttonLabel: string): void {
    this.activeView = buttonLabel; 
    this.isSidebarOpen = false; 
  }
}