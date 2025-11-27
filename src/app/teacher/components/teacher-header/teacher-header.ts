import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core'; 
import { ExerciseSession } from '../../../services/teacher-context';
// Importujeme interface zo servisy

export interface UserInfo {
  meno: string;
  rola: string;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-header.html', 
  styleUrl: './teacher-header.css', 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherHeader {
// --- VSTUPY (Inputs) ---
  currentUser = input.required<UserInfo>();
  isSidebarOpen = input<boolean>(false); 

  // NOVÉ: Zoznam cvičení a ID aktívneho cvičenia
  exercises = input<ExerciseSession[]>([]);
  activeExerciseId = input<number | undefined>(undefined);

  // --- VÝSTUPY (Outputs) ---
  toggleSidebar = output<void>();
  logout = output<void>();
  searchSubmit = output<string>();
  searchIconClick = output<void>();

  // NOVÉ: Emitujeme, keď sa klikne na cvičenie
  exerciseSelected = output<ExerciseSession>();

  // --- Metódy ---
  
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

  // NOVÉ: Handler pre kliknutie na tlačidlo
  onExerciseClick(ex: ExerciseSession) {
    this.exerciseSelected.emit(ex);
  }
}