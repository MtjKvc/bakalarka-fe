// src/app/services/generic-crud.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Exportujte pre použitie kdekoľvek
export abstract class GenericCrudService<T extends { id?: number }> {
  // baseUrl sa nastaví v dedičnej triede
  protected abstract apiUrl: string; 

  constructor(protected http: HttpClient) { }

  // 1. CREATE (POST)
  create(item: T): Observable<T> {
    return this.http.post<T>(this.apiUrl, item);
  }

  // 2. READ All (GET)
  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.apiUrl);
  }

  // 3. READ One (GET)
  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  // 4. UPDATE (PUT)
  update(id: number, item: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${id}`, item);
  }

  // 5. DELETE (DELETE)
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}