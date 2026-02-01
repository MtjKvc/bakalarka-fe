import { Component, inject, OnDestroy, ElementRef, HostListener, Output, EventEmitter, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger';

interface StudentSearchResult {
  id: number;
  fullName: string;
  aisId?: number;
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css'
})
export class SearchBar implements OnDestroy {


  
  private http = inject(HttpClient);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  
  private apiUrl = `${environment.apiUrl}/api/v1/student`;

  @Output() studentSelected = new EventEmitter<StudentSearchResult>();

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;

  public searchTerm: string = '';
  public results: StudentSearchResult[] = [];
  public isLoading: boolean = false;
  public showDropdown: boolean = false;

  constructor() {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged(), 
      tap((term) => {
          this.logger.log(`Starting search for: "${term}"`);
          this.isLoading = true;
          this.showDropdown = true;
          this.cdr.markForCheck(); 
      }),
      switchMap((term) => {
        if (!term || term.trim().length < 1) {
            return of([]); 
        }
        return this.fetchStudents(term).pipe(
            catchError(err => {
                this.logger.error('Search API error', err);
                return of([]); 
            })
        );
      })
    ).subscribe((data) => {
      this.logger.log(`Search results: ${data?.length || 0} items found`);
      this.results = data || [];
      this.isLoading = false;
      this.cdr.detectChanges(); 
    });
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  private fetchStudents(term: string) {
    const url = `${this.apiUrl}/search?q=${encodeURIComponent(term.trim())}`;
    return this.http.get<StudentSearchResult[]>(url);
  }

  selectStudent(student: StudentSearchResult): void {
    this.logger.log('Student selected from dropdown', student);
    this.searchTerm = student.fullName; 
    this.showDropdown = false;
    this.studentSelected.emit(student);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.showDropdown) {
          this.showDropdown = false;
      }
    }
  }

  onFocus() {
      if (this.searchTerm.length >= 1) {
          this.showDropdown = true;
      }
  }

  ngOnDestroy() {
    this.logger.log('SearchBar component destroyed');
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}