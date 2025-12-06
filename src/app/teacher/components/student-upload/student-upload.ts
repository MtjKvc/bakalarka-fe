import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TeacherContextService } from '../../../services/teacher-context';


// Interface pre jedného študenta (tak ako to chce backend)
interface StudentDto {
  aisId: number;       // Zmenené na number
  fullName: string;    // Zmenené na fullName
}

// Interface pre celý balík dát (Payload)
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

  // Lokálne premenné pre stav
  parsedStudents = signal<StudentDto[]>([]);
  isUploading = signal(false);
  uploadStatus = signal<'idle' | 'success' | 'error'>('idle');
  errorMessage = signal<string>('');

  // 1. Výber a čítanie súboru
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCSV(text);
    };

    // Použijeme windows-1250, lebo slovenské CSV z Excelu/AISu majú často toto kódovanie
    // Ak by to robilo "kriaky" namiesto diakritiky, skús zmeniť na 'UTF-8'
    reader.readAsText(file, 'windows-1250'); 
  }

  // 2. Parsovanie CSV (Formát: Poradie; Meno; ID; ...)
  private parseCSV(csvText: string) {
    const lines = csvText.split('\n');
    const students: StudentDto[] = [];

    // Ideme od i=1, aby sme preskočili hlavičku
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(';');

      // Očakávame minimálne 3 stĺpce
      // Index 1: Meno (Ábrahámová Peter)
      // Index 2: ID (11111111)
      if (cols.length >= 3) {
        
        const rawName = cols[1].trim();
        const rawId = cols[2].trim();

        // Konvertujeme ID na číslo
        const parsedId = parseInt(rawId, 10);

        // Pridáme len ak je ID platné číslo
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

  // 3. Odoslanie na backend
  uploadData() {
    const currentExercise = this.contextService.selectedExercise();
    
    if (!currentExercise) {
      this.errorMessage.set('Musíte vybrať cvičenie v hornej lište!');
      this.uploadStatus.set('error');
      return;
    }

    if (this.parsedStudents().length === 0) return;

    this.isUploading.set(true);

    // Vytvoríme presne taký JSON, aký si poslal
    const payload: UploadPayload = {
      exerciseId: currentExercise.exerciseId,
      students: this.parsedStudents()
    };

    // Pridáme Auth token (ak ho nemáš v Interceptore)
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.post('http://localhost:8080/api/v1/student', payload, { headers })
      .subscribe({
        next: () => {
          this.isUploading.set(false);
          this.uploadStatus.set('success');
          this.parsedStudents.set([]); // Vyčistíme zoznam po úspechu
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