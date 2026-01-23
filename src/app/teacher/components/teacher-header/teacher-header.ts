import { CommonModule } from '@angular/common';
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core'; 
import { ExerciseSession } from '../../../services/teacher-context';
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
  currentUser = input.required<UserInfo>();
  isSidebarOpen = input<boolean>(false); 

  exercises = input<ExerciseSession[]>([]);
  activeExerciseId = input<number | undefined>(undefined);

  toggleSidebar = output<void>();
  logout = output<void>();
  searchIconClick = output<void>();
  
  exerciseSelected = output<ExerciseSession>();

  studentFound = output<any>();
  
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

  onStudentSelected(student: any) {
    this.studentFound.emit(student);
  }
}