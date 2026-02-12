import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap, tap, catchError, map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { LongPressDirective } from '../../../shared/directives/long-press.directive';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { SearchBarModalComponent, } from '../search-bar-modal/search-bar-modal';
import { StudentBasic, ApiResponse, Exercise } from '../../../shared/models/interfaces';

interface Student {
  id: number;
  relationshipId: number;
  aisId: number;
  fullName: string;
  exerciseId?: number | null;
}


interface StudentExerciseResponse {
  id: number;
  student: {
    id: number;
    aisId: number;
    fullName: string;
  };
  exercise: {
    id: number;
    firstSessionDate: string;
    startTime: string;
    roomEnum: string;
  };
}

type NewStudent = Omit<Student, 'id' | 'relationshipId' | 'exerciseId'>;

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, LongPressDirective, DatePipe, CloseOnEscDirective, SearchBarModalComponent],
  templateUrl: './students.html',
  styleUrl: './students.css'
})
export class Students implements OnInit, AfterViewChecked, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);

  @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;

  private shouldFocus: boolean = false;
  public isSaving: boolean = false;

  private studentsApiUrl = `${environment.apiUrl}/api/v1/student`;
  private exercisesApiUrl = `${environment.apiUrl}/api/v1/exercise`;
  private studentExerciseApiUrl = `${environment.apiUrl}/api/v1/student-exercise`;

  public students: Student[] = [];
  public exercises: Exercise[] = [];

  public searchName: string = '';
  public searchAisId: string = '';

  public sortField: string = 'id';
  public sortDirection: 'asc' | 'desc' = 'asc';

  private searchSubject = new Subject<void>();
  private searchSubscription?: Subscription;

  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null;

  public isCreateStudentModalOpen: boolean = false;
  public novyStudent: NewStudent = { aisId: 0, fullName: '' };
  public selectedExerciseId: number | null = null;

  public editingStudentId: number | null = null;
  public editingField: keyof Student | null = null;
  public editingValue: string | number | null = '';

  public isDeleteConfirmModalOpen: boolean = false;
  public studentToDelete: Student | null = null;
  public deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';

  public isDetailModalOpen: boolean = false;
  public selectedStudentForDetail: StudentBasic | null = null;

  public ngOnInit(): void {
    this.logger.log('Students component initialized');
    this.loadExercises();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      tap(() => {
        this.logger.log('Search triggered');
        this.isLoading = true;
        this.error = null;
        this.cdr.markForCheck();
      }),
      switchMap(() => {
        let params = new HttpParams();

        if (this.searchName.trim()) {
          params = params.set('fullName', this.searchName.trim());
        }

        if (this.searchAisId.trim()) {
          params = params.set('aisId', this.searchAisId.trim());
        }

        let sortParam = 'id,asc';
        if (this.sortField === 'fullName') {
          sortParam = `StudentEntity.fullName,${this.sortDirection}`;
        } else if (this.sortField === 'aisId') {
          sortParam = `StudentEntity.aisId,${this.sortDirection}`;
        } else if (this.sortField === 'exercise') {
          sortParam = `ExerciseEntity.id,${this.sortDirection}`;
        } else {
          sortParam = `id,${this.sortDirection}`;
        }
        params = params.set('sort', sortParam);

        this.logger.log(`Fetching students with params: ${params.toString()}`);
        
        return this.http.get<StudentExerciseResponse[]>(this.studentExerciseApiUrl, { params }).pipe(
          map(response => response || []),
          catchError((err) => {
            this.logger.error('Failed to load students', err);
            this.error = "Nepodarilo sa načítať dáta.";
            return [];
          })
        );
      })
    ).subscribe(data => {
      this.logger.log(`Loaded ${data ? data.length : 0} students`);
      this.processResponseData(data);
      this.isLoading = false;
      this.cdr.detectChanges();
    });

    this.triggerSearch();
  }

  public ngOnDestroy(): void {
    this.logger.log('Students component destroyed');
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete();
  }

  public openStudentDetail(student: Student): void {
    this.selectedStudentForDetail = {
      id: student.id,
      fullName: student.fullName,
      aisId: student.aisId
    };
    this.isDetailModalOpen = true;
  }

  public onCloseDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedStudentForDetail = null;
  }

  public onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.logger.log(`Sorting changed to ${field} ${this.sortDirection}`);
    this.triggerSearch();
  }

  public triggerSearch(): void {
    this.searchSubject.next();
  }

  public onSearchInputChange(): void {
    this.triggerSearch();
  }

  private processResponseData(data: StudentExerciseResponse[]): void {
    if (!data) {
      this.students = [];
      return;
    }

    this.students = data.map(item => {
      return {
        id: item.student.id,
        relationshipId: item.id,
        aisId: item.student.aisId,
        fullName: item.student.fullName,
        exerciseId: item.exercise ? item.exercise.id : null
      };
    });
  }

  private async loadExercises(): Promise<void> {
    try {
      const response = await lastValueFrom(this.http.get<Exercise[]>(this.exercisesApiUrl));
      
      this.exercises = (response || []).map(e => {
        if (e.firstSessionDate?.includes('T')) e.firstSessionDate = e.firstSessionDate.split('T')[0];
        return e;
      }).sort((a, b) => a.id - b.id);
      
      this.logger.log(`Loaded ${this.exercises.length} exercises`);
    } catch (err) {
      this.logger.error('Failed to load exercises', err);
      this.error = "Chyba načítania cvičení.";
    }
  }

  public async onExerciseChange(student: Student, newExerciseId: string | number): Promise<void> {
    const newId = Number(newExerciseId);
    if (student.exerciseId === newId) return;
    this.isLoading = true;
    try {
      this.logger.log(`Moving student ${student.id} to exercise ${newId}`);
      await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.studentExerciseApiUrl}/${student.relationshipId}`, {
        studentId: student.id,
        exerciseId: newId
      }));
      student.exerciseId = newId;
      this.message = `Študent presunutý.`;
    } catch (err) {
      this.logger.error('Failed to change exercise', err);
      this.error = `Zmena zlyhala.`;
      this.triggerSearch();
    }
    finally { this.isLoading = false; }
  }

  public async onSubmitNovyStudent(): Promise<void> {
    if (this.selectedExerciseId === null) return;
    this.isLoading = true;
    try {
      this.logger.log('Creating new student', this.novyStudent);
      await lastValueFrom(this.http.post<ApiResponse<unknown>>(this.studentsApiUrl, {
        exerciseId: Number(this.selectedExerciseId),
        students: [{ aisId: Number(this.novyStudent.aisId), fullName: this.novyStudent.fullName.trim() }]
      }));
      this.onCloseStudentModal();
      this.triggerSearch();
    } catch (err: unknown) {
      this.logger.error('Error creating student', err);
      this.error = "Chyba pri vytváraní.";
    }
    finally { this.isLoading = false; }
  }

  public async onConfirmDelete(): Promise<void> {
    if (!this.studentToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
    this.isLoading = true;
    try {
      this.logger.log(`Deleting student ${this.studentToDelete.id}`);
      await lastValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.studentsApiUrl}/${this.studentToDelete.id}`));
      this.onCloseDeleteConfirmModal();
      this.triggerSearch();
    } catch (err) {
      this.logger.error('Error deleting student', err);
      this.error = `Chyba pri mazaní.`;
    }
    finally { this.isLoading = false; }
  }

  public onCreateStudentClick(): void { this.novyStudent = { aisId: 0, fullName: '' }; this.selectedExerciseId = this.exercises[0]?.id || null; this.isCreateStudentModalOpen = true; }
  public onCloseStudentModal(): void { this.isCreateStudentModalOpen = false; }
  public onDeleteStudentClick(student: Student): void { this.studentToDelete = student; this.deleteConfirmationInput = ''; this.isDeleteConfirmModalOpen = true; }
  public onCloseDeleteConfirmModal(): void { this.isDeleteConfirmModalOpen = false; }
  public onBackdropClick(event: MouseEvent): void { if (event.target === event.currentTarget) { this.onCloseStudentModal(); this.onCloseDeleteConfirmModal(); } }

  public isEditing(id: number, field: string): boolean { return this.editingStudentId === id && this.editingField === field; }
  public onCellEdit(student: Student, field: keyof Student): void {
    if (this.isSaving) return;
    this.editingStudentId = student.id;
    this.editingField = field;
    this.editingValue = student[field] as string | number;
    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  public async onCellSave(student: Student): Promise<void> {
    this.shouldFocus = false;
    if (this.isSaving || this.editingStudentId === null || this.editingField === null) return;

    const field = this.editingField as 'aisId' | 'fullName';
    const rawValue = String(this.editingValue).trim();

    let payloadAisId = student.aisId;
    let payloadFullName = student.fullName;

    if (field === 'aisId') {
      const parsedId = Number(rawValue);
      if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId < 0) {
        this.error = "Chyba: AIS ID musí byť celé kladné číslo!";
        return;
      }
      if (parsedId === student.aisId) {
        this.editingStudentId = null;
        this.editingField = null;
        return;
      }
      payloadAisId = parsedId;
    } else if (field === 'fullName') {
      if (!rawValue) {
        this.error = "Chyba: Meno nesmie byť prázdne!";
        return;
      }
      if (rawValue === student.fullName) {
        this.editingStudentId = null;
        this.editingField = null;
        return;
      }
      payloadFullName = rawValue;
    }

    this.isSaving = true;
    this.error = null;

    try {
      this.logger.log(`Updating student ${student.id} field ${field}`);
      const payload = { aisId: payloadAisId, fullName: payloadFullName };

      await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.studentsApiUrl}/${student.id}`, payload));
      
      student.aisId = payloadAisId;
      student.fullName = payloadFullName;
      this.message = "Údaje uložené.";
    } catch (err) {
      this.logger.error('Update failed', err);
      this.error = "Uloženie zlyhalo. Skontrolujte formát.";
    }
    finally { this.editingStudentId = null; this.isSaving = false; }
  }

  public ngAfterViewChecked(): void { if (this.shouldFocus && this.editInputsRef.first) { this.shouldFocus = false; setTimeout(() => this.editInputsRef.first?.nativeElement.focus(), 10); } }
}