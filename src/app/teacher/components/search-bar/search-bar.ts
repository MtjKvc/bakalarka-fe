import { Component, inject, OnDestroy, ElementRef, HostListener, Output, EventEmitter, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { StudentBasic, ApiResponse } from '../../../shared/models/interfaces';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.html',
})
export class SearchBar implements OnDestroy {

  private http = inject(HttpClient);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private logger = inject(LoggerService);
  
  private apiUrl = `${environment.apiUrl}/api/v1/student`;

  @Output() public studentSelected = new EventEmitter<StudentBasic>();

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription;

  public searchTerm: string = '';
  public results: StudentBasic[] = [];
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

  public onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  private fetchStudents(term: string): Observable<StudentBasic[]> {
    const url = `${this.apiUrl}/search?q=${encodeURIComponent(term.trim())}`;
    
    return this.http.get<StudentBasic[]>(url).pipe(
        map(response => response || [])
    );
  }

  public selectStudent(student: StudentBasic): void {
    this.logger.log('Student selected from dropdown', student);
    this.searchTerm = student.fullName; 
    this.showDropdown = false;
    this.clearSearch();
    this.studentSelected.emit(student);
  }

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.showDropdown) {
          this.showDropdown = false;
      }
    }
    this.clearSearch();
  }

  public onFocus() {
      if (this.searchTerm.length >= 1) {
          this.showDropdown = true;
      }
  }
  public clearSearch(){
    this.searchTerm= '';
  }

  public ngOnDestroy() {
    this.logger.log('SearchBar component destroyed');
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}