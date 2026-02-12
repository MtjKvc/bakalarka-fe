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

  private _exercises = signal<ExerciseSession[]>([]);
  private _selectedExercise = signal<ExerciseSession | null>(null);

  private _blocks = signal<Block[]>([]);
  private _selectedBlock = signal<Block | null>(null);

  public readonly exercises = this._exercises.asReadonly();
  public readonly selectedExercise = this._selectedExercise.asReadonly();

  public readonly blocks = this._blocks.asReadonly();
  public readonly selectedBlock = this._selectedBlock.asReadonly();

  public loadCurrentExercises() {
    return this.http.get<ExerciseSession[]>(`${this.apiUrl}/user-exercise/current`).pipe(
      tap(data => {
        this._exercises.set(data);

        const current = this._selectedExercise();
        const isCurrentValid = current && data.some(e => e.exerciseId === current.exerciseId);

        if (!isCurrentValid) {
          this._selectedExercise.set(data.length > 0 ? data[0] : null);
        }
      })
    );
  }

  public selectExercise(exercise: ExerciseSession | null) {
    this._selectedExercise.set(exercise);
  }

  public loadBlocks() {
    return this.http.get<Block[]>(`${this.apiUrl}/block`).pipe(
      tap(data => {
        this._blocks.set(data);

        const current = this._selectedBlock();
        const isCurrentValid = current && data.some(b => b.id === current.id);

        if (!isCurrentValid) {
          this._selectedBlock.set(data.length > 0 ? data[0] : null);
        }
      })
    );
  }

  public selectBlock(block: Block | null) {
    this._selectedBlock.set(block);
  }

  public clearContext() {
    this._exercises.set([]);
    this._selectedExercise.set(null);
    this._blocks.set([]);
    this._selectedBlock.set(null);
  }
}