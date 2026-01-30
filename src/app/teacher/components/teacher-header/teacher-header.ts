import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ExerciseSession } from '../../../services/teacher-context';
import { SearchBar } from '../search-bar/search-bar';
import { LoggerService } from '../../../services/logger';

export interface UserInfo {
  meno: string;
  rola: string;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule, SearchBar],
  templateUrl: './teacher-header.html',
  styleUrl: './teacher-header.css'
})
export class TeacherHeader {
  private logger = inject(LoggerService);

  @Input() currentUser!: UserInfo;
  @Input() isSidebarOpen: boolean = false;
  @Input() exercises: ExerciseSession[] = [];
  @Input() activeExerciseId: number | undefined = undefined;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() exerciseSelected = new EventEmitter<ExerciseSession>();
  @Output() studentFound = new EventEmitter<any>();

  onToggleSidebar() {
    this.logger.log('Toggling sidebar');
    this.toggleSidebar.emit();
  }

  onLogoutClick() {
    this.logger.log('Logout clicked');
    this.logout.emit();
  }

  onExerciseClick(ex: ExerciseSession) {
    this.logger.log('Exercise clicked', ex);
    this.exerciseSelected.emit(ex);
  }

  onStudentSelected(student: any) {
    this.logger.log('Student found via header search', student);
    this.studentFound.emit(student);
  }
}