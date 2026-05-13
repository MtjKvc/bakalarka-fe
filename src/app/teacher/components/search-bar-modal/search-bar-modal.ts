import { Component, inject, input, output, OnInit, ViewChildren, QueryList, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { Block, TeacherContextService } from '../../../core/context/teacher-context.service';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';
import { StudentBasic,ApiResponse,AssignmentHeader,StudentAssignmentDto,SessionColumn,StudentGradingRow,AttendanceItemDto } from '../../../shared/models/interfaces';

interface StudentAttendanceRow {
  studentFullName: string;
  aisId?: number;
  allBlockPoints: BlockPointDto[];
  studentAttendances: AttendanceItemDto[];
}

export interface StudentExerciseDto {
  sessionDay: string;
  startTime: string;
  roomEnum: string;
}

interface BlockPointDto {
  blockId: number;
  blockPoints: number;
}

interface AttendanceMapValue {
  id: number;      
  status: string;  
}

@Component({
  selector: 'app-search-bar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CloseOnEscDirective],
  templateUrl: './search-bar-modal.html',
})
export class SearchBarModalComponent implements OnInit, AfterViewChecked {
  
  private http = inject(HttpClient);
  public contextService = inject(TeacherContextService);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  public allBlockPoints: BlockPointDto[] = [];

  public studentExercise: StudentExerciseDto | null = null;

  public student = input.required<StudentBasic>();
  public close = output<void>();

  public gradingAssignments: AssignmentHeader[] = [];
  public gradingRow: StudentGradingRow | null = null;

  public attendanceSessions: SessionColumn[] = [];
  public attendanceMap = new Map<number, AttendanceMapValue>(); 

  public attendanceOptions: string[] = [];

  private translations: Record<string, string> = {
    'PRESENT': 'Prítomný',
    'ABSENT': 'Neprítomný',
    'SUBSTITUTED': 'Nahradené',
    'EXCUSED': 'Ospravedlnené'
  };

  private dayTranslations: Record<string, string> = {
    'MONDAY': 'Pondelok',
    'TUESDAY': 'Utorok',
    'WEDNESDAY': 'Streda',
    'THURSDAY': 'Štvrtok',
    'FRIDAY': 'Piatok',
    'SATURDAY': 'Sobota',
    'SUNDAY': 'Nedeľa'
  };

  public isLoading = false;
  public isSaving = false;
  
  public message: string | null = null;
  public error: string | null = null;

  @ViewChildren('editInput') private editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  public editingAssignmentId: number | null = null;
  public editingValue: number | string = '';      
  private shouldFocus: boolean = false;

  public isNoteModalOpen = false;
  public noteModalText = '';
  public noteModalAssignmentId: number | null = null;

  public ngOnInit(): void {
    this.logger.log('SearchBarModal initialized', this.student());
    this.loadAttendanceOptions();
    this.loadStudentExercise();
    if (this.contextService.blocks().length === 0) {
        this.contextService.loadBlocks().subscribe(() => this.loadData());
    } else {
        this.loadData();
    }
  }

  private async loadStudentExercise() {
    const aisId = this.student().aisId;
    if (!aisId) return;

    try {
      const response = await lastValueFrom(
        this.http.get<StudentExerciseDto>(`${this.apiUrl}/student-exercise/exercise-for-student?aisId=${aisId}`)
      );
      this.studentExercise = response;
    } catch (e) {
      this.logger.error('Nepodarilo sa načítať cvičenie študenta', e);
    }
  }

  public getTranslatedDay(day: string): string {
    if (!day) return '';
    return this.dayTranslations[day.toUpperCase()] || day;
  }

  private async loadAttendanceOptions() {
    try {
        const response = await lastValueFrom(
            this.http.get<string[]>(`${this.apiUrl}/enum/attendance`)
        );
        this.attendanceOptions = response || [];
    } catch (e) {
        this.logger.error('Nepodarilo sa načítať statusy dochádzky.', e);
    }
  }

  public onSelectBlock(block: Block): void {
      this.logger.log('Block selected in modal', block);
      this.contextService.selectBlock(block);
      this.loadData();
  }

  private async loadData() {
    this.isLoading = true;
    this.resetState();

    const studentId = this.student().id;
    const block = this.contextService.selectedBlock();    

    if (block && block.id) {
      try {
        const assignmentsRes = await lastValueFrom(
          this.http.get<AssignmentHeader[]>(`${this.apiUrl}/assignment?blockId=${block.id}`)
        ) || [];
        this.gradingAssignments = assignmentsRes || [];

        const gradingRes = await lastValueFrom(
          this.http.get<StudentGradingRow[]>(`${this.apiUrl}/student-assignment/grading?blockId=${block.id}&studentId=${studentId}`)
        );
        const gradingData = gradingRes || [];

        if (gradingData && gradingData.length > 0) {
          this.gradingRow = gradingData[0];
          this.mapAssignments();
        } else {
          this.gradingRow = { studentFullName: this.student().fullName, studentAssignments: [] };
        }
      } catch (e) {
        this.logger.error('Chyba grading:', e);
        this.error = "Nepodarilo sa načítať hodnotenie.";
      }
    }

    try {
      const attendanceRes = await lastValueFrom(
        this.http.get<StudentAttendanceRow[]>(`${this.apiUrl}/student-attendance/attendance?studentId=${studentId}`)
      );
      const attendanceData = attendanceRes || [];

      if (attendanceData && attendanceData.length > 0) {
        this.processAttendanceData(attendanceData[0]);
      } else {
        this.attendanceSessions = [];
        this.attendanceMap.clear();
      }
    } catch (e) {
      this.logger.error('Chyba attendance:', e);
    }

    this.isLoading = false;
  }

  private resetState() {
      this.error = null;
      this.message = null;
      this.editingAssignmentId = null;
      this.closeNoteModal();
  }

  private mapAssignments() {
    if (this.gradingRow?.studentAssignments) {
        this.gradingRow.studentAssignments.forEach((sa, i) => {
           if (this.gradingAssignments[i] && !sa.assignmentId) {
               sa.assignmentId = this.gradingAssignments[i].id;
           }
        });
     }
  }

  private processAttendanceData(row: StudentAttendanceRow) {
    const sessionsMap = new Map<number, SessionColumn>();
    this.attendanceMap.clear();

    if (row.studentAttendances) {
      row.studentAttendances.forEach((att, index) => {
        const sessionId = att.exerciseSessionId || (index + 1);
        
        if (!sessionsMap.has(sessionId)) {
           sessionsMap.set(sessionId, {
             id: sessionId,
             label: att.sessionDate ? this.formatDate(att.sessionDate) : `${index + 1}. týž.`
           });
        }
        this.attendanceMap.set(sessionId, { id: att.attendanceId, status: att.attendance });
      });
    }
    this.attendanceSessions = Array.from(sessionsMap.values()).sort((a, b) => a.id - b.id);
    this.allBlockPoints = row.allBlockPoints || [];
  }

  public getBlockPoints(blockId: number): number {
  const bp = this.allBlockPoints.find(p => p.blockId === blockId);
  return bp ? bp.blockPoints : 0;
}

  public getAssignmentRecord(assignmentId: number): StudentAssignmentDto | undefined {
    return this.gradingRow?.studentAssignments?.find(a => a.assignmentId === assignmentId);
  }

  public onEditPoint(assignmentId: number): void {
    if (this.isSaving) return;
    
    const currentPoints = this.getPoints(assignmentId);
    this.editingAssignmentId = assignmentId;
    this.editingValue = (currentPoints === '-' ? '' : currentPoints);
    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  public async onSavePoint(assignmentId: number): Promise<void> {
    this.shouldFocus = false;
    
    if (this.isSaving || this.editingAssignmentId !== assignmentId) return;

    const record = this.gradingRow?.studentAssignments.find(a => a.assignmentId === assignmentId);
    if (!record || !record.studentAssignmentId) {
        this.editingAssignmentId = null; return;
    }

    const newValue = parseFloat(String(this.editingValue));

    if (isNaN(newValue)) {
        this.error = "Zadaná hodnota bodov musí byť číslo!";
        this.editingAssignmentId = null;
        setTimeout(() => this.error = null, 3000);
        return;
    }
    
    if (record.earnedPoints === newValue) {
        this.editingAssignmentId = null; return;
    }

    await this.updatePointRecord(record, newValue);
    this.editingAssignmentId = null;
  }

  private async updatePointRecord(record: StudentAssignmentDto, newPoints: number) {
      this.isSaving = true;
      const oldPoints = record.earnedPoints;

      record.earnedPoints = newPoints;

      try {
          this.logger.log(`Updating points for assignment ${record.studentAssignmentId}`, newPoints);
          await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/student-assignment/${record.studentAssignmentId}`, {
              earnedPoints: newPoints,
              note: record.note || ""
          }));
          this.showMessage("Body uložené");
      } catch (e) {
          this.logger.error('Error saving points', e);
          record.earnedPoints = oldPoints; 
          this.error = "Chyba pri ukladaní bodov!";
      } finally {
          this.isSaving = false;
      }
  }

  public openNoteModal(assignmentId: number, currentNote: string | undefined, event: Event) {
    event.stopPropagation();
    this.noteModalAssignmentId = assignmentId;
    this.noteModalText = currentNote || '';
    this.isNoteModalOpen = true;
  }

  public closeNoteModal() {
    this.isNoteModalOpen = false;
    this.noteModalAssignmentId = null;
    this.noteModalText = '';
  }

  public async saveNoteFromModal() {
    if (this.isSaving || !this.noteModalAssignmentId) return;

    const record = this.gradingRow?.studentAssignments.find(a => a.assignmentId === this.noteModalAssignmentId);
    if (!record || !record.studentAssignmentId) return;

    this.isSaving = true;
    
    try {
      this.logger.log(`Saving note for assignment ${record.studentAssignmentId}`);
      await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/student-assignment/${record.studentAssignmentId}`, {
        earnedPoints: record.earnedPoints,
        note: this.noteModalText
      }));

      record.note = this.noteModalText;
      
      this.showMessage("Poznámka uložená");
      this.closeNoteModal();
    } catch (e) {
      this.logger.error('Error saving note', e);
      this.error = "Chyba pri ukladaní poznámky!";
    } finally {
      this.isSaving = false;
    }
  }

  public async onAttendanceClick(sessionId: number): Promise<void> {
      if (this.isSaving) return; 

      const record = this.attendanceMap.get(sessionId);
      if (!record) return;

      if (this.attendanceOptions.length === 0) return;

      const currentIndex = this.attendanceOptions.indexOf(record.status);

      const nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % this.attendanceOptions.length;

      const newStatus = this.attendanceOptions[nextIndex];

      await this.updateAttendanceRecord(record, newStatus);
  }

  private async updateAttendanceRecord(record: AttendanceMapValue, newStatus: string): Promise<void> {
      this.isSaving = true;
      const oldStatus = record.status;

      record.status = newStatus;

      try {
          this.logger.log(`Updating attendance ${record.id} to ${newStatus}`);
          await lastValueFrom(this.http.put<ApiResponse<unknown>>(`${this.apiUrl}/student-attendance/${record.id}`, {
              attendanceEnum: newStatus
          }));
          
          this.showMessage("Dochádzka zmenená");
          this.error = null;

      } catch (e) {
          this.logger.error('Update attendance failed', e);
          this.error = 'Zmena dochádzky zlyhala.';
          record.status = oldStatus;
      } finally {
          this.isSaving = false;
      }
  }

  private showMessage(msg: string) {
      this.message = msg;
      setTimeout(() => this.message = null, 2000);
  }

  public ngAfterViewChecked(): void {
    if (this.shouldFocus && this.editInputsRef.first) {
        this.shouldFocus = false;
        setTimeout(() => {
             if (this.editInputsRef.first) {
                 this.editInputsRef.first.nativeElement.focus();
                 this.editInputsRef.first.nativeElement.select();
             }
        }, 10);
    }
  }

  public getPoints(assignmentId: number): string | number {
    if (!this.gradingRow?.studentAssignments) return '-';
    const record = this.gradingRow.studentAssignments.find(a => a.assignmentId === assignmentId);
    return record ? record.earnedPoints : '-';
  }

  public getAttendanceStatus(sessionId: number): string {
    const record = this.attendanceMap.get(sessionId);
    if (!record) return '-';
    return this.translations[record.status] || record.status;
  }

  public getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PRÍTOMNÝ':
      case 'PRESENT': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'NEPRÍTOMNÝ':
      case 'ABSENT': return 'bg-red-100 text-red-800 border border-red-200';
      case 'NAHRADENÉ':
      case 'SUBSTITUTED': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'OSPRAVEDLNENÉ':
      case 'EXCUSED': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  }

  private formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return `${d.getDate()}.${d.getMonth() + 1}.`;
    } catch { return dateStr; }
  }

  public onClose() {
    this.logger.log('Closing search modal');
    this.close.emit();
  }
}