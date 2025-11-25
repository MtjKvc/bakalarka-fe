import { Component, Input, Output, EventEmitter } from '@angular/core'; 
import { CommonModule, NgClass } from '@angular/common'; 

// Rozhrania (Interfaces)
interface UserInfo { 
    meno: string; 
    rola: string; 
} 

interface SidebarButton { 
  label: string; 
  isAdminOnly: boolean;  
} 

@Component({ 
  selector: 'app-teacher-sidebar', 
  standalone: true, 
  imports: [CommonModule, NgClass], 
  templateUrl: './teacher-side-bar.html', 
  styleUrl: './teacher-side-bar.css'  
}) 
export class TeacherSidebarComponent { 

  // VSTUPY (Inputs) z rodičovského komponentu
  @Input() currentUser!: UserInfo; 
  @Input() isSidebarOpen: boolean = false; 
  @Input() sidebarButtons: SidebarButton[] = []; 

  // KĽÚČOVÝ VSTUP: Uchováva názov aktívneho pohľadu na zvýraznenie tlačidla
  @Input() activeView!: string;  // <-- Používa sa v template

  // VÝSTUPY (Outputs) pre komunikáciu s rodičovským komponentom
  @Output() logout = new EventEmitter<void>(); 
  @Output() buttonClick = new EventEmitter<string>(); 

  /** * Kontroluje, či má používateľ rolu ADMIN. 
   */ 
  isAdmin(): boolean { 
    // Bezpečná kontrola na null/undefined a veľké písmená
    return this.currentUser?.rola?.toUpperCase() === 'ADMIN';
  } 

  /** * Odošle udalosť kliknutia na tlačidlo späť rodičovi s názvom pohľadu.
   */ 
  onButtonClick(label: string): void { 
    this.buttonClick.emit(label);
  } 

  /** * Odošle udalosť odhlásenia späť rodičovi.
   */ 
  onLogoutClick(): void { 
    this.logout.emit(); 
  } 
}