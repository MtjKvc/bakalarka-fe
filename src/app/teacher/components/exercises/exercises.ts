import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LongPressDirective } from '../../../shared/long-press/long-press';
import { environment } from '../../../../environments/environment';

interface DayOption {
  label: string;
  date: string;
}

interface Exercise {
  id: number;
  firstSessionDate: string;
  startTime: string; 
  roomEnum: string;
  availableDays?: DayOption[]; 
}

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, LongPressDirective],
  templateUrl: './exercises.html', 
  styleUrl: './exercises.css'
})
export class ExercisesComponent implements OnInit, AfterViewChecked {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false;

  private exercisesApiUrl = `${environment.apiUrl}/api/v1/exercise`;
  private roomsApiUrl = `${environment.apiUrl}/api/v1/enum/room`; 

  public exercises: Exercise[] = [];
  public availableRooms: string[] = []; 
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null;

  public directions: { [key: string]: 'asc' | 'desc' } = {
    firstSessionDate: 'asc',
    startTime: 'asc'
  };

  public isCreateModalOpen: boolean = false;
  public isDeleteConfirmModalOpen: boolean = false;
  public newExercise = { firstSessionDate: '', startTime: '', roomEnum: '' };
  public exerciseToDelete: Exercise | null = null;
  public deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';

  editingId: number | null = null;
  editingField: 'startTime' | null = null;
  editingValue: string = '';

  private dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

  ngOnInit(): void {
    this.loadData();
  }

  onSort(field: string): void {
    this.directions[field] = this.directions[field] === 'asc' ? 'desc' : 'asc';
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading = true; 
    this.error = null;
    try {
      const dateDir = this.directions['firstSessionDate'];
      const timeDir = this.directions['startTime'];
      const url = `${this.exercisesApiUrl}?sort=firstSessionDate,${dateDir}&sort=startTime,${timeDir}`;

      const [exercisesData, roomsData] = await Promise.all([
        lastValueFrom(this.http.get<Exercise[]>(url)),
        lastValueFrom(this.http.get<string[]>(this.roomsApiUrl))
      ]);

      this.exercises = (exercisesData || []).map(e => {
        if (e.firstSessionDate?.includes('T')) {
          e.firstSessionDate = e.firstSessionDate.split('T')[0];
        }
        e.availableDays = this.calculateWorkDaysForWeek(e.firstSessionDate);
        return e;
      });
      
      this.availableRooms = roomsData || [];
    } catch (err) {
      this.error = 'Chyba pri načítaní dát.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  calculateWorkDaysForWeek(currentDateStr: string): DayOption[] {
    if (!currentDateStr) return [];
    const date = new Date(currentDateStr);
    const day = date.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    const options: DayOption[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      options.push({ label: this.dayNames[d.getDay()], date: d.toISOString().split('T')[0] });
    }
    return options;
  }


  async onDateChange(ex: Exercise, newDate: string): Promise<void> {
    if (ex.firstSessionDate === newDate) return;
    await this.updateExercise(ex.id, { ...ex, firstSessionDate: newDate }, "Dátum zmenený.");
  }

  async onRoomChange(ex: Exercise, newRoom: string): Promise<void> {
    if (ex.roomEnum === newRoom) return;
    await this.updateExercise(ex.id, { ...ex, roomEnum: newRoom }, "Miestnosť zmenená.");
  }

  async updateExercise(id: number, payload: any, msg: string) {
    this.isLoading = true;
    try {
      await lastValueFrom(this.http.put(`${this.exercisesApiUrl}/${id}`, payload));
      this.message = msg;
      setTimeout(() => this.message = null, 3000);
      await this.loadData();
    } catch {
      this.error = "Chyba pri aktualizácii.";
      await this.loadData();
    } finally { this.isLoading = false; }
  }

  onCreateExerciseClick(): void {
    this.newExercise = { firstSessionDate: '', startTime: '', roomEnum: '' };
    this.isCreateModalOpen = true;
  }

  onCloseModal(): void { this.isCreateModalOpen = false; }

  async onSubmitNewExercise(): Promise<void> {
    if (!this.newExercise.firstSessionDate || !this.newExercise.startTime || !this.newExercise.roomEnum) return;
    this.isLoading = true;
    const time = this.newExercise.startTime.length === 5 ? this.newExercise.startTime + ":00" : this.newExercise.startTime;
    const payload = { exercises: [{ ...this.newExercise, startTime: time }] };
    try {
      await lastValueFrom(this.http.post(this.exercisesApiUrl, payload));
      this.onCloseModal();
      await this.loadData();
    } catch { this.error = "Chyba pri vytváraní."; } finally { this.isLoading = false; }
  }

  onDeleteExerciseClick(exercise: Exercise): void {
    this.exerciseToDelete = exercise;
    this.deleteConfirmationInput = '';
    this.isDeleteConfirmModalOpen = true;
  }

  onCloseDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.exerciseToDelete = null;
  }

  async onConfirmDelete(): Promise<void> {
    if (this.deleteConfirmationInput !== this.deleteConfirmText) return;
    this.isLoading = true;
    try {
      await lastValueFrom(this.http.delete(`${this.exercisesApiUrl}/${this.exerciseToDelete?.id}`));
      this.onCloseDeleteConfirmModal();
      await this.loadData();
    } catch { this.error = "Chyba pri mazaní."; } finally { this.isLoading = false; }
  }

  isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }
  
  onCellEdit(ex: Exercise, field: 'startTime'): void {
    this.editingId = ex.id;
    this.editingField = field;
    this.editingValue = ex.startTime.substring(0, 5);
    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  async onCellSave(ex: Exercise): Promise<void> {
    if (this.editingId === null) return;
    if (this.editingValue === ex.startTime.substring(0, 5)) { this.editingId = null; return; }
    const time = this.editingValue.length === 5 ? this.editingValue + ":00" : this.editingValue;
    await this.updateExercise(ex.id, { ...ex, startTime: time }, "Čas zmenený.");
    this.editingId = null;
  }

  ngAfterViewChecked(): void {
    if (this.shouldFocus && this.editInputsRef.first) {
      this.shouldFocus = false;
      setTimeout(() => this.editInputsRef.first.nativeElement.focus(), 10);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
      this.onCloseDeleteConfirmModal();
    }
  }
}