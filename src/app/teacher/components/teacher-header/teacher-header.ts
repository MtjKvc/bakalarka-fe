import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { ExerciseSession } from '../../../core/context/teacher-context.service';
import { SearchBar } from '../search-bar/search-bar';
import { LoggerService } from '../../../core/logging/logger.service';

export interface UserInfo {
  meno: string;
  rola: string;
}

export interface StudentSearchResult {
  id: number;
  aisId?: number;
  fullName: string;
}

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule, SearchBar],
  templateUrl: './teacher-header.html',
})
export class TeacherHeader {
  private logger = inject(LoggerService);

  @Input() public currentUser!: UserInfo;
  @Input() public isSidebarOpen: boolean = false;
  @Input() public exercises: ExerciseSession[] = [];
  @Input() public activeExerciseId: number | undefined = undefined;
  @Input() public showSearch: boolean = false;

  @Output() public toggleSidebar = new EventEmitter<void>();
  @Output() public logout = new EventEmitter<void>();
  @Output() public exerciseSelected = new EventEmitter<ExerciseSession>();
  @Output() public studentFound = new EventEmitter<StudentSearchResult>();

  public onToggleSidebar() {
    this.logger.log('Toggling sidebar');
    this.toggleSidebar.emit();
  }

  public onLogoutClick() {
    this.logger.log('Logout clicked');
    this.logout.emit();
  }

  public onExerciseClick(ex: ExerciseSession) {
    this.logger.log('Exercise clicked', ex);
    this.exerciseSelected.emit(ex);
  }

  public onStudentSelected(student: StudentSearchResult) {
    this.logger.log('Student found via header search', student);
    this.studentFound.emit(student);
  }
}