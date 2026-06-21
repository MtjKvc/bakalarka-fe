import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExerciseSession {
  exerciseId: number;
  sessionDay: string;
  startTime: string;
}

export interface Block {
  id: number;
  name: string;
  maxPoints: number;
  requiredPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class TeacherContextService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1`;

  private readonly STORAGE_KEY_EXERCISE = 'teacher_selected_exercise_id';
  private readonly STORAGE_KEY_BLOCK = 'teacher_selected_block_id';
  private readonly STORAGE_KEY_VIEW = 'teacher_active_view';
  private readonly STORAGE_KEY_GRADING_MODE = 'teacher_grading_is_semester';
  private readonly STORAGE_KEY_ATTENDANCE_HISTORY = 'teacher_attendance_show_history';

  private _exercises = signal<ExerciseSession[]>([]);
  private _selectedExercise = signal<ExerciseSession | null>(null);

  private _activeView = signal<string>(localStorage.getItem(this.STORAGE_KEY_VIEW) || 'default');

  private _isSemesterMode = signal<boolean>(localStorage.getItem(this.STORAGE_KEY_GRADING_MODE) === 'true');

  private _showAttendanceHistory = signal<boolean>(localStorage.getItem(this.STORAGE_KEY_ATTENDANCE_HISTORY) === 'true');

  private _blocks = signal<Block[]>([]);
  private _selectedBlock = signal<Block | null>(null);

  public readonly exercises = this._exercises.asReadonly();
  public readonly selectedExercise = this._selectedExercise.asReadonly();

  public readonly blocks = this._blocks.asReadonly();
  public readonly selectedBlock = this._selectedBlock.asReadonly();
  public readonly activeView = this._activeView.asReadonly();
  public readonly isSemesterMode = this._isSemesterMode.asReadonly();
  public readonly showAttendanceHistory = this._showAttendanceHistory.asReadonly();

  public loadCurrentExercises() {
    return this.http.get<ExerciseSession[]>(`${this.apiUrl}/user-exercise/current`).pipe(
      tap(data => {
        this._exercises.set(data);


        const savedExerciseId = localStorage.getItem(this.STORAGE_KEY_EXERCISE);


        const exerciseToSelect = data.find(e => e.exerciseId.toString() === savedExerciseId) || (data.length > 0 ? data[0] : null);

        this._selectedExercise.set(exerciseToSelect);
      })
    );
  }

  public selectExercise(exercise: ExerciseSession | null) {
    this._selectedExercise.set(exercise);
    if (exercise) {
      localStorage.setItem(this.STORAGE_KEY_EXERCISE, exercise.exerciseId.toString());
    }
  }

  public setSemesterMode(isSemester: boolean): void {
  this._isSemesterMode.set(isSemester);
  localStorage.setItem(this.STORAGE_KEY_GRADING_MODE, isSemester.toString());

  if (isSemester) {
    this._selectedBlock.set(null);
  } else {
    const savedBlockId = localStorage.getItem(this.STORAGE_KEY_BLOCK);
    if (savedBlockId) {
      const block = this._blocks().find(b => b.id.toString() === savedBlockId);
      if (block) {
        this._selectedBlock.set(block);
      }
    } else if (this._blocks().length > 0) {
      this._selectedBlock.set(this._blocks()[0]);
    }
  }
}

public setShowAttendanceHistory(show: boolean): void {
  this._showAttendanceHistory.set(show);
  localStorage.setItem(this.STORAGE_KEY_ATTENDANCE_HISTORY, show.toString());
}

  public loadBlocks() {
    return this.http.get<Block[]>(`${this.apiUrl}/block`).pipe(
      tap(data => {
        this._blocks.set(data);

        const savedBlockId = localStorage.getItem(this.STORAGE_KEY_BLOCK);

        const blockToSelect = data.find(b => b.id.toString() === savedBlockId) || (data.length > 0 ? data[0] : null);

        this._selectedBlock.set(blockToSelect);
      })
    );
  }

  public selectBlock(block: Block | null) {
    this._selectedBlock.set(block);
    if (block) {
      localStorage.setItem(this.STORAGE_KEY_BLOCK, block.id.toString());
    }
  }

  private getInitialView(): string {
    const saved = localStorage.getItem(this.STORAGE_KEY_VIEW);
    return saved ? saved : 'default';
  }

  public setActiveView(view: string) {
    this._activeView.set(view);
    localStorage.setItem(this.STORAGE_KEY_VIEW, view);
  }

  public clearContext(): void {
localStorage.removeItem(this.STORAGE_KEY_EXERCISE);
    localStorage.removeItem(this.STORAGE_KEY_BLOCK);
    localStorage.removeItem(this.STORAGE_KEY_VIEW);
    localStorage.removeItem(this.STORAGE_KEY_ATTENDANCE_HISTORY);

    this._exercises.set([]);
    this._selectedExercise.set(null);
    this._blocks.set([]);
    this._selectedBlock.set(null);
    this._activeView.set('default');
    this._showAttendanceHistory.set(false);
  }
}