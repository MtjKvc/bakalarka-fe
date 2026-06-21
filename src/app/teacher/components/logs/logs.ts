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

export interface PaginatedLogsResponse {
  data: LogEntry[];
  meta: {
    page: number;
    totalPages: number;
  };
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

  public currentPage: number = 0;
  public totalPages: number = 0;
  public pageSize: number = 20;

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
    this.currentPage = 0;
    this.searchSubject.next();
  }

  private async fetchLogs(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    let params = new HttpParams()
      .set('sort', `${this.sortField},${this.sortDir}`)
      .set('page', this.currentPage)
      .set('size', this.pageSize);

    if (this.searchUpdatedBy?.trim()) {
      params = params.set('updatedByUserFullName', this.searchUpdatedBy.trim());
    }

    if (this.searchOriginalBy?.trim()) {
      params = params.set('originalUserFullName', this.searchOriginalBy.trim());
    }

    this.logger.log(`Fetching logs. Page: ${this.currentPage}, Sort: ${this.sortField} ${this.sortDir}`);

    try {
      const response = await lastValueFrom(
        this.http.get<PaginatedLogsResponse>(this.logsApiUrl, { params })
      );
      
      this.logs = response.data;
      this.currentPage = response.meta.page;
      this.totalPages = response.meta.totalPages;
      
      this.logger.log(`Logs loaded: ${this.logs.length} entries. Page ${this.currentPage + 1}/${this.totalPages}`);
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
    this.currentPage = 0;
    this.logger.log(`Sorting changed to ${this.sortField} ${this.sortDir}`);
    this.fetchLogs();
  }

  public prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchLogs();
    }
  }

  public nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.fetchLogs();
    }
  }
}