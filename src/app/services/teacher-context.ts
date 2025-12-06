import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

// --- INTERFACE PRE CVIČENIA ---
export interface ExerciseSession {
  exerciseId: number;
  sessionDay: string;
  startTime: string;
}

// --- NOVÝ INTERFACE PRE BLOKY ---
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
  private apiUrl = 'http://localhost:8080/api/v1';

  // ==========================================
  // ČASŤ 1: CVIČENIA (DOCHÁDZKA / HEADERY)
  // ==========================================
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

  // ==========================================
  // ČASŤ 2: BLOKY (GRADING / HODNOTENIE)
  // ==========================================
  
  // Zoznam všetkých blokov (pre tlačidlá v Grading)
  blocks = signal<Block[]>([]);

  // Aktuálne vybraté blok (podľa ktorého sa filtruje tabuľka)
  selectedBlock = signal<Block | null>(null);

  // Načíta bloky z API
  loadBlocks() {
    return this.http.get<Block[]>(`${this.apiUrl}/block`).pipe(
      tap(data => {
        this.blocks.set(data);
        // Automaticky vyberieme prvý blok, ak nejaký existuje a nič nie je vybraté
        if (data.length > 0 && !this.selectedBlock()) {
          this.selectedBlock.set(data[0]);
        }
      })
    );
  }

  // Prepnutie bloku
  selectBlock(block: Block) {
    this.selectedBlock.set(block);
  }
}