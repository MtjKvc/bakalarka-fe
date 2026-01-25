import { Component, OnInit, inject, effect, ViewChildren, QueryList, ElementRef, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom, forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../services/teacher-context';
import { environment } from '../../../../environments/environment';

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

@Component({
  selector: 'app-grading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grading.html',
  styleUrl: './grading.css'
})
export class GradingComponent implements OnInit, AfterViewChecked, OnDestroy {
  
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  public contextService = inject(TeacherContextService);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  @ViewChildren('pointInput') pointInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  private shouldFocusInput = false;

  public assignments: AssignmentHeader[] = []; 
  public studentRows: StudentGradingRow[] = []; 
  public isLoading = false;
  public isSaving = false;
  public isSemesterMode = false;

  public blockMaxPoints = 0;
  public blockRequiredPoints = 0;

  public error: string | null = null;
  public message: string | null = null;

  editingRecordId: number | null = null;
  editingValue: number | null = null;

  isNoteModalOpen = false;
  noteModalRecord: StudentAssignmentDto | null = null;
  noteModalText: string = '';

  public studentSearchQuery: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | undefined;

  constructor() {
    effect(() => {
      const block = this.contextService.selectedBlock();
      if (block && block.id) {
        this.isSemesterMode = false;
        this.loadGradingData(block.id);
      }
    });
  }

  ngOnInit() {
    this.contextService.loadBlocks().subscribe();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),    
      distinctUntilChanged()  
    ).subscribe(() => {
      this.performSearch();  
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
      if (this.shouldFocusInput && this.pointInputsRef && this.pointInputsRef.length > 0) {
          this.pointInputsRef.first.nativeElement.focus();
          this.pointInputsRef.first.nativeElement.select();
          this.shouldFocusInput = false;
      }
  }

  onSearchInput(text: string) {
    this.studentSearchQuery = text;
    this.searchSubject.next(text); 
  }

  performSearch() {
    if (this.isSemesterMode) {
      this.loadSemesterData();
    } else {
      const block = this.contextService.selectedBlock();
      if (block) this.loadGradingData(block.id);
    }
  }

  clearFilter() {
    this.studentSearchQuery = '';
    this.performSearch(); 
  }

  async selectSemester() {
    this.isSemesterMode = true;
    this.contextService.selectBlock(null as any);
    await this.loadSemesterData();
  }

  async loadSemesterData() {
    this.isLoading = true;
    this.error = null;
    this.assignments = [];
    this.studentRows = [];
    this.blockMaxPoints = 0;
    this.blockRequiredPoints = 0;

    try {
      const blocks = this.contextService.blocks();
      const currentExercise = this.contextService.selectedExercise() as ContextExercise | null;
      const exerciseId = currentExercise?.exerciseId;

      if (!exerciseId) {
        this.error = 'Vyberte cvičenie pre zobrazenie semestra.';
        return;
      }

      this.assignments = blocks.map(b => ({
        id: b.id,
        name: b.name,
        maxPoints: 0
      }));

      let commonParams = new HttpParams().set('exerciseId', exerciseId);
      if (this.studentSearchQuery.trim()) {
        commonParams = commonParams.set('studentFullName', this.studentSearchQuery.trim());
      }
      
      const requests = blocks.map(b => 
        this.http.get<StudentGradingRow[]>(`${this.apiUrl}/student-assignment/grading`, {
          params: commonParams.set('blockId', b.id)
        })
      );

      const allBlocksData = await lastValueFrom(forkJoin(requests));
      
      const studentsMap = new Map<string, StudentGradingRow>();

      allBlocksData.forEach((blockRows, index) => {
        const blockId = blocks[index].id;
        
        blockRows.forEach(row => {
          if (!studentsMap.has(row.studentFullName)) {
            studentsMap.set(row.studentFullName, {
              studentFullName: row.studentFullName,
              studentAssignments: []
            });
          }

          const student = studentsMap.get(row.studentFullName)!;
          const blockTotalPoints = row.studentAssignments.reduce((sum, sa) => sum + (sa.earnedPoints || 0), 0);
          
          student.studentAssignments.push({
            studentAssignmentId: -1, 
            assignmentId: blockId,
            earnedPoints: blockTotalPoints
          });
        });
      });

      this.studentRows = Array.from(studentsMap.values()).sort((a, b) => a.studentFullName.localeCompare(b.studentFullName));

    } catch (err) {
      console.error(err);
      this.error = 'Nepodarilo sa načítať dáta semestra.';
    } finally {
      this.isLoading = false;
    }
  }

  async loadGradingData(blockId: number) {
    const currentExercise = this.contextService.selectedExercise() as ContextExercise | null;
    const exerciseId = currentExercise?.exerciseId;

    if (!exerciseId) {
        this.error = 'Prosím, vyberte cvičenie v hornej lište.';
        this.studentRows = []; this.assignments = []; return;
    }

    const currentBlock = this.contextService.blocks().find(b => b.id === blockId);
    if (currentBlock) {
        this.blockMaxPoints = (currentBlock as any).maxPoints || 0;
        this.blockRequiredPoints = (currentBlock as any).requiredPoints || 0;
    }

    this.isLoading = true;
    this.error = null;
    this.editingRecordId = null;

    try {
      let params = new HttpParams()
        .set('blockId', blockId)
        .set('exerciseId', exerciseId);

      if (this.studentSearchQuery.trim()) {
        params = params.set('studentFullName', this.studentSearchQuery.trim());
      }

      this.assignments = await lastValueFrom(this.http.get<AssignmentHeader[]>(`${this.apiUrl}/assignment?blockId=${blockId}`)) || [];
      const rawData = await lastValueFrom(
          this.http.get<StudentGradingRow[]>(`${this.apiUrl}/student-assignment/grading`, { params })
      );
      
      this.studentRows = (rawData || []).map((row, index) => {
          if (row.studentAssignments) {
              row.studentAssignments.forEach((sa, i) => {
                  if (this.assignments[i]) sa.assignmentId = this.assignments[i].id;
              });
          }
          return { ...row, studentId: row.studentId ?? index };
      }).sort((a, b) => a.studentFullName.localeCompare(b.studentFullName));

    } catch (err) {
      console.error(err);
      this.error = 'Nepodarilo sa načítať dáta.';
    } finally {
      this.isLoading = false;
    }
  }

  calculateTotalPoints(student: StudentGradingRow): number {
    if (!student.studentAssignments) return 0;
    const total = student.studentAssignments.reduce((sum, sa) => sum + (sa.earnedPoints || 0), 0);
    return Math.round(total * 100) / 100;
  }

  getAssignmentRecord(student: StudentGradingRow, assignmentId: number): StudentAssignmentDto | undefined {
    return student.studentAssignments?.find(a => a.assignmentId === assignmentId);
  }

  isEditing(record: StudentAssignmentDto | undefined): boolean {
      return !this.isSemesterMode && !!record && this.editingRecordId === record.studentAssignmentId;
  }

  onCellClick(record: StudentAssignmentDto | undefined): void {
      if (this.isSaving || !record || this.isSemesterMode) return;
      this.editingRecordId = record.studentAssignmentId;
      this.editingValue = record.earnedPoints;
      this.shouldFocusInput = true; 
      this.cdr.detectChanges(); 
  }

  async onCellSave(record: StudentAssignmentDto): Promise<void> {
      const numericValue = parseFloat(String(this.editingValue));
      if (this.editingValue === null || isNaN(numericValue) || numericValue === record.earnedPoints) {
          this.editingRecordId = null; return;
      }
      await this.updateRecord(record, numericValue, record.note || '');
      this.editingRecordId = null;
  }

  openNoteModal(record: StudentAssignmentDto, event: MouseEvent): void {
      event.stopPropagation(); 
      if (this.isSemesterMode) return;
      this.noteModalRecord = record;
      this.noteModalText = record.note || '';
      this.isNoteModalOpen = true;
  }

  closeNoteModal(): void {
      this.isNoteModalOpen = false;
      this.noteModalRecord = null;
  }

  async saveNoteFromModal(): Promise<void> {
      if (!this.noteModalRecord) return;
      await this.updateRecord(this.noteModalRecord, this.noteModalRecord.earnedPoints, this.noteModalText.trim());
      this.closeNoteModal();
  }

  private async updateRecord(record: StudentAssignmentDto, newPoints: number, newNote: string): Promise<void> {
    this.isSaving = true;
    const oldPoints = record.earnedPoints;
    const oldNote = record.note;
    record.earnedPoints = newPoints;
    record.note = newNote;

    try {
        await lastValueFrom(this.http.put(`${this.apiUrl}/student-assignment/${record.studentAssignmentId}`, { earnedPoints: newPoints, note: newNote }));
        this.message = 'Uložené.';
        setTimeout(() => this.message = null, 2000);
    } catch (err) {
        this.error = 'Chyba ukladania.';
        record.earnedPoints = oldPoints; record.note = oldNote;
    } finally {
        this.isSaving = false;
    }
  }
}