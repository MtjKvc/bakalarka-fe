import { Component, OnInit, inject, ViewChildren, QueryList, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { HttpClient } from '@angular/common/http'; 
import { lastValueFrom } from 'rxjs'; 
import { FormsModule } from '@angular/forms'; 
import { LongPressDirective } from '../../../shared/long-press/long-press';

interface Student {
    id: number; 
    aisId: number;
    fullName: string;
    // Doplnené z väzobnej tabuľky
    exerciseId?: number | null; 
}

interface Exercise {
    id: number;
    firstSessionDate: string;
    startTime: string;
    roomEnum: string;
}

// Rozhranie pre odpoveď z /api/v1/student-exercise
interface StudentExerciseResponse {
    id: number;
    student: { id: number };
    exercise: { id: number };
}

type NewStudent = Omit<Student, 'id'>;

@Component({
  selector: 'app-students',
  standalone: true, 
  imports: [CommonModule, FormsModule, LongPressDirective, DatePipe], 
  templateUrl: './students.html',
  styleUrl: './students.css'
})
export class Students implements OnInit, AfterViewChecked { 

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocus: boolean = false; 
  private isSaving: boolean = false; 

  private studentsApiUrl = 'http://localhost:8080/api/v1/student'; 
  private exercisesApiUrl = 'http://localhost:8080/api/v1/exercise'; 
  private studentExerciseApiUrl = 'http://localhost:8080/api/v1/student-exercise';

  public students: Student[] = [];
  public exercises: Exercise[] = []; 
  
  public isLoading: boolean = false;
  public error: string | null = null;
  public message: string | null = null; 
  
  // Create Modal
  isCreateStudentModalOpen: boolean = false;
  novyStudent: NewStudent = { aisId: 0, fullName: '' };
  selectedExerciseId: number | null = null; 

  // Edit states
  editingStudentId: number | null = null;
  editingField: keyof Student | null = null;
  editingValue: string | number | null = '';

  // Delete states
  isDeleteConfirmModalOpen: boolean = false;
  studentToDelete: Student | null = null;
  deleteConfirmationInput: string = '';
  readonly deleteConfirmText: string = 'CONFIRM';
  
  ngOnInit(): void {
    this.loadData();
  }
  
  async loadData(): Promise<void> {
      this.isLoading = true;
      this.error = null;
      try {
          // 1. Načítame Cvičenia, Študentov a Väzby naraz
          const [exercisesData, studentsData, relationshipsData] = await Promise.all([
              lastValueFrom(this.http.get<Exercise[]>(this.exercisesApiUrl)),
              lastValueFrom(this.http.get<Student[]>(`${this.studentsApiUrl}?sort=id,asc`)),
              lastValueFrom(this.http.get<StudentExerciseResponse[]>(this.studentExerciseApiUrl))
          ]);
          
          this.exercises = exercisesData || [];
          this.exercises.sort((a, b) => a.id - b.id);

          const rawStudents = studentsData || [];
          const relationships = relationshipsData || [];

          // 2. Spojíme študentov s ich cvičením
          this.students = rawStudents.map(student => {
              const rel = relationships.find(r => r.student.id === student.id);
              return {
                  ...student,
                  exerciseId: rel ? rel.exercise.id : null
              };
          });

          this.students.sort((a, b) => a.id - b.id);

      } catch (err) {
          console.error(err);
          this.error = "Nepodarilo sa načítať dáta.";
      } finally {
          this.isLoading = false;
      }
  }

  // --- ZMENA CVIČENIA (POST na /student-exercise) ---
  async onExerciseChange(student: Student, newValue: any): Promise<void> {
      const newExerciseId = Number(newValue);

      if (student.exerciseId === newExerciseId) return;
      if (!newExerciseId) return; 

      this.isLoading = true;
      this.message = null; 
      this.error = null;

      const oldExerciseId = student.exerciseId;
      
      // Optimistický update v UI
      student.exerciseId = newExerciseId;

      // Štruktúra pre POST request (ako si poslal v príklade)
      const updatePayload = {
          studentExercises: [
              {
                  studentId: student.id,
                  exerciseId: newExerciseId
              }
          ]
      };

      try {
          await lastValueFrom(this.http.post(this.studentExerciseApiUrl, updatePayload));
          this.message = `Študent ${student.fullName} bol presunutý.`;
      } catch (err: any) {
          console.error(err);
          student.exerciseId = oldExerciseId; // Rollback
          this.error = "Chyba pri zmene cvičenia.";
          await this.loadData(); // Refresh dát pre istotu
      } finally {
          this.isLoading = false;
      }
  }

  // --- CREATE ---
  onCreateStudentClick(): void {
    this.novyStudent = { aisId: 0, fullName: '' };
    this.selectedExerciseId = null; 
    if (this.exercises.length > 0) this.selectedExerciseId = this.exercises[0].id;
    this.isCreateStudentModalOpen = true;
    this.error = null; this.message = null;
  }
  
  onCloseStudentModal(): void { this.isCreateStudentModalOpen = false; }
  
  async onSubmitNovyStudent(): Promise<void> {
    if (this.selectedExerciseId === null) {
        this.error = "Vyberte cvičenie."; return;
    }
    this.isLoading = true;
    
    // Vytvorenie študenta s priradením k cvičeniu
    const dataToSend = { 
        exerciseId: Number(this.selectedExerciseId), 
        students: [{ aisId: Number(this.novyStudent.aisId), fullName: this.novyStudent.fullName.trim() }] 
    };

    try {
      await lastValueFrom(this.http.post<any>(this.studentsApiUrl, dataToSend));
      this.message = `Študent pridaný.`;
      this.onCloseStudentModal();
      await this.loadData(); 
    } catch (err: any) { 
       if (err.status === 409) {
           this.error = "Študent s týmto AIS ID už existuje.";
       } else {
           this.error = "Chyba pri vytváraní študenta.";
       }
    } finally {
      this.isLoading = false;
    }
  }

  // --- DELETE ---
  onDeleteStudentClick(student: Student): void {
      this.studentToDelete = student;
      this.deleteConfirmationInput = '';
      this.isDeleteConfirmModalOpen = true;
      this.error = null; this.message = null;
  }
  onCloseDeleteConfirmModal(): void {
      this.isDeleteConfirmModalOpen = false;
      this.studentToDelete = null;
  }
  async onConfirmDelete(): Promise<void> {
      if (!this.studentToDelete || this.deleteConfirmationInput.trim() !== this.deleteConfirmText) return;
      const idToDelete = this.studentToDelete.id;
      this.isLoading = true;
      this.onCloseDeleteConfirmModal();
      try {
        await lastValueFrom(this.http.delete(`${this.studentsApiUrl}/${idToDelete}`));
        this.students = this.students.filter(s => s.id !== idToDelete);
        this.message = `Študent vymazaný.`;
      } catch (err: any) {
        this.error = `Chyba pri mazaní.`;
      } finally {
        this.isLoading = false;
      }
  }

  // --- INLINE EDIT (Meno, AIS ID) ---
  isEditing(id: number, field: string): boolean {
    return this.editingStudentId === id && this.editingField === field;
  }
  onCellEdit(student: Student, field: keyof Student): void {
    if (this.isSaving) return;
    if (field === 'exerciseId') return; // Cvičenie sa rieši cez dropdown

    this.editingStudentId = student.id;
    this.editingField = field;
    this.editingValue = student[field] as string | number;
    this.shouldFocus = true; 
    this.cdr.detectChanges(); 
  }
  async onCellSave(student: Student): Promise<void> {
    this.shouldFocus = false;
    if (this.isSaving || this.editingStudentId === null || !this.editingField) return;

    const idToSave = this.editingStudentId;
    const fieldToSave = this.editingField;
    const rawValue = this.editingValue;

    if (String(student[fieldToSave]) === String(rawValue).trim()) {
      this.editingStudentId = null; this.editingField = null; return;
    }

    let newValue: any = String(rawValue).trim();
    if (fieldToSave === 'aisId') newValue = parseFloat(newValue) || 0;
    
    // Update len mena/AIS ID
    const updatePayload = {
        aisId: student.aisId,
        fullName: student.fullName
    };
    
    if (fieldToSave === 'aisId') updatePayload.aisId = newValue;
    if (fieldToSave === 'fullName') updatePayload.fullName = newValue;
    
    this.isSaving = true; this.isLoading = true;
    try {
      await lastValueFrom(this.http.put(`${this.studentsApiUrl}/${idToSave}`, updatePayload));
      
      if (fieldToSave === 'aisId') student.aisId = newValue;
      if (fieldToSave === 'fullName') student.fullName = newValue;
      this.message = `Údaje aktualizované.`;
    } catch (err: any) {
      this.error = `Aktualizácia zlyhala.`;
      await this.loadData();
    } finally {
      this.editingStudentId = null; this.editingField = null;
      this.isLoading = false; this.isSaving = false;
    }
  }

  ngAfterViewChecked(): void {
      if (this.shouldFocus && this.editInputsRef.first) {
          this.shouldFocus = false; 
          setTimeout(() => {
              if (this.editInputsRef.first) this.editInputsRef.first.nativeElement.focus();
          }, 10);
      }
  }
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) { this.onCloseStudentModal(); this.onCloseDeleteConfirmModal(); }
  }
}