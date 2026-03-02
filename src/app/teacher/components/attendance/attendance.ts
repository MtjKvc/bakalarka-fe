import { Component, OnInit, inject, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../core/context/teacher-context.service';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { AttendanceItemDto,StudentBasic,SessionColumn,ApiResponse } from '../../../shared/models/interfaces';

interface StudentRowDto {
  studentId?: number;
  studentFullName: string;
  studentAttendances: AttendanceItemDto[];
  aisId?: number;
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

  public uniqueStudents: StudentBasic[] = [];
  public uniqueSessions: SessionColumn[] = [];

  public attendanceMap = new Map<string, AttendanceRecord>();
  public attendanceOptions: string[] = [];

  public isLoading: boolean = false;
  public error: string | null = null;
  public showFullHistory: boolean = false;

  private processingSet = new Set<string>();

  private translations: Record<string, string> = {
    'PRESENT': 'Prítomný',
    'ABSENT': 'Neprítomný',
    'SUBSTITUTED': 'Nahradené'
  };

  @ViewChild('errorContainer') set errorContent(content: ElementRef){
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
      const selectedEx = this.contextService.selectedExercise() as ContextExercise | null;

      if (selectedEx && selectedEx.exerciseId) {
        this.showFullHistory = false;
        this.logger.log('Načítavam skupinu ID:', selectedEx.exerciseId);
        this.fetchAttendance(selectedEx.exerciseId);
      } else {
        this.clearTable();
      }
    });
  }

  public ngOnInit(): void {
    this.logger.log('Attendance initialized');
    this.fetchEnums();
  }

  private async fetchEnums(): Promise<void> {
    try {
      const enums = await lastValueFrom(this.http.get<string[]>(`${this.apiUrl}/enum/attendance`));
      this.attendanceOptions = enums || [];
    } catch (err) {
      this.logger.warn('Failed to fetch enums', err);
      this.attendanceOptions = ['ABSENT', 'PRESENT', 'SUBSTITUTED'];
    }
  }

  public toggleHistory(): void {
    this.showFullHistory = !this.showFullHistory;
    this.logger.log(`Toggling history: ${this.showFullHistory}`);
    this.fetchAttendance();
  }

  private async fetchAttendance(exerciseId?: number): Promise<void> {
    this.isLoading = true;
    this.clearTable();
    this.error = null;

    const currentEx = this.contextService.selectedExercise() as ContextExercise | null;
    const targetId = exerciseId ?? currentEx?.exerciseId;

    if (!targetId) {
      this.isLoading = false;
      return;
    }

    const isCurrentParam = !this.showFullHistory;

    try {
      const url = `${this.apiUrl}/student-attendance/attendance?exerciseId=${targetId}&current=${isCurrentParam}`;

      const data = await lastValueFrom(
        this.http.get<StudentRowDto[]>(url)
      );
      const rows = data || [];
      this.logger.log(`Attendance data loaded: ${rows.length || 0} rows`);
      this.processData(rows);

    } catch (err) {
      this.logger.error('Nepodarilo sa načítať záznamy', err);
      this.error = 'Nepodarilo sa načítať záznamy.';
    } finally {
      this.isLoading = false;
    }
  }

  private processData(rows: StudentRowDto[]): void {
    const studentsTemp: StudentBasic[] = [];
    const sessionsMap = new Map<number, SessionColumn>();

    rows.forEach((row, index) => {

      const syntheticStudentId = row.studentId !== undefined ? row.studentId : index;

      const studentObj: StudentBasic = {
        id: syntheticStudentId,
        fullName: row.studentFullName,
        aisId: row.aisId
      };
      studentsTemp.push(studentObj);

      if (row.studentAttendances && row.studentAttendances.length > 0) {
        row.studentAttendances.forEach((att, attIndex) => {

          const syntheticSessionId = att.exerciseSessionId || (attIndex + 1);

          if (!sessionsMap.has(syntheticSessionId)) {

            let columnLabel = '';

            if (this.showFullHistory) {
                columnLabel = `${syntheticSessionId}. týž.`;
            } else {
              columnLabel = 'Aktuálny týždeň';
            }

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

    this.uniqueSessions = Array.from(sessionsMap.values()).sort((a, b) => {
      return a.id - b.id;
    });
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
      this.logger.error("Chýba attendanceId, nemôžem aktualizovať.", { student, session });
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

      const payload: UpdateAttendanceRequest = {
        attendanceEnum: nextStatus
      };

      this.logger.log(`PUT ${url}`, payload);

      await lastValueFrom(this.http.put<ApiResponse<unknown>>(url, payload));

    } catch (err) {
      this.logger.error('Update failed', err);
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

    return 'bg-gray-100 text-gray-500 border-gray-200';
  }

  public getStudentFullName(s: StudentBasic): string {
    return s.fullName || `ID: ${s.id}`;
  }


  private clearTable() {
    this.attendanceMap.clear();
    this.uniqueStudents = [];
    this.uniqueSessions = [];
  }
}