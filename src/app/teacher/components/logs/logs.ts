import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface UserDTO {
  id: number;
  fullName: string;
  email: string;
  roleEnum: string;
}

interface BlockDTO {
  id: number;
  name: string;
}

interface AssignmentDTO {
  id?: number;
  name?: string;
  block?: BlockDTO;
}

interface StudentAssignment {
  id: number;
  assignment?: AssignmentDTO; 
  student?: { id?: number; fullName?: string; aisId?: number };
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
export class Logs implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private logsApiUrl = `${environment.apiUrl}/api/v1/student-assignment-log`;

  public logs: LogEntry[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;

  public searchUpdatedBy: string = '';
  public searchOriginalBy: string = '';
  
  public sortField: string = 'updatedAt';
  public sortDir: 'asc' | 'desc' = 'desc';

  private searchSubject = new Subject<void>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.fetchLogs();
    });

    this.fetchLogs();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(): void {
    this.searchSubject.next();
  }

  async fetchLogs(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    let params = new HttpParams()
      .set('sort', `${this.sortField},${this.sortDir}`);

    if (this.searchUpdatedBy?.trim()) {
      params = params.set('updatedByUserFullName', this.searchUpdatedBy.trim());
    }

    if (this.searchOriginalBy?.trim()) {
      params = params.set('originalUserFullName', this.searchOriginalBy.trim());
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