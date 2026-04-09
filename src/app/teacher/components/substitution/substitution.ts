import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { Attendance } from '../attendance/attendance';
import { GradingComponent } from '../grading/grading';

export interface SubstitutionDTO {
  id: number;
  sessionDay: string;
  startTime: string;
  roomEnum: string;
  leaderFullName: string;
}

type TabType = 'attendance' | 'grading';

@Component({
  selector: 'app-substitution',
  standalone: true,
  imports: [CommonModule, Attendance, GradingComponent],
  templateUrl: './substitution.html',
})
export class SubstitutionComponent implements OnInit {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  private apiUrl = `${environment.apiUrl}/api/v1/exercise/substitution`;

  private readonly STORAGE_KEY_SUB = 'substitution_selected_id';
  private readonly STORAGE_KEY_TAB = 'substitution_active_tab';
  private readonly STORAGE_KEY_BLOCK = 'substitution_selected_block';

  public substitutions: SubstitutionDTO[] = [];
  public isLoading: boolean = false;
  public error: string | null = null;

  public selectedSubstitution: SubstitutionDTO | null = null;
  public activeTab: TabType = 'attendance';
  public selectedBlockId: number | null = null;

  public ngOnInit(): void {
    this.fetchSubstitutions();
  }

  private async fetchSubstitutions(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const data = await lastValueFrom(
        this.http.get<SubstitutionDTO[]>(this.apiUrl)
      );
      this.substitutions = data || [];
      this.restoreState();
    } catch (err: unknown) {
      this.logger.error('Failed to load substitutions', err);
      this.error = 'Nepodarilo sa načítať zoznam cvičení.';
    } finally {
      this.isLoading = false;
    }
  }

  
  private restoreState(): void {
    const savedSubId = sessionStorage.getItem(this.STORAGE_KEY_SUB);
    const savedTab = sessionStorage.getItem(this.STORAGE_KEY_TAB) as TabType;
    const savedBlockId = sessionStorage.getItem(this.STORAGE_KEY_BLOCK);
    if (savedSubId) {
      const foundSub = this.substitutions.find(s => s.id === Number(savedSubId));
      
      if (foundSub) {
        this.selectedSubstitution = foundSub;
        this.activeTab = savedTab || 'attendance';
        this.selectedBlockId = savedBlockId ? Number(savedBlockId) : null;
        this.loadDetailsForSubstitution(foundSub.id);
      } else {
        this.clearState();
      }
    }
  }

  private saveState(): void {
    if (!this.selectedSubstitution) return;

    sessionStorage.setItem(this.STORAGE_KEY_SUB, this.selectedSubstitution.id.toString());
    sessionStorage.setItem(this.STORAGE_KEY_TAB, this.activeTab);

    if (this.selectedBlockId !== null) {
      sessionStorage.setItem(this.STORAGE_KEY_BLOCK, this.selectedBlockId.toString());
    } else {
      sessionStorage.removeItem(this.STORAGE_KEY_BLOCK);
    }
  }

  private clearState(): void {
    sessionStorage.removeItem(this.STORAGE_KEY_SUB);
    sessionStorage.removeItem(this.STORAGE_KEY_TAB);
    sessionStorage.removeItem(this.STORAGE_KEY_BLOCK);
    this.selectedBlockId = null;
  }

  public onSelectSubstitution(sub: SubstitutionDTO): void {
    this.logger.log('Opening details for substitution:', sub.id);
    this.selectedSubstitution = sub;
    this.activeTab = 'attendance'; 
    this.selectedBlockId = null;
    
    this.saveState();
    this.loadDetailsForSubstitution(sub.id);
  }

  public closeDetail(): void {
    this.selectedSubstitution = null;
    this.clearState();
  }

  public switchTab(tab: TabType): void {
    this.activeTab = tab;
    this.saveState();
  }

  public selectBlock(blockId: number): void {
    this.selectedBlockId = blockId;
    this.saveState();
  }

  private loadDetailsForSubstitution(substitutionId: number): void {
    this.logger.log(`Fetching students and blocks for substitution ID: ${substitutionId}`);
  }
}