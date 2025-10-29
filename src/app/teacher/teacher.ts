import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// 1. Router sa importuje tu, aby ho 'inject' poznal
import { Router } from '@angular/router';
// --- PRIDANÉ ---
// Importujeme HttpClient, aby sme mohli robiť GET požiadavky
import { HttpClient } from '@angular/common/http';

// Ak tvoj teacher.html používa [routerLink], odkomentuj toto:
// import { RouterLink } from '@angular/router'; 

// Ak tvoj teacher.html má <router-outlet>, odkomentuj toto:
// import { RouterOutlet } from '@angular/router';

// Definície typov
interface DynamicButton {
  label: string;
}
interface SidebarButton {
  label: string;
  isAdminOnly: boolean; 
}
// --- PRIDANÉ ---
// Definujeme si typ, ako vyzerajú dáta vracajúce sa z backendu
interface UserDetails {
  meno: string;
  priezvisko: string;
  // ...prípadne ďalšie polia ako email, atď.
}

// --- PRIDANÉ ---
// Definícia pre dáta z /api/v1/exercise
interface Exercise {
  id: number;
  dayOfWeek: string;    // "MONDAY"
  startTime: string;    // "20:07:30.489Z"
  endTime: string;
  roomEnum: string;
}


@Component({
  selector: 'app-teacher',
  standalone: true,
  imports: [
    CommonModule,
    // 2. Odstránili sme 'Router' odtiaľto.
    
    // Ak tvoj teacher.html používa [routerLink], odkomentuj toto:
    // RouterLink,
    
    // Ak tvoj teacher.html má <router-outlet>, odkomentuj toto:
    // RouterOutlet
  ],
  templateUrl: './teacher.html',
  styleUrl: './teacher.css'
})
export class Teacher implements OnInit {

  router = inject(Router);
  // --- PRIDANÉ ---
  // Vložíme (inject) HttpClient
  http = inject(HttpClient);
  isSidebarOpen: boolean = false; 

  // --- ZMENENÉ ---
  // Inicializujeme s predvolenými hodnotami, kým sa nenačítajú skutočné
  currentUser = {
    id: null as number | null,
    meno: 'Používateľ', // Načíta sa z 'user_sub' (email)
    priezvisko: '', // Token neobsahuje priezvisko
    rola: 'USER' // Predvolená rola, ak by načítanie zlyhalo
  };

  // --- ZMENENÉ ---
  // Teraz je to prázdne pole, naplní sa z backendu
  dynamicScheduleButtons: DynamicButton[] = [];

  // Kompletný zoznam bočných tlačidiel
  sidebarButtons: SidebarButton[] = [
    { label: 'student upload', isAdminOnly: false },
    { label: 'dochadzka', isAdminOnly: false },
    { label: 'users', isAdminOnly: true },
    { label: 'students', isAdminOnly: true },
    { label: 'cvika', isAdminOnly: true },
    { label: 'bloky', isAdminOnly: true },
    { label: 'ulohy', isAdminOnly: true },
  ];

  constructor() { }

  ngOnInit(): void {
    // --- UPRAVENÉ ---
    // Tu si Teacher "vyzdvihne" informácie, ktoré uložil Login
    const role = localStorage.getItem('user_role');
    const id = localStorage.getItem('user_id');
    const sub = localStorage.getItem('user_sub'); // 'sub' je zvyčajne email

    // 1. Nastavíme dočasné hodnoty, ktoré máme hneď k dispozícii
    if (role) {
      this.currentUser.rola = role;
    }
    if (id) {
      this.currentUser.id = parseInt(id, 10); // localStorage ukladá stringy
    }
    if (sub) {
      // Zatiaľ použijeme email ako meno
      this.currentUser.meno = sub;
    }

    // 2. Ak máme ID, zavoláme backend pre plné detaily používateľa
    if (this.currentUser.id) {
      // TOTO JE TEN HTTP GET CALL
      // Tvoj AuthInterceptor sa postará o pridanie tokenu do hlavičky
      this.http.get<UserDetails>(`http://localhost:8080/api/v1/user?id=${this.currentUser.id}`)
        .subscribe({
          next: (userDetails) => {
            // Úspech: Prepíšeme dočasné hodnoty skutočnými dátami
            this.currentUser.meno = userDetails.meno;
            this.currentUser.priezvisko = userDetails.priezvisko;
            console.log('Načítané detaily používateľa:', this.currentUser);
          },
          error: (err) => {
            // Chyba: Vypíšeme do konzoly, ale meno zostane ako email
            console.error('Nepodarilo sa načítať detaily používateľa:', err);
          }
        });
    } else {
      console.log('Používateľ bez ID, detaily sa nenahrali:', this.currentUser);
    }

    // --- PRIDANÉ ---
    // 3. Zavoláme funkciu na načítanie rozvrhu
    this.fetchScheduleButtons();
  }

  // --- PRIDANÉ ---
  /**
   * Načíta rozvrh cvičení z backendu a naplní pole dynamicScheduleButtons.
   */
  fetchScheduleButtons(): void {
    this.http.get<Exercise[]>('http://localhost:8080/api/v1/exercise')
      .subscribe({
        next: (sessions) => {
          // Prejdeme všetky sessions a zmeníme ich na formát, aký potrebuje tlačidlo
          this.dynamicScheduleButtons = sessions.map(session => {
            return {
              label: this.formatScheduleLabel(session.dayOfWeek, session.startTime)
            };
          });
          console.log('Načítané rozvrhové tlačidlá:', this.dynamicScheduleButtons);
        },
        error: (err) => {
          console.error('Nepodarilo sa načítať rozvrh:', err);
          // Môžeš tu nastaviť nejaké predvolené alebo chybové tlačidlá
          this.dynamicScheduleButtons = [{ label: 'Chyba načítania' }];
        }
      });
  }

  // --- PRIDANÉ ---
  /**
   * Pomocná funkcia na formátovanie labelu pre tlačidlo rozvrhu.
   * Premení ("MONDAY", "20:07:30...") na "pon 20:07"
   */
  private formatScheduleLabel(day: string, time: string): string {
    // 1. Preložíme deň
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'pon',
      'TUESDAY': 'ut',
      'WEDNESDAY': 'str',
      'THURSDAY': 'štv',
      'FRIDAY': 'pia',
      'SATURDAY': 'so',
      'SUNDAY': 'ne'
    };
    const translatedDay = dayMap[day.toUpperCase()] || day.substring(0, 3).toLowerCase();

    // 2. Sformátujeme čas (zoberieme len hodiny a minúty)
    const [hours, minutes] = time.split(':');
    const formattedTime = `${hours}:${minutes}`;

    return `${translatedDay} ${formattedTime}`;
  }


  onLogout(): void {
    this.isSidebarOpen = false; // Zatvorí menu

    // --- UPRAVENÉ ---
    // Musíme zmazať VŠETKY dáta, ktoré sme uložili
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_sub');

    this.router.navigate(['/login']);
  }

  isAdmin(): boolean {
    // --- UPRAVENÉ ---
    // Kontrola je teraz robustnejšia (nerobí rozdiel medzi 'admin' a 'ADMIN')
    return this.currentUser.rola.toUpperCase() === 'ADMIN';
  }

  onSidebarButtonClick(buttonLabel: string): void {
    alert(`Klikli ste na: ${buttonLabel} (routovanie je vypnuté)`);
    this.isSidebarOpen = false; 
  }

  onScheduleButtonClick(buttonLabel: string): void {
    alert(`Klikli ste na: ${buttonLabel} (routovanie je vypnuté)`);
  }

  // --- NOVÁ FUNKCIA PRE IKONU LUPY ---
  // --- OPRAVENÉ --- (bolo tu :void: void)
  onSearchClick(): void {
    alert('Klikli ste na lupu! (Tu sa môže otvoriť vyhľadávaní)');
  }
}

