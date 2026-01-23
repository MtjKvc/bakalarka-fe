import { Component, inject, input, output, OnInit, ViewChildren, QueryList, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { Block, TeacherContextService } from '../../../services/teacher-context';

export interface StudentSearchResult {
  id: number;
  fullName: string;
  aisId?: number;
}

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
  studentFullName: string;
  studentAssignments: StudentAssignmentDto[];
}

interface AttendanceItemDto {
  attendanceId: number;
  attendance: string; 
  exerciseSessionId?: number;
  sessionDate?: string;
}

interface StudentAttendanceRow {
  studentFullName: string;
  studentAttendances: AttendanceItemDto[];
}

interface SessionColumn {
  id: number;
  label: string;
}

interface AttendanceMapValue {
  id: number;      
  status: string;  
}

@Component({
  selector: 'app-search-bar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar-modal.html',
  styleUrl: './search-bar-modal.css'
})
export class SearchBarModalComponent implements OnInit, AfterViewChecked {
  
  private http = inject(HttpClient);
  public contextService = inject(TeacherContextService);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = 'http://localhost:8080/api/v1';

  student = input.required<StudentSearchResult>();
  close = output<void>();

  gradingAssignments: AssignmentHeader[] = [];
  gradingRow: StudentGradingRow | null = null;

  attendanceSessions: SessionColumn[] = [];
  attendanceMap = new Map<number, AttendanceMapValue>(); 

  attendanceOptions: string[] = [];

  private translations: Record<string, string> = {
    'PRESENT': 'Prítomný',
    'ABSENT': 'Neprítomný',
    'EXCUSED': 'Ospravedlnený',
    'LATE': 'Meškanie',
    'SUBSTITUTED': 'Nahradené'
  };


  isLoading = false;
  isSaving = false;
  
  message: string | null = null;
  error: string | null = null;

  @ViewChildren('editInput') editInputsRef!: QueryList<ElementRef<HTMLInputElement>>;
  editingAssignmentId: number | null = null;
  editingValue: number | string = '';      
  shouldFocus: boolean = false;

  ngOnInit(): void {
    this.loadAttendanceOptions();
    if (this.contextService.blocks().length === 0) {
        this.contextService.loadBlocks().subscribe(() => this.loadData());
    } else {
        this.loadData();
    }
  }

  async loadAttendanceOptions() {
    try {
        this.attendanceOptions = await lastValueFrom(
            this.http.get<string[]>(`${this.apiUrl}/enum/attendance`)
        );
    } catch (e) {
        console.error('Nepodarilo sa načítať statusy dochádzky.', e);
    }
  }

  onSelectBlock(block: Block): void {
      this.contextService.selectBlock(block);
      this.loadData();
  }

  async loadData() {
    this.isLoading = true;
    this.resetState();

    const studentId = this.student().id;
    const block = this.contextService.selectedBlock();     

    if (block && block.id) {
      try {
        this.gradingAssignments = await lastValueFrom(
          this.http.get<AssignmentHeader[]>(`${this.apiUrl}/assignment?blockId=${block.id}`)
        ) || [];

        const gradingData = await lastValueFrom(
          this.http.get<StudentGradingRow[]>(`${this.apiUrl}/student-assignment/grading?blockId=${block.id}&studentId=${studentId}`)
        );

        if (gradingData && gradingData.length > 0) {
          this.gradingRow = gradingData[0];
          this.mapAssignments();
        } else {
          this.gradingRow = { studentFullName: this.student().fullName, studentAssignments: [] };
        }
      } catch (e) {
        console.error('Chyba grading:', e);
        this.error = "Nepodarilo sa načítať hodnotenie.";
      }
    }

    try {
      const attendanceData = await lastValueFrom(
        this.http.get<StudentAttendanceRow[]>(`${this.apiUrl}/student-attendance/attendance?studentId=${studentId}`)
      );
      if (attendanceData && attendanceData.length > 0) {
        this.processAttendanceData(attendanceData[0]);
      } else {
        this.attendanceSessions = [];
        this.attendanceMap.clear();
      }
    } catch (e) {
      console.error('Chyba attendance:', e);
    }

    this.isLoading = false;
  }

  private resetState() {
      this.error = null;
      this.message = null;
      this.editingAssignmentId = null;
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
  }

  onEditPoint(assignmentId: number): void {
    if (this.isSaving) return;
    
    const currentPoints = this.getPoints(assignmentId);
    this.editingAssignmentId = assignmentId;
    this.editingValue = (currentPoints === '-' ? '' : currentPoints);
    this.shouldFocus = true;
    this.cdr.detectChanges();
  }

  async onSavePoint(assignmentId: number): Promise<void> {
    this.shouldFocus = false;
    
    if (this.isSaving || this.editingAssignmentId !== assignmentId) return;

    const record = this.gradingRow?.studentAssignments.find(a => a.assignmentId === assignmentId);
    if (!record || !record.studentAssignmentId) {
        this.editingAssignmentId = null; return;
    }

    const newValue = (this.editingValue === '' || this.editingValue === null) ? 0 : parseFloat(String(this.editingValue));
    
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
          await lastValueFrom(this.http.put(`${this.apiUrl}/student-assignment/${record.studentAssignmentId}`, {
              earnedPoints: newPoints,
              note: record.note || ""
          }));
          this.showMessage("Body uložené");
      } catch (e) {
          console.error(e);
          record.earnedPoints = oldPoints; 
          this.error = "Chyba pri ukladaní bodov!";
      } finally {
          this.isSaving = false;
      }
  }

  async onAttendanceClick(sessionId: number): Promise<void> {
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
          await lastValueFrom(this.http.put(`${this.apiUrl}/student-attendance/${record.id}`, {
              attendanceEnum: newStatus
          }));
          
          this.showMessage("Dochádzka zmenená");
          this.error = null;

      } catch (e) {
          console.error('Update failed', e);
          this.error = 'Zmena dochádzky zlyhala.';
          record.status = oldStatus;
      } finally {
          this.isSaving = false;
      }
  }

  showMessage(msg: string) {
      this.message = msg;
      setTimeout(() => this.message = null, 2000);
  }

  ngAfterViewChecked(): void {
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

  getPoints(assignmentId: number): string | number {
    if (!this.gradingRow?.studentAssignments) return '-';
    const record = this.gradingRow.studentAssignments.find(a => a.assignmentId === assignmentId);
    return record ? record.earnedPoints : '-';
  }

  getAttendanceStatus(sessionId: number): string {
    const record = this.attendanceMap.get(sessionId);
    if (!record) return '-';
    return this.translations[record.status] || record.status;
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PRÍTOMNÝ':
      case 'PRESENT': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      
      case 'NEPRÍTOMNÝ':
      case 'ABSENT': return 'bg-red-100 text-red-800 border border-red-200';
      
      case 'OSPRAVEDLNENÝ':
      case 'EXCUSED': return 'bg-amber-100 text-amber-800 border border-amber-200';
      
      case 'MEŠKANIE':
      case 'LATE': return 'bg-blue-100 text-blue-800 border border-blue-200';
      
      case 'NAHRADENÉ':
      case 'SUBSTITUTED': return 'bg-purple-100 text-purple-800 border border-purple-200';
      
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  }

  private formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return `${d.getDate()}.${d.getMonth() + 1}.`;
    } catch { return dateStr; }
  }

  onClose() {
    this.close.emit();
  }
}