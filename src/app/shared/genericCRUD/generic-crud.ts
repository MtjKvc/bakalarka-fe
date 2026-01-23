import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export abstract class GenericCrudService<T extends { id?: number }> {
  protected abstract apiUrl: string; 

  constructor(protected http: HttpClient) { }

  create(item: T): Observable<T> {
    return this.http.post<T>(this.apiUrl, item);
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.apiUrl);
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  update(id: number, item: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${id}`, item);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}