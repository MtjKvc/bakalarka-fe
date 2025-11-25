import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core'; 

// Definujeme rozhranie pre vstupné dáta
export interface UserInfo {
  meno: string;
  rola: string;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-header.html', 
  styleUrl: './teacher-header.css', // Ak máte samostatné CSS
  // Používame OnPush, lebo komponent prijíma len vstupy (inputs)
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherHeader {
// --- VSTUPY (Inputs) ---
  currentUser = input.required<UserInfo>();
  isSidebarOpen = input<boolean>(false); 


  // --- VÝSTUPY (Outputs) ---
  toggleSidebar = output<void>();
  logout = output<void>();
  /** Emituje vyhľadávací dotaz z inputu po stlačení Enter. */
  searchSubmit = output<string>();
  /** Emituje kliknutie na ikonu lupy (mobilná akcia). */
  searchIconClick = output<void>();


  // --- Metódy na spracovanie udalostí z template ---
  
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onLogoutClick() {
    this.logout.emit();
  }

  onSearchIconClick() {
    this.searchIconClick.emit();
  }
  
  onSearchSubmit(event: Event) {
     const inputElement = event.target as HTMLInputElement;
     this.searchSubmit.emit(inputElement.value); 
  }
}
