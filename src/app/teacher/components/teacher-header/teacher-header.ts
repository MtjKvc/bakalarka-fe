import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ExerciseSession } from '../../../services/teacher-context';
import { SearchBar } from '../search-bar/search-bar';

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

  @Input() currentUser!: UserInfo;
  @Input() isSidebarOpen: boolean = false;
  @Input() exercises: ExerciseSession[] = [];
  @Input() activeExerciseId: number | undefined = undefined;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() exerciseSelected = new EventEmitter<ExerciseSession>();
  @Output() studentFound = new EventEmitter<any>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onLogoutClick() {
    this.logout.emit();
  }

  onExerciseClick(ex: ExerciseSession) {
    this.exerciseSelected.emit(ex);
  }

  onStudentSelected(student: any) {
    this.studentFound.emit(student);
  }
}