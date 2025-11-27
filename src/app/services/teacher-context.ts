import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

// Definícia, ako vyzerá cvičenie (Interface)
export interface ExerciseSession {
  exerciseId: number;
  sessionDay: string; // napr. "Pondelok"
  startTime: string;  // napr. "08:00"
}

@Injectable({
  providedIn: 'root'
})
export class TeacherContextService {
  private http = inject(HttpClient);

  // 1. Zoznam všetkých cvičení (pre Header)
  exercises = signal<ExerciseSession[]>([]);

  // 2. Aktuálne vybraté cvičenie (pre Tabuľky/Bloky)
  selectedExercise = signal<ExerciseSession | null>(null);

  // Stiahne dáta z API
  loadCurrentExercises() {
    return this.http.get<ExerciseSession[]>('http://localhost:8080/api/v1/user-exercise/current').pipe(
      tap(data => {
        this.exercises.set(data);
        // Ak sme ešte nič nevybrali a prišli nejaké dáta, vyberieme automaticky prvé
        if (data.length > 0 && !this.selectedExercise()) {
          this.selectedExercise.set(data[0]);
        }
      })
    );
  }

  // Túto metódu zavolá Header, keď klikneš na tlačidlo
  selectExercise(exercise: ExerciseSession) {
    this.selectedExercise.set(exercise);
  }
}