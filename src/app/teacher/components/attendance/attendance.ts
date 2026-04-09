import { Component, OnInit, inject, effect, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../core/context/teacher-context.service';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { AttendanceItemDto, StudentBasic, SessionColumn, ApiResponse } from '../../../shared/models/interfaces';

interface BlockDto {
  id: number;
  name: string;
  maxPoints: number;
  requiredPoints: number;
}

interface BlockPointDto {
  blockId: number;
  blockPoints: number;
}

interface StudentRowDto {
  studentId?: number;
  studentFullName: string;
  studentAttendances: AttendanceItemDto[];
  aisId?: number;
  allBlockPoints?: BlockPointDto[];
}

interface AttendanceRecord {
  id: number | null;
  attendanceEnum: string;
  studentId: number;
  sessionId: number;
}

interface UpdateAttendanceRequest {
  attendanceEnum: string;
}

interface AttendanceStudent extends StudentBasic {
  allBlockPoints?: BlockPointDto[];
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class Attendance implements OnInit {

  private http = inject(HttpClient);
  public contextService = inject(TeacherContextService);
  private logger = inject(LoggerService);
  private apiUrl = `${environment.apiUrl}/api/v1`;

  public uniqueStudents: AttendanceStudent[] = [];
  public uniqueSessions: SessionColumn[] = [];
  public attendanceMap = new Map<string, AttendanceRecord>();
  public attendanceOptions: string[] = [];
  public blockNamesMap = new Map<number, string>();

  public isLoading: boolean = false;
  public error: string | null = null;
  private processingSet = new Set<string>();

  private translations: Record<string, string> = {
    'PRESENT': 'Prítomný',
    'ABSENT': 'Neprítomný',
    'SUBSTITUTED': 'Nahradené',
    'EXCUSED': 'Ospravedlnené'
  };

  @Input() explicitExerciseId?: number;

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

  constructor() {
    effect(() => {
      if (this.explicitExerciseId) return;

      const selectedEx = this.contextService.selectedExercise() as ContextExercise | null;
      
      if (selectedEx && selectedEx.exerciseId) {
        this.fetchAttendance(selectedEx.exerciseId);
      } else {
        this.clearTable();
      }
    });
  }

  public ngOnInit(): void {
    this.fetchEnums();
    this.fetchBlocks();

    if (this.explicitExerciseId) {
      this.fetchAttendance(this.explicitExerciseId);
    }
  }

  private async fetchEnums(): Promise<void> {
    try {
      const enums = await lastValueFrom(this.http.get<string[]>(`${this.apiUrl}/enum/attendance`));
      this.attendanceOptions = enums || [];
    } catch (err) {
      this.attendanceOptions = ['ABSENT', 'PRESENT', 'SUBSTITUTED', 'EXCUSED'];
    }
  }

  private async fetchBlocks(): Promise<void> {
    try {
      const blocks = await lastValueFrom(this.http.get<BlockDto[]>(`${this.apiUrl}/block`));
      if (blocks) {
        blocks.forEach(b => this.blockNamesMap.set(b.id, b.name));
      }
    } catch (err) {
      this.logger.warn('Failed to fetch blocks', err);
    }
  }

  public toggleHistory(): void {
    const currentValue = this.contextService.showAttendanceHistory();
    this.contextService.setShowAttendanceHistory(!currentValue);
    
    if (this.explicitExerciseId) {
        this.fetchAttendance(this.explicitExerciseId);
    }
  }

  private async fetchAttendance(exerciseId?: number): Promise<void> {
    this.isLoading = true;
    this.clearTable();
    this.error = null;

    let targetId = this.explicitExerciseId ?? exerciseId;
    
    if (!targetId) {
      const currentEx = this.contextService.selectedExercise() as ContextExercise | null;
      targetId = currentEx?.exerciseId;
    }

    if (!targetId) {
      this.isLoading = false;
      return;
    }

    const isCurrentParam = !this.contextService.showAttendanceHistory();

    try {
      const url = `${this.apiUrl}/student-attendance/attendance?exerciseId=${targetId}&current=${isCurrentParam}`;
      const data = await lastValueFrom(this.http.get<StudentRowDto[]>(url));
      this.processData(data || []);
    } catch (err) {
      this.error = 'Nepodarilo sa načítať záznamy.';
    } finally {
      this.isLoading = false;
    }
  }

  private processData(rows: StudentRowDto[]): void {
    const studentsTemp: AttendanceStudent[] = [];
    const sessionsMap = new Map<number, SessionColumn>();

    rows.forEach((row, index) => {
      const syntheticStudentId = row.studentId !== undefined ? row.studentId : index;

      const studentObj: AttendanceStudent = {
        id: syntheticStudentId,
        fullName: row.studentFullName,
        aisId: row.aisId,
        allBlockPoints: row.allBlockPoints || []
      };
      studentsTemp.push(studentObj);

      if (row.studentAttendances && row.studentAttendances.length > 0) {
        row.studentAttendances.forEach((att, attIndex) => {
          const syntheticSessionId = att.exerciseSessionId || (attIndex + 1);

          if (!sessionsMap.has(syntheticSessionId)) {
            let columnLabel = this.contextService.showAttendanceHistory() ? `${syntheticSessionId}. týž.` : 'Aktuálny týždeň';
            
            sessionsMap.set(syntheticSessionId, {
              id: syntheticSessionId,
              label: columnLabel,
            });
          }

          const key = this.getMapKey(syntheticStudentId, syntheticSessionId);

          const record: AttendanceRecord = {
            id: att.attendanceId,
            attendanceEnum: att.attendance,
            studentId: syntheticStudentId,
            sessionId: syntheticSessionId
          };

          this.attendanceMap.set(key, record);
        });
      }
    });

    this.uniqueStudents = studentsTemp.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    this.uniqueSessions = Array.from(sessionsMap.values()).sort((a, b) => a.id - b.id);
  }

  private getMapKey(studentId: number | string, sessionId: number | string): string {
    return `${String(studentId)}_${String(sessionId)}`;
  }

  public getRecord(studentId: number, sessionId: number): AttendanceRecord | undefined {
    return this.attendanceMap.get(this.getMapKey(studentId, sessionId));
  }

  public async onCellClick(student: StudentBasic, session: SessionColumn): Promise<void> {
    this.error = null;
    if (this.attendanceOptions.length === 0) return;

    const key = this.getMapKey(student.id, session.id);
    if (this.processingSet.has(key)) return;
    this.processingSet.add(key);

    const currentRecord = this.attendanceMap.get(key);

    if (!currentRecord || !currentRecord.id) {
      this.processingSet.delete(key);
      return;
    }

    const oldStatus = currentRecord.attendanceEnum;
    const currentIndex = this.attendanceOptions.indexOf(currentRecord.attendanceEnum);
    const nextIndex = (currentIndex + 1) % this.attendanceOptions.length;
    const nextStatus = this.attendanceOptions[nextIndex];

    const updatedRecord = { ...currentRecord, attendanceEnum: nextStatus };
    this.attendanceMap.set(key, updatedRecord);

    try {
      const url = `${this.apiUrl}/student-attendance/${currentRecord.id}`;
      const payload: UpdateAttendanceRequest = { attendanceEnum: nextStatus };
      await lastValueFrom(this.http.put<ApiResponse<unknown>>(url, payload));
    } catch (err) {
      this.attendanceMap.set(key, { ...currentRecord, attendanceEnum: oldStatus });
      this.error = 'Uloženie zlyhalo.';
    } finally {
      this.processingSet.delete(key);
    }
  }

  public getTranslation(status: string): string {
    return this.translations[status] || status;
  }

  public getStatusColor(status: string): string {
    if (!status) return 'bg-gray-100 text-gray-500 border-gray-200';

    const s = status.toUpperCase();
    if (s === 'PRESENT' || s === 'PRÍTOMNÝ') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'ABSENT' || s === 'NEPRÍTOMNÝ') return 'bg-red-100 text-red-800 border-red-200';
    if (s === 'SUBSTITUTED' || s === 'NAHRADENÉ') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (s === 'EXCUSED' || s === 'OSPRAVEDLNENÉ') return 'bg-yellow-100 text-yellow-800 border-yellow-200';

    return 'bg-gray-100 text-gray-500 border-gray-200';
  }

  public getStudentFullName(s: StudentBasic): string {
    return s.fullName || `ID: ${s.id}`;
  }

  public getBlockName(blockId: number): string {
    return this.blockNamesMap.get(blockId) || `Blok ${blockId}`;
  }

  private clearTable() {
    this.attendanceMap.clear();
    this.uniqueStudents = [];
    this.uniqueSessions = [];
  }
}