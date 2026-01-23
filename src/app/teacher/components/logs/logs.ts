import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

interface UserDTO {
  id: number;
  fullName: string;
  email: string;
  roleEnum: string;
}

interface StudentAssignment {
  id: number;
  assignment?: { id?: number; name?: string }; 
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
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.html',
  styleUrl: './logs.css'
})
export class Logs implements OnInit {
  private http = inject(HttpClient);
  private logsApiUrl = 'http://localhost:8080/api/v1/student-assignment-log';

  public logs: LogEntry[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;

  public searchUpdatedBy: string = '';
  public sortField: string = 'updatedAt';
  public sortDir: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.fetchLogs();
  }

  async fetchLogs(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    let params = new HttpParams()
      .set('sort', `${this.sortField},${this.sortDir}`);

    if (this.searchUpdatedBy?.trim()) {
      params = params.set('updatedByUserFullName', this.searchUpdatedBy.trim());
    }

    try {
      const data = await lastValueFrom(
        this.http.get<LogEntry[]>(this.logsApiUrl, { params })
      );
      this.logs = data;
    } catch (err: any) {
      console.error('Chyba:', err);
      this.error = 'Nepodarilo sa načítať históriu zmien.';
    } finally {
      this.isLoading = false;
    }
  }

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
    this.fetchLogs();
  }
}