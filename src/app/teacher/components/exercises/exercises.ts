import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule, NgForm } from '@angular/forms';
import { LongPressDirective } from '../../../shared/directives/long-press.directive';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { ApiResponse } from '../../../shared/models/interfaces';

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
  imports: [CommonModule, FormsModule, LongPressDirective, CloseOnEscDirective],
  templateUrl: './exercises.html',
})
export class ExercisesComponent implements OnInit, AfterViewChecked {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);

  @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;

  @ViewChild('errorContainer') set errorContent(content: ElementRef) {
    if (content) {
      content.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      content.nativeElement.focus({ preventScroll: true });
    }
  }

  @ViewChild('exerciseForm') exerciseForm!: NgForm;

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
  public readonly deleteConfirmText: string = 'CONFIRM';

  public editingId: number | null = null;
  public editingField: 'startTime' | null = null;
  public editingValue: string = '';

  private dayNames = ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'];

  public ngOnInit(): void {
    this.logger.log('ExercisesComponent initialized');
    this.initialLoad();
  }

  private async initialLoad(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      await Promise.all([
        this.loadRooms(),
        this.loadExercises()
      ]);
    } catch (err) {
      this.logger.error('Failed to init data', err);
      this.error = 'Chyba pri inicializácii dát.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadRooms(): Promise<void> {
    try {
      const roomsData = await lastValueFrom(this.http.get<string[]>(this.roomsApiUrl));
      this.availableRooms = roomsData || [];
      this.logger.log(`Loaded ${this.availableRooms.length} rooms`);
    } catch (err) {
      this.logger.error('Failed to load rooms', err);
      throw err;
    }
  }

  private async loadExercises(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const dateDir = this.directions['firstSessionDate'];
      const timeDir = this.directions['startTime'];
      const url = `${this.exercisesApiUrl}?sort=firstSessionDate,${dateDir}&sort=startTime,${timeDir}`;

      const response = await lastValueFrom(this.http.get<Exercise[]>(url));
      const exercisesData = response || [];

      this.exercises = (exercisesData || []).map(e => {
        if (e.firstSessionDate?.includes('T')) {
          e.firstSessionDate = e.firstSessionDate.split('T')[0];
        }
        e.availableDays = this.calculateWorkDaysForWeek(e.firstSessionDate);
        return e;
      });

      this.logger.log(`Loaded ${this.exercises.length} exercises`);
    } catch (err) {
      this.logger.error('Failed to load exercises', err);
      this.error = 'Chyba pri načítaní cvičení.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  public onSort(field: string): void {
    this.directions[field] = this.directions[field] === 'asc' ? 'desc' : 'asc';
    this.logger.log(`Sorting by ${field} ${this.directions[field]}`);
    this.loadExercises();
  }



  private calculateWorkDaysForWeek(currentDateStr: string): DayOption[] {
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
      options.push({
        label: this.dayNames[i + 1],
        date: d.toISOString().split('T')[0]
      });
    }

    return options;
  }

  public async onDateChange(ex: Exercise, newDate: string): Promise<void> {
    if (ex.firstSessionDate === newDate) return;
    await this.updateExercise(ex.id, { ...ex, firstSessionDate: newDate }, "Dátum zmenený.");
  }

  public async onRoomChange(ex: Exercise, newRoom: string): Promise<void> {
    if (ex.roomEnum === newRoom) return;
    await this.updateExercise(ex.id, { ...ex, roomEnum: newRoom }, "Miestnosť zmenená.");
  }

  private async updateExercise(id: number, payload: Exercise, msg: string) {
    const { availableDays, ...dataToSend } = payload;
    this.isLoading = true;
    try {
      this.logger.log(`Updating exercise ID ${id}`, dataToSend);
      await lastValueFrom(this.http.put<Exercise>(`${this.exercisesApiUrl}/${id}`, dataToSend));
      this.message = msg;
      setTimeout(() => this.message = null, 3000);
      await this.loadExercises();
    } catch (err) {
      this.logger.error(`Update failed for ID ${id}`, err);
      this.error = "Chyba pri aktualizácii.";
      await this.loadExercises();
    } finally { this.isLoading = false; }
  }

  public onCreateExerciseClick(): void {
    this.newExercise = { firstSessionDate: '', startTime: '', roomEnum: '' };
    this.isCreateModalOpen = true;
  }

  public onCloseModal(): void { this.isCreateModalOpen = false; }

  public async onSubmitNewExercise(): Promise<void> {
    this.error=null;
    this.message=null;
    if (this.exerciseForm.invalid) {
      this.exerciseForm.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const time = this.newExercise.startTime.length === 5 ? this.newExercise.startTime + ":00" : this.newExercise.startTime;
    const payload = { exercises: [{ ...this.newExercise, startTime: time }] };
    try {
      await lastValueFrom(this.http.post<Exercise[]>(this.exercisesApiUrl, payload));
      this.logger.log('New exercise created', payload);
      this.onCloseModal();
      await this.loadExercises();
    } catch (err) {
      this.logger.error('Create failed', err);
      this.error = "Chyba pri vytváraní.";
    } finally { this.isLoading = false; }
  }

  public onDeleteExerciseClick(exercise: Exercise): void {
    this.exerciseToDelete = exercise;
    this.deleteConfirmationInput = '';
    this.isDeleteConfirmModalOpen = true;
  }

  public onCloseDeleteConfirmModal(): void {
    this.isDeleteConfirmModalOpen = false;
    this.exerciseToDelete = null;
  }

  public async onConfirmDelete(): Promise<void> {
    if (this.deleteConfirmationInput !== this.deleteConfirmText) return;
    const id = this.exerciseToDelete?.id;
    this.isLoading = true;
    try {
      await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.exercisesApiUrl}/${id}`));
      this.logger.warn(`Exercise deleted: ID ${id}`);
      this.onCloseDeleteConfirmModal();
      await this.loadExercises();
    } catch (err) {
      this.logger.error(`Delete failed for ID ${id}`, err);
      this.error = "Chyba pri mazaní.";
    } finally { this.isLoading = false; }
  }

  public isEditing(id: number, field: string): boolean { return this.editingId === id && this.editingField === field; }

  public onCellEdit(ex: Exercise, field: 'startTime'): void {
    this.editingId = ex.id;
    this.editingField = field;
    this.editingValue = ex.startTime.substring(0, 5);
    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  public async onCellSave(ex: Exercise): Promise<void> {
    if (this.editingId === null) return;
    if (this.editingValue === ex.startTime.substring(0, 5)) { this.editingId = null; return; }
    const time = this.editingValue.length === 5 ? this.editingValue + ":00" : this.editingValue;
    await this.updateExercise(ex.id, { ...ex, startTime: time }, "Čas zmenený.");
    this.editingId = null;
  }

  public ngAfterViewChecked(): void {
    if (this.shouldFocus && this.editInputsRef.first) {
      this.shouldFocus = false;
      setTimeout(() => this.editInputsRef.first.nativeElement.focus(), 10);
    }
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCloseModal();
      this.onCloseDeleteConfirmModal();
    }
  }
}