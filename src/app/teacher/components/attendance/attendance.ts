import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; 
import { lastValueFrom } from 'rxjs'; 
import { FormsModule } from '@angular/forms'; 
import { TeacherContextService, ExerciseSession as ContextExercise } from '../../../services/teacher-context';


// --- Interfacey (Backend DTOs) ---

interface AttendanceItemDto {
  attendanceId: number;
  attendance: string; 
  // Ak backend pošle, použijeme to pre číslo týždňa
  exerciseSessionId?: number; 
  // Ak backend pošle, použijeme to pre dátum
  sessionDate?: string;
}

interface StudentRowDto {
  studentId?: number; 
  studentFullName: string;
  studentAttendances: AttendanceItemDto[];
  aisId?: number; 
}

// --- Interfacey (Frontend UI) ---

interface Student {
  id: number; // Syntetické ID (index) pre frontend
  fullName: string;
  aisId?: number; 
}

interface SessionColumn {
  id: number;
  label: string; // Text v hlavičke (napr. "Týždeň 7")
  date?: string; // Pre zoradenie
}

interface AttendanceRecord {
  id: number | null; // Skutočné ID záznamu (pre PUT)
  attendanceEnum: string;
  studentId: number;
  sessionId: number;
}

// Interface pre Update (PUT)
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
  private apiUrl = 'http://localhost:8080/api/v1'; 

  // Dáta pre tabuľku
  public uniqueStudents: Student[] = [];
  public uniqueSessions: SessionColumn[] = [];
  
  // Mapa pre rýchle vyhľadávanie: "studentId_sessionId" -> Záznam
  public attendanceMap = new Map<string, AttendanceRecord>();
  public attendanceOptions: string[] = []; 

  // Stavy
  public isLoading: boolean = false;
  public error: string | null = null;
  public showFullHistory: boolean = false; // Default: Zobraz len aktuálny týždeň
  
  private processingSet = new Set<string>(); // Zámok proti double-clickom

  constructor() {
    // Sleduje zmenu cvičenia v Headeri
    effect(() => {
      const selectedEx = this.contextService.selectedExercise() as ContextExercise | null;
      
      if (selectedEx && selectedEx.exerciseId) {
        // Pri zmene cvičenia resetneme na "Aktuálny týždeň"
        this.showFullHistory = false;
        console.log('Načítavam skupinu ID:', selectedEx.exerciseId);
        this.fetchAttendance(selectedEx.exerciseId);
      } else {
        this.clearTable();
      }
    });
  }

  ngOnInit(): void {
    this.fetchEnums(); 
  }

  async fetchEnums(): Promise<void> {
    try {
      const enums = await lastValueFrom(this.http.get<string[]>(`${this.apiUrl}/enum/attendance`));
      this.attendanceOptions = enums || [];
    } catch (err) {
      this.attendanceOptions = ['PRESENT', 'ABSENT', 'SUBSTITUTED']; 
    }
  }
  
  // Prepínač História / Aktuálny
  toggleHistory(): void {
    this.showFullHistory = !this.showFullHistory;
    this.fetchAttendance();
  }

  async fetchAttendance(exerciseId?: number): Promise<void> {
    this.isLoading = true;
    this.clearTable();
    this.error = null;

    const currentEx = this.contextService.selectedExercise() as ContextExercise | null;
    const targetId = exerciseId ?? currentEx?.exerciseId;

    if (!targetId) {
        this.isLoading = false;
        return;
    }
    
    // Logika parametra 'current'
    // showFullHistory = false => current = true
    // showFullHistory = true  => current = false
    const isCurrentParam = !this.showFullHistory;

    try {
      const url = `${this.apiUrl}/student-attendance/attendance?exerciseId=${targetId}&current=${isCurrentParam}`;

      const data = await lastValueFrom(
        this.http.get<StudentRowDto[]>(url)
      );
      
      this.processData(data);

    } catch (err) {
      this.error = 'Nepodarilo sa načítať záznamy.';
    } finally {
      this.isLoading = false;
    }
  }

  // --- Spracovanie dát a výroba stĺpcov ---
  private processData(rows: StudentRowDto[]): void {
    const studentsTemp: Student[] = [];
    const sessionsMap = new Map<number, SessionColumn>(); 

    rows.forEach((row, index) => {
      
      // Vyrobíme ID pre frontend (0, 1, 2...) ak chýba studentId
      const syntheticStudentId = row.studentId !== undefined ? row.studentId : index;

      const studentObj: Student = {
        id: syntheticStudentId, 
        fullName: row.studentFullName,
        aisId: row.aisId 
      };
      studentsTemp.push(studentObj);

      if (row.studentAttendances && row.studentAttendances.length > 0) {
        row.studentAttendances.forEach((att, attIndex) => {
            
            // Vyrobíme ID pre stĺpec (alebo použijeme existujúce)
            const syntheticSessionId = (att as any).exerciseSessionId || (attIndex + 1);

            // A. Vytvorenie hlavičky stĺpca (ak ešte nie je)
            if (!sessionsMap.has(syntheticSessionId)) {
                
                let columnLabel = '';
                
                if (att.sessionDate) {
                    const formattedDate = this.formatDate(att.sessionDate);
                    columnLabel = `${formattedDate} (${syntheticSessionId}. týždeň)`;
                } else {
                    columnLabel = `Týždeň ${syntheticSessionId}`;
                }

                sessionsMap.set(syntheticSessionId, {
                    id: syntheticSessionId,
                    label: columnLabel,
                    date: att.sessionDate
                });
            }

            // B. Uloženie záznamu do mapy
            const key = this.getMapKey(syntheticStudentId, syntheticSessionId);
            
            const record: AttendanceRecord = {
              id: att.attendanceId, // ID pre backend update
              attendanceEnum: att.attendance,
              studentId: syntheticStudentId,
              sessionId: syntheticSessionId
            };
            
            this.attendanceMap.set(key, record);
        });
      }
    });

    // Zoradenie študentov
    this.uniqueStudents = studentsTemp.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    
    // Zoradenie stĺpcov
    this.uniqueSessions = Array.from(sessionsMap.values()).sort((a, b) => {
        if (a.date && b.date) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        return a.id - b.id;
    });
  }

  private formatDate(dateStr: string): string {
      try {
          const d = new Date(dateStr);
          return `${d.getDate()}.${d.getMonth() + 1}.`;
      } catch {
          return dateStr;
      }
  }

  private getMapKey(studentId: number | string, sessionId: number | string): string {
    return `${String(studentId)}_${String(sessionId)}`;
  }

  getRecord(studentId: number, sessionId: number): AttendanceRecord | undefined {
    return this.attendanceMap.get(this.getMapKey(studentId, sessionId));
  }

  // --- Kliknutie na bunku ---
  async onCellClick(student: Student, session: SessionColumn): Promise<void> {
    if (this.attendanceOptions.length === 0) return;

    const key = this.getMapKey(student.id, session.id);
    if (this.processingSet.has(key)) return;
    this.processingSet.add(key);

    const currentRecord = this.attendanceMap.get(key);
    
    // Validácia: Musíme mať ID záznamu
    if (!currentRecord || !currentRecord.id) {
        console.error("Chýba attendanceId, nemôžem aktualizovať.");
        this.processingSet.delete(key);
        return;
    }

    const oldStatus = currentRecord.attendanceEnum;
    const currentIndex = this.attendanceOptions.indexOf(currentRecord.attendanceEnum);
    const nextIndex = (currentIndex + 1) % this.attendanceOptions.length;
    const nextStatus = this.attendanceOptions[nextIndex];

    // Optimistický update v UI
    const updatedRecord = { ...currentRecord, attendanceEnum: nextStatus };
    this.attendanceMap.set(key, updatedRecord);

    try {
      // PUT Request s novou hodnotou
      const url = `${this.apiUrl}/student-attendance/${currentRecord.id}`;
      
      const payload: UpdateAttendanceRequest = {
        attendanceEnum: nextStatus
      };

      console.log(`PUT ${url}`, payload);

      await lastValueFrom(this.http.put(url, payload));

    } catch (err) {
      console.error(err);
      // Rollback pri chybe
      this.attendanceMap.set(key, { ...currentRecord, attendanceEnum: oldStatus });
      this.error = 'Uloženie zlyhalo.';
    } finally {
      this.processingSet.delete(key);
    }
  }

  getStatusColor(status: string): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'PRESENT': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ABSENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'SUBSTITUTED': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  getStudentFullName(s: Student): string {
      return s.fullName || `ID: ${s.id}`;
  }

  private clearTable() {
    this.attendanceMap.clear();
    this.uniqueStudents = [];
    this.uniqueSessions = [];
  }
}