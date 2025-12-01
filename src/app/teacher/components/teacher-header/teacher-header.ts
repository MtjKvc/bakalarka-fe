import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core'; 
import { ExerciseSession } from '../../../services/teacher-context';
// Importujeme tvoj nový komponent
import { SearchBar } from '../search-bar/search-bar';

export interface UserInfo {
  meno: string;
  rola: string;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [
    CommonModule,
    SearchBar
  ],
  templateUrl: './teacher-header.html', 
  styleUrl: './teacher-header.css', 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherHeader {
  // --- VSTUPY (Inputs) ---
  currentUser = input.required<UserInfo>();
  isSidebarOpen = input<boolean>(false); 

  exercises = input<ExerciseSession[]>([]);
  activeExerciseId = input<number | undefined>(undefined);

  // --- VÝSTUPY (Outputs) ---
  toggleSidebar = output<void>();
  logout = output<void>();
  searchIconClick = output<void>(); // Pre mobilnú lupu
  
  exerciseSelected = output<ExerciseSession>();

  // NOVÉ: Keď search-bar niečo nájde, pošleme to rodičovi (Teacherovi)
  studentFound = output<any>();

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

  onExerciseClick(ex: ExerciseSession) {
    this.exerciseSelected.emit(ex);
  }

  // Handler pre event z app-search-bar
  onStudentSelected(student: any) {
    this.studentFound.emit(student);
  }
}