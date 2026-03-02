import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TeacherContextService } from '../../../core/context/teacher-context.service';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/logging/logger.service';
import { StudentDto, ApiResponse } from '../../../shared/models/interfaces';


interface UploadPayload {
  exerciseId: number;
  students: StudentDto[];
}

@Component({
  selector: 'app-student-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-upload.html',
})
export class StudentUploadComponent {
  public readonly contextService = inject(TeacherContextService);
 private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  public readonly parsedStudents = signal<StudentDto[]>([]);
  public readonly isUploading = signal(false);
  public readonly uploadStatus = signal<'idle' | 'success' | 'error'>('idle');
  public readonly  errorMessage = signal<string>('');

  constructor() {
    effect(() => {
      const currentExercise = this.contextService.selectedExercise();
      this.errorMessage.set('');
      this.uploadStatus.set('idle');
    }, { allowSignalWrites: true });
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.errorMessage.set('');
    this.uploadStatus.set('idle');

    this.logger.log('File selected for processing');
    const file = input.files[0];
    const reader = new FileReader();

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.logger.warn('Invalid file format selected:', file.name);
      this.errorMessage.set('Chyba: Povolený je iba formát .csv!');
      this.uploadStatus.set('error');
      input.value = ''; 
      return;
    }

    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCSV(text);
    };
    reader.onerror = () => {
        this.errorMessage.set('Chyba pri čítaní súboru.');
        this.uploadStatus.set('error');
    };

    reader.readAsText(file, 'windows-1250'); 
  }

  private parseCSV(csvText: string) {
    const lines = csvText.split('\n');
    const students: StudentDto[] = [];

    this.parsedStudents.set([]);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(';');

      if (cols.length >= 3) {
        
        const rawName = cols[1].trim();
        const rawId = cols[2].trim();

        const parsedId = parseInt(rawId, 10);

        if (!isNaN(parsedId) && rawName) {
          students.push({
            fullName: rawName,
            aisId: parsedId
          });
        }
      }
    }
    if (students.length === 0) {
        this.errorMessage.set('Súbor neobsahuje žiadnych platných študentov alebo má zlý formát.');
        this.uploadStatus.set('error');
        return;
    }

    this.logger.log(`Parsed ${students.length} students from CSV`);
    this.parsedStudents.set(students);
    this.uploadStatus.set('idle');
  }

  public uploadData() {
    const currentExercise = this.contextService.selectedExercise();
    
    if (!currentExercise) {
      this.logger.warn('Upload attempted without selected exercise');
      this.errorMessage.set('Musíte vybrať cvičenie v hornej lište!');
      this.uploadStatus.set('error');
      return;
    }

    if (this.parsedStudents().length === 0) return;

   this.isUploading.set(true);
    this.errorMessage.set('');

    const payload: UploadPayload = {
      exerciseId: currentExercise.exerciseId,
      students: this.parsedStudents()
    };

    this.logger.log('Initiating student upload', payload);


    this.http.post<ApiResponse<unknown>>(`${environment.apiUrl}/api/v1/student`, payload,)
      .subscribe({
        next: () => {
          this.logger.log('Student upload successful');
          this.isUploading.set(false);
          this.uploadStatus.set('success');
          this.parsedStudents.set([]);
        },
        error: (err) => {
          this.logger.error('Student upload failed', err);
          this.isUploading.set(false);
          this.uploadStatus.set('error');
          this.errorMessage.set('Nepodarilo sa uložiť študentov. Skontrolujte konzolu.');
        }
      });
  }
}