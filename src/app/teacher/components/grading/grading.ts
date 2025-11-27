import { Component, OnInit, inject, effect, ViewChildren, QueryList, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../services/teacher-context';

interface AssignmentHeader {
  id: number;
  name: string;
  maxPoints: number;
}

interface StudentAssignmentDto {
  studentAssignmentId: number; 
  assignmentId?: number; 
  earnedPoints: number;
  note?: string;
}

interface StudentGradingRow {
  studentId?: number; 
  studentFullName: string;
  studentAssignments: StudentAssignmentDto[];
}

interface UpdateGradePayload {
    earnedPoints: number;
    note: string;
}

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grading.html',
  styleUrl: './grading.css'
})
export class GradingComponent implements OnInit, AfterViewChecked {
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public contextService = inject(TeacherContextService);
  private apiUrl = 'http://localhost:8080/api/v1';

  @ViewChildren('pointInput') pointInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocusInput = false;

  public assignments: AssignmentHeader[] = []; 
  public studentRows: StudentGradingRow[] = []; 
  public isLoading = false;
  public isSaving = false;

  // --- UPOZORNENIA ---
  public error: string | null = null;
  public message: string | null = null; // Zelená správa

  editingRecordId: number | null = null;
  editingValue: number | null = null;

  isNoteModalOpen = false;
  noteModalRecord: StudentAssignmentDto | null = null;
  noteModalText: string = '';

  constructor() {
    effect(() => {
      const block = this.contextService.selectedBlock();
      const exercise = this.contextService.selectedExercise() as ContextExercise | null;
      if (block && block.id) {
        this.loadGradingData(block.id);
      }
    });
  }

  ngOnInit() {
    this.contextService.loadBlocks().subscribe();
  }

  ngAfterViewChecked(): void {
      if (this.shouldFocusInput && this.pointInputsRef && this.pointInputsRef.length > 0) {
          this.pointInputsRef.first.nativeElement.focus();
          this.pointInputsRef.first.nativeElement.select();
          this.shouldFocusInput = false;
      }
  }

  async loadGradingData(blockId: number) {
    if (!blockId) return;
    const currentExercise = this.contextService.selectedExercise() as ContextExercise | null;
    const exerciseId = currentExercise?.exerciseId;

    if (!exerciseId) {
        this.error = 'Prosím, vyberte cvičenie v hornej lište.';
        this.studentRows = []; this.assignments = []; return;
    }

    this.isLoading = true;
    this.error = null;
    this.message = null;
    this.editingRecordId = null;

    try {
      // 1. Zadania (Bez sortu, veríme backendu)
      this.assignments = await lastValueFrom(this.http.get<AssignmentHeader[]>(`${this.apiUrl}/assignment?blockId=${blockId}`)) || [];

      // 2. Hodnotenia
      const rawData = await lastValueFrom(
          this.http.get<StudentGradingRow[]>(`${this.apiUrl}/student-assignment/grading?blockId=${blockId}&exerciseId=${exerciseId}`)
      );
      
      const mappedData = (rawData || []).map((row, index) => {
          if (row.studentAssignments) {
              // Párovanie podľa indexu (bez sortu)
              row.studentAssignments.forEach((sa, i) => {
                  if (this.assignments[i]) {
                      sa.assignmentId = this.assignments[i].id;
                  }
              });
          }
          return {
              ...row,
              studentId: row.studentId !== undefined ? row.studentId : index
          };
      });

      this.studentRows = mappedData.sort((a, b) => a.studentFullName.localeCompare(b.studentFullName));

    } catch (err) {
      console.error(err);
      this.error = 'Nepodarilo sa načítať dáta.';
    } finally {
      this.isLoading = false;
    }
  }

  // --- HELPERY ---
  getAssignmentRecord(student: StudentGradingRow, assignmentId: number): StudentAssignmentDto | undefined {
    return student.studentAssignments?.find(a => a.assignmentId === assignmentId);
  }

  isEditing(record: StudentAssignmentDto | undefined): boolean {
      return !!record && this.editingRecordId === record.studentAssignmentId;
  }

  // --- INLINE EDIT ---
  onCellClick(record: StudentAssignmentDto | undefined): void {
      if (this.isSaving || !record) return;
      if (!record.studentAssignmentId) {
          this.error = 'Chyba: Záznam nemá ID.';
          return;
      }
      
      // Vyčistiť správy pri novom kliknutí
      this.message = null;
      this.error = null;

      this.editingRecordId = record.studentAssignmentId;
      this.editingValue = record.earnedPoints;
      
      this.shouldFocusInput = true; 
      this.cdr.detectChanges(); 
  }

  async onCellSave(record: StudentAssignmentDto): Promise<void> {
      const numericValue = parseFloat(String(this.editingValue));

      if (this.editingValue === null || isNaN(numericValue)) {
          this.editingRecordId = null;
          return;
      }
      
      if (numericValue === record.earnedPoints) {
          this.editingRecordId = null;
          return;
      }
      
      await this.updateRecord(record, numericValue, record.note || '');
      this.editingRecordId = null;
  }

  // --- MODÁL ---
  openNoteModal(record: StudentAssignmentDto, event: MouseEvent): void {
      event.stopPropagation(); 
      this.noteModalRecord = record;
      this.noteModalText = record.note || '';
      
      // Reset správ
      this.message = null; 
      this.error = null;
      
      this.isNoteModalOpen = true;
  }

  closeNoteModal(): void {
      this.isNoteModalOpen = false;
      this.noteModalRecord = null;
      this.noteModalText = '';
  }

  async saveNoteFromModal(): Promise<void> {
      if (!this.noteModalRecord) return;
      
      const newNote = this.noteModalText ? this.noteModalText.trim() : '';
      const oldNote = this.noteModalRecord.note ? this.noteModalRecord.note.trim() : '';

      if (newNote === oldNote) {
        this.closeNoteModal();
        return;
      }
      await this.updateRecord(this.noteModalRecord, this.noteModalRecord.earnedPoints, newNote);
      this.closeNoteModal();
  }

  // --- UPDATE (PUT) ---
  private async updateRecord(record: StudentAssignmentDto, newPoints: number, newNote: string): Promise<void> {
    if (!record.studentAssignmentId) {
        this.error = 'Chyba: Chýba ID záznamu.';
        return;
    }

    this.isSaving = true;
    const oldPoints = record.earnedPoints;
    const oldNote = record.note;
    
    // Optimistický update
    record.earnedPoints = newPoints;
    record.note = newNote;

    try {
        const url = `${this.apiUrl}/student-assignment/${record.studentAssignmentId}`;
        const payload: UpdateGradePayload = { earnedPoints: newPoints, note: newNote || "" };
        
        await lastValueFrom(this.http.put(url, payload));
        
        // !!! ÚSPECH !!!
        this.message = 'Hodnotenie úspešne uložené.';
        this.error = null;

        // Skryť správu po 3 sekundách
        setTimeout(() => {
            this.message = null;
        }, 3000);

    } catch (err) {
        console.error('Update failed', err);
        this.error = 'Uloženie zlyhalo. Skontrolujte pripojenie.';
        this.message = null;
        
        // Rollback
        record.earnedPoints = oldPoints;
        record.note = oldNote;
    } finally {
        this.isSaving = false;
    }
  }
}