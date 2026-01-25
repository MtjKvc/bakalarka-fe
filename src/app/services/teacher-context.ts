import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/api/v1`;

  exercises = signal<ExerciseSession[]>([]);
  selectedExercise = signal<ExerciseSession | null>(null);

  loadCurrentExercises() {
    return this.http.get<ExerciseSession[]>(`${this.apiUrl}/user-exercise/current`).pipe(
      tap(data => {
        this.exercises.set(data);
        if (data.length > 0 && !this.selectedExercise()) {
          this.selectedExercise.set(data[0]);
        }
      })
    );
  }

  selectExercise(exercise: ExerciseSession) {
    this.selectedExercise.set(exercise);
  }

  blocks = signal<Block[]>([]);

  selectedBlock = signal<Block | null>(null);

  loadBlocks() {
    return this.http.get<Block[]>(`${this.apiUrl}/block`).pipe(
      tap(data => {
        this.blocks.set(data);
        if (data.length > 0 && !this.selectedBlock()) {
          this.selectedBlock.set(data[0]);
        }
      })
    );
  }

  selectBlock(block: Block) {
    this.selectedBlock.set(block);
  }
}