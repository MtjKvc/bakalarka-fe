import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// Interface podľa tvojho JSON výstupu
interface UserDTO {
  id: number;
  fullName: string;
  email: string;
  roleEnum: string;
}

interface StudentAssignment {
  id: number;
  // Keďže v JSONe boli objekty prázdne {}, používam voliteľné typy pre istotu
  assignment?: { id?: number; title?: string }; 
  student?: { id?: number; fullName?: string };
  note: string;
  earnedPoints: number;
}

interface LogEntry {
  id: number;
  studentAssignment: StudentAssignment;
  originalPoints: number;
  updatedPoints: number;
  originalUser?: UserDTO;
  updatedByUser: UserDTO;
  updatedAt: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logs.html',
  styleUrl: './logs.css'
})
export class Logs implements OnInit {
  private http = inject(HttpClient);
  
  private logsApiUrl = 'http://localhost:8080/api/v1/student-assignment-log';

  public logs: LogEntry[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;

  ngOnInit(): void {
    this.fetchLogs();
  }

  async fetchLogs(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    
    // Pridané sortovanie, aby najnovšie logy boli hore (ak to API podporuje, inak sortneme v JS)
    const apiUrl = `${this.logsApiUrl}`; 

    try {
      // Očakávame pole objektov priamo, podľa tvojho JSONu
      const data = await lastValueFrom(this.http.get<LogEntry[]>(apiUrl));
      
      // Sortovanie na klientoch (najnovšie hore)
      this.logs = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
    } catch (err: any) {
      console.error('Nepodarilo sa načítať logy:', err);
      this.error = 'Nepodarilo sa načítať históriu zmien z API.';
      this.logs = [];
    } finally {
      this.isLoading = false;
    }
  }

  // Pomocná metóda na zistenie rozdielu bodov
  getPointDiff(log: LogEntry): number {
    return log.updatedPoints - log.originalPoints;
  }
}