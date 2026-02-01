import { Component, OnInit, inject, effect, ViewChildren, QueryList, ElementRef, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../core/context/teacher-context';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger';

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
  aisId: number;
  studentAssignments: StudentAssignmentDto[];
}

interface BlockPointDto {
  blockId: number;
  blockPoints: number;
}

interface StudentBlockPointsDto {
  studentFullName: string;
  aisId: number;
  allBlockPoints: BlockPointDto[];
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
  private logger = inject(LoggerService);
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

  tooltipData: { text: string, x: number, y: number } | null = null;

  constructor() {
    effect(() => {
      const block = this.contextService.selectedBlock();
      if (block && block.id) {
        this.isSemesterMode = false;
        this.logger.log('Context block changed', block.id);
        this.loadGradingData(block.id);
      }
    });
    effect(() => {
      const exercise = this.contextService.selectedExercise();
      if (exercise && this.isSemesterMode) {
        this.logger.log('Context exercise changed in Semester Mode', exercise.exerciseId);
        this.loadSemesterData();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.logger.log('GradingComponent initialized');
    this.contextService.loadBlocks().subscribe();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((text) => {
      this.logger.log(`Performing search: "${text}"`);
      this.performSearch();
    });
  }

  showTooltip(event: MouseEvent, text: string) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.tooltipData = {
      text: text,
      x: rect.left + (rect.width / 2),
      y: rect.top
    };
  }

  hideTooltip() {
    this.tooltipData = null;
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
    this.logger.log('Switching to Semester Mode');
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
      const currentExercise = this.contextService.selectedExercise() as ContextExercise | null;
      const exerciseId = currentExercise?.exerciseId;

      if (!exerciseId) {
        this.error = 'Vyberte cvičenie pre zobrazenie semestra.';
        return;
      }

      const blocks = this.contextService.blocks();
      this.assignments = blocks.map(b => ({
        id: b.id,
        name: b.name,
        maxPoints: 0
      }));

      let params = new HttpParams().set('exerciseId', exerciseId);
      if (this.studentSearchQuery.trim()) {
        params = params.set('studentFullName', this.studentSearchQuery.trim());
      }

      const response = await lastValueFrom(
        this.http.get<StudentBlockPointsDto[]>(`${this.apiUrl}/student-assignment/block-points`, { params })
      );

      this.studentRows = (response || []).map((dto, index) => {
        return {
          studentId: index,
          studentFullName: dto.studentFullName,
          aisId: dto.aisId,
          studentAssignments: dto.allBlockPoints.map(bp => ({
            studentAssignmentId: 0,
            assignmentId: bp.blockId,
            earnedPoints: bp.blockPoints,
            note: ''
          }))
        };
      });

      this.studentRows.sort((a, b) => a.studentFullName.localeCompare(b.studentFullName));
      this.logger.log(`Semester data loaded: ${this.studentRows.length} students`);

    } catch (err) {
      this.logger.error('Failed to load semester data', err);
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

      this.logger.log(`Grading data loaded for Block ${blockId}: ${this.studentRows.length} rows`);

    } catch (err) {
      this.logger.error('Failed to load grading data', err);
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
    this.hideTooltip();
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
      this.logger.log(`Updating assignment ${record.studentAssignmentId}`, { newPoints, newNote });
      await lastValueFrom(this.http.put(`${this.apiUrl}/student-assignment/${record.studentAssignmentId}`, { earnedPoints: newPoints, note: newNote }));
      this.message = 'Uložené.';
      setTimeout(() => this.message = null, 2000);
    } catch (err) {
      this.logger.error('Update grading failed', err);
      this.error = 'Chyba ukladania.';
      record.earnedPoints = oldPoints; record.note = oldNote;
    } finally {
      this.isSaving = false;
    }
  }
}