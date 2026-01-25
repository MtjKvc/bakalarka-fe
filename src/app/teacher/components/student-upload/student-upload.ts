import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TeacherContextService } from '../../../services/teacher-context';
import { environment } from '../../../../environments/environment';

interface StudentDto {
  aisId: number;
  fullName: string;
}

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
  contextService = inject(TeacherContextService);
  http = inject(HttpClient);

  parsedStudents = signal<StudentDto[]>([]);
  isUploading = signal(false);
  uploadStatus = signal<'idle' | 'success' | 'error'>('idle');
  errorMessage = signal<string>('');

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCSV(text);
    };

    reader.readAsText(file, 'windows-1250'); 
  }

  private parseCSV(csvText: string) {
    const lines = csvText.split('\n');
    const students: StudentDto[] = [];

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

    this.parsedStudents.set(students);
    this.uploadStatus.set('idle');
  }

  uploadData() {
    const currentExercise = this.contextService.selectedExercise();
    
    if (!currentExercise) {
      this.errorMessage.set('Musíte vybrať cvičenie v hornej lište!');
      this.uploadStatus.set('error');
      return;
    }

    if (this.parsedStudents().length === 0) return;

    this.isUploading.set(true);

    const payload: UploadPayload = {
      exerciseId: currentExercise.exerciseId,
      students: this.parsedStudents()
    };

    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post(`${environment.apiUrl}/api/v1/student`, payload, { headers })
      .subscribe({
        next: () => {
          this.isUploading.set(false);
          this.uploadStatus.set('success');
          this.parsedStudents.set([]);
        },
        error: (err) => {
          console.error('Upload error:', err);
          this.isUploading.set(false);
          this.uploadStatus.set('error');
          this.errorMessage.set('Nepodarilo sa uložiť študentov. Skontrolujte konzolu.');
        }
      });
  }
}