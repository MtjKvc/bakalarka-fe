import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LongPressDirective } from '../../../shared/long-press/long-press';

interface Exercise {
  id: number;
  firstSessionDate: string;
  startTime: string; 
  roomEnum: string;
}

interface NewExerciseForm {
  firstSessionDate: string;
  startTime: string;
  roomEnum: string;
}

interface UpdateExercisePayload {
  firstSessionDate: string;
  startTime: string;
  roomEnum: string;
}

interface DayOption {
  label: string;
  date: string;
}

type EditableField = 'startTime';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, LongPressDirective],
  // !!! OPRAVENÉ: Musí odkazovať na exercises.html
  templateUrl: './exercises.html', 
  styleUrl: './exercises.css'
})
export class ExercisesComponent implements OnInit, AfterViewChecked {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false;
  private isSaving: boolean = false;

  private exercisesApiUrl = 'http://localhost:8080/api/v1/exercise';
  private roomsApiUrl = 'http://localhost:8080/api/v1/enum/room'; 

  public exercises: Exercise[] = [];
  public availableRooms: string[] = []; 
  
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null;

  public isCreateModalOpen: boolean = false;
  public newExercise: NewExerciseForm = { firstSessionDate: '', startTime: '', roomEnum: '' };

  editingId: number | null = null;
  editingField: EditableField | null = null;
  editingValue: string = '';

  isDeleteConfirmModalOpen: boolean = false;
  exerciseToDelete: Exercise | null = null;
  deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';

  private dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true; this.error = null;
    try {
        const [exercisesData, roomsData] = await Promise.all([
            lastValueFrom(this.http.get<Exercise[]>(this.exercisesApiUrl)),
            lastValueFrom(this.http.get<string[]>(this.roomsApiUrl))
        ]);

        const rawExercises = exercisesData || [];
        this.exercises = rawExercises.map(e => {
            if (e.firstSessionDate && e.firstSessionDate.includes('T')) {
                e.firstSessionDate = e.firstSessionDate.split('T')[0];
            }
            return e;
        });

        this.exercises.sort((a, b) => a.id - b.id);
        this.availableRooms = roomsData || [];
        this.cdr.detectChanges();
    } catch (err: any) { 
        console.error(err);
        this.error = 'Nepodarilo sa načítať dáta.'; 
    } finally { 
        this.isLoading = false; 
    }
  }

  getWorkDaysForWeek(currentDateStr: string): DayOption[] {
      if (!currentDateStr) return [];
      const cleanDateStr = currentDateStr.split('T')[0]; 
      const date = new Date(cleanDateStr);
      if (isNaN(date.getTime())) return []; 

      const day = date.getDay(); 
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      
      const monday = new Date(date);
      monday.setDate(date.getDate() + diffToMonday);

      const options: DayOption[] = [];
      for (let i = 0; i < 5; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const isoDate = d.toISOString().split('T')[0];
          const label = this.dayNames[i + 1]; 
          options.push({ label: label, date: isoDate });
      }
      return options;
  }

  async onDateChange(exercise: Exercise, newDate: string): Promise<void> {
      if (exercise.firstSessionDate === newDate) return;
      this.updateExercise(exercise.id, {
          firstSessionDate: newDate,
          startTime: exercise.startTime,
          roomEnum: exercise.roomEnum
      }, () => { exercise.firstSessionDate = newDate; }, "Deň zmenený.");
  }

  async onRoomChange(exercise: Exercise, newRoom: string): Promise<void> {
      if (exercise.roomEnum === newRoom) return;
      this.updateExercise(exercise.id, {
          firstSessionDate: exercise.firstSessionDate,
          startTime: exercise.startTime,
          roomEnum: newRoom
      }, () => { exercise.roomEnum = newRoom; }, `Miestnosť zmenená na ${newRoom}.`);
  }

  async updateExercise(id: number, payload: UpdateExercisePayload, onSuccess: () => void, successMsg: string) {
      this.isLoading = true; this.error = null; this.message = null;
      try {
          await lastValueFrom(this.http.put(`${this.exercisesApiUrl}/${id}`, payload));
          onSuccess();
          this.message = successMsg;
      } catch (err: any) {
          this.error = "Chyba pri aktualizácii.";
          await this.loadData();
      } finally { this.isLoading = false; }
  }

  onCreateExerciseClick(): void {
    this.newExercise = { firstSessionDate: '', startTime: '', roomEnum: '' };
    this.isCreateModalOpen = true; 
    this.error = null; this.message = null;
  }
  onCloseModal(): void { this.isCreateModalOpen = false; }

  async onSubmitNewExercise(): Promise<void> {
    if (!this.newExercise.firstSessionDate || !this.newExercise.startTime || !this.newExercise.roomEnum) return;
    this.isLoading = true;
    
    let timeToSend = this.newExercise.startTime;
    if (timeToSend.length === 5) timeToSend += ":00";

    const payload = { 
        exercises: [{
            firstSessionDate: this.newExercise.firstSessionDate,
            startTime: timeToSend, 
            roomEnum: this.newExercise.roomEnum
        }]
    };

    try {
        await lastValueFrom(this.http.post(this.exercisesApiUrl, payload));
        this.message = `Cvičenie vytvorené.`;
        this.onCloseModal();
        await this.loadData(); 
    } catch (err: any) { 
        this.error = "Chyba pri vytváraní cvičenia."; 
    } finally { 
        this.isLoading = false; 
    }
  }

  onDeleteExerciseClick(exercise: Exercise): void { 
      this.exerciseToDelete = exercise; 
      this.deleteConfirmationInput = ''; 
      this.isDeleteConfirmModalOpen = true; 
      this.error = null; this.message = null;
  }
  onCloseDeleteConfirmModal(): void { 
      this.isDeleteConfirmModalOpen = false; 
      this.exerciseToDelete = null; 
      this.deleteConfirmationInput = '';
  }
  async onConfirmDelete(): Promise<void> {
      if (!this.exerciseToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
      this.isLoading = true; 
      const idToDelete = this.exerciseToDelete.id;
      this.onCloseDeleteConfirmModal();
      try {
          await lastValueFrom(this.http.delete(`${this.exercisesApiUrl}/${idToDelete}`));
          this.exercises = this.exercises.filter(a => a.id !== idToDelete);
          this.message = `Cvičenie vymazané.`;
      } catch (err: any) { 
          console.error(err);
          this.error = "Chyba: Nepodarilo sa vymazať cvičenie."; 
      } finally { 
          this.isLoading = false; 
      }
  }

  isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }
  
  onCellEdit(exercise: Exercise, field: EditableField): void {
      if (this.isSaving) return;
      this.editingId = exercise.id; this.editingField = field; 
      this.editingValue = exercise[field].substring(0, 5); 
      this.shouldFocus = true; this.cdr.detectChanges();
  }

  async onCellSave(exercise: Exercise): Promise<void> {
      this.shouldFocus = false;
      if (this.isSaving || this.editingId === null) return;
      const newValue = String(this.editingValue).trim();
      const oldValue = exercise.startTime.substring(0, 5);

      if (newValue === oldValue) { this.editingId = null; return; }

      this.isSaving = true; this.isLoading = true;
      const timeToSend = newValue.length === 5 ? newValue + ":00" : newValue;

      const payload = {
          firstSessionDate: exercise.firstSessionDate,
          startTime: timeToSend,
          roomEnum: exercise.roomEnum
      };

      try {
          await lastValueFrom(this.http.put(`${this.exercisesApiUrl}/${exercise.id}`, payload));
          const index = this.exercises.findIndex(e => e.id === exercise.id);
          if (index !== -1) this.exercises[index].startTime = payload.startTime;
          this.message = `Čas aktualizovaný.`;
      } catch (err: any) { 
          this.error = "Chyba pri aktualizácii času."; 
          await this.loadData(); 
      } finally { 
          this.editingId = null; this.editingField = null; 
          this.isLoading = false; this.isSaving = false; 
      }
  }

  ngAfterViewChecked(): void {
    if (this.shouldFocus && this.editInputsRef.first) {
        this.shouldFocus = false; 
        setTimeout(() => this.editInputsRef.first.nativeElement.focus(), 10);
    }
  }
  onBackdropClick(event: MouseEvent): void {
      if (event.target === event.currentTarget) { this.onCloseModal(); this.onCloseDeleteConfirmModal(); }
  }
}