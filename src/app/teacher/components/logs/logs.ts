import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { lastValueFrom, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';

export interface LogEntry {
  id: number;
  studentFullName: string;
  studentAisId: number;
  blockName: string;
  assignmentName: string;
  originalPoints: number;
  updatedPoints: number;
  originalUserFullName: string;
  updatedByUserFullName: string;
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
  private logger = inject(LoggerService);
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

  public ngOnInit(): void {
    this.logger.log('Logs component initialized');
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.fetchLogs();
    });

    this.fetchLogs();
  }

  public ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  public onSearchInput(): void {
    this.searchSubject.next();
  }

  private async fetchLogs(): Promise<void> {
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

    this.logger.log(`Fetching logs. Sort: ${this.sortField} ${this.sortDir}, UpdatedBy: ${this.searchUpdatedBy}, OriginalBy: ${this.searchOriginalBy}`);

    try {
      const data = await lastValueFrom(
        this.http.get<LogEntry[]>(this.logsApiUrl, { params })
      );
      this.logs = data;
      this.logger.log(`Logs loaded: ${this.logs.length} entries`);
    } catch (err: unknown) {
      this.logger.error('Failed to load logs', err);
      this.error = 'Nepodarilo sa načítať históriu zmien.';
    } finally {
      this.isLoading = false;
    }
  }

  public toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'desc';
    }
    this.logger.log(`Sorting changed to ${this.sortField} ${this.sortDir}`);
    this.fetchLogs();
  }
}