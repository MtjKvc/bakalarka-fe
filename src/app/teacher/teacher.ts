import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf, TitleCasePipe } from '@angular/common'; // Pridávam NgIf a TitleCasePipe
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// Predpokladané štruktúry - musia byť importované
import { TeacherHeader, UserInfo } from './components/teacher-header/teacher-header'; 
import { TeacherSidebarComponent } from './components/teacher-side-bar/teacher-side-bar';
import { Blocks } from './components/blocks/blocks';


// Rozhranie (pre konzistenciu)
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
    NgIf, // Pre *ngIf
    TitleCasePipe, // Pre | titlecase
    TeacherHeader,
    Blocks, 
    TeacherSidebarComponent,
  ],
  templateUrl: './teacher.html', 
  // V reálnej aplikácii by toto bol súbor 'teacher.component.css', 
  // ale pre jednoduchosť necháme názov 'teacher.css'
  styleUrl: './teacher.css' 
})
export class Teacher implements OnInit {

  // Aktuálny používateľ
  currentUser: UserInfo & { id: number | null } = { 
    id: null as number | null,
    meno: 'Používateľ',
    rola: 'USER'
  }
  
  // KĽÚČOVÝ STAV: Drží aktívny pohľad
  activeView: string = 'default';
  
  router = inject(Router);
  http = inject(HttpClient);
  isSidebarOpen: boolean = false; // Stav pre bočný panel

  // Definovanie tlačidiel sidebaru
  sidebarButtons: SidebarButton[] = [
    { label: 'student upload', isAdminOnly: false },
    { label: 'dochadzka', isAdminOnly: false },
    { label: 'users', isAdminOnly: true },
    { label: 'students', isAdminOnly: true },
    { label: 'exercises', isAdminOnly: true },
    { label: 'blocks', isAdminOnly: true },
    { label: 'assigments', isAdminOnly: true },
  ];

  constructor() { }

  ngOnInit(): void {
    // Simulácia načítania používateľa z localStorage
    const role = localStorage.getItem('user_role');
    const id = localStorage.getItem('user_id');
    const sub = localStorage.getItem('user_sub');

    if (role) {
      this.currentUser.rola = role;
    }
    if (id) {
      this.currentUser.id = parseInt(id, 10);
    }
    if (sub) {
      this.currentUser.meno = sub;
    }

    // Simulácia načítania detailov používateľa cez HTTP
    if (this.currentUser.id) {
      // NOTE: Toto je len simulácia, pretože nebeží server na localhoste.
      // Pre funkčnosť to v Immersive prostredí nemusí prebehnúť úspešne, ale logika je správna.
      this.http.get<UserDetails>(`http://localhost:8080/api/v1/user?id=${this.currentUser.id}`)
        .subscribe({
          next: (userDetails) => {
            this.currentUser.meno = userDetails.meno;
            console.log('Načítané detaily používateľa:', this.currentUser);
          },
          error: (err) => {
            console.error('Nepodarilo sa načítať detaily používateľa:', err);
          }
        });
    } else {
      console.log('Používateľ bez ID, detaily sa nenahrali:', this.currentUser);
    }
  }

  /**
   * Reaguje na udalosť odhlásenia.
   */
  onLogout(): void {
    this.isSidebarOpen = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_sub');

    // Použi konzolové logy namiesto alert()
    console.log('Udalosť odhlásenia zachytená a spracovaná. Presmerovanie na /login.');
    this.router.navigate(['/login']);
  }

  /**
   * Reaguje na udalosť prepnutia bočného panelu.
   */
  onToggleSidebar(): void {
      this.isSidebarOpen = !this.isSidebarOpen;
  }
  
  /**
   * Spracuje vyhľadávací dotaz odoslaný z hlavičky (desktop).
   */
  onSearchSubmit(query: string): void {
      console.log(`Vyhľadávanie spustené s dotazom: "${query}"`);
      // Použi konzolové logy namiesto alert()
      // alert(`Vyhľadávanie spustená s dotazom: "${query}"`);
  }

  /**
   * Spracuje kliknutie na ikonu vyhľadávania (mobil).
   */
  onSearchIconClick(): void {
      // Použi konzolové logy namiesto alert()
      console.log('Akcia: Otvorenie full-screen vyhľadávania pre mobil.');
  }

  isAdmin(): boolean {
    return this.currentUser.rola.toUpperCase() === 'ADMIN';
  }
  
  /**
   * KĽÚČOVÁ METÓDA: Reaguje na kliknutie tlačidla zo TeacherSidebarComponent.
   */
  onSidebarButtonClick(buttonLabel: string): void {
    // 1. Aktualizuje activeView, čo zmení zvýraznenie v sidebare a obsah v main
    this.activeView = buttonLabel; 
    
    // 2. Zatvorí sidebar (pre mobilný režim)
    this.isSidebarOpen = false; 
    
    console.log(`Pohľad prepnutý na: ${buttonLabel}`);
    // console.log(`Klikli ste na: ${buttonLabel} (routovanie je vypnuté)`);
  }
}