import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
}

export interface JwtPayload {
    sub: string;
    id: number;
    role: string;
    fullName: string; 
    iat: number;
    exp: number;
}

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private tokenKey = 'auth_token';

    login(credentials: LoginRequest) {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/api/v1/auth/authenticate`, credentials).pipe(
            tap(res => {
                if (res.token) {
                    this.setToken(res.token);
                    this.decodeAndSaveUser(res.token);
                }
            })
        );
    }

    logout() {
        localStorage.clear();
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private setToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    private decodeAndSaveUser(token: string) {
        try {
            const payloadBase64 = token.split('.')[1];
            let correctedPayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
            while (correctedPayload.length % 4) {
                correctedPayload += '=';
            }
            const payload = JSON.parse(atob(correctedPayload)) as JwtPayload;

            if (payload) {
                localStorage.setItem('user_role', payload.role);
                localStorage.setItem('user_id', String(payload.id));
                localStorage.setItem('user_fullName', payload.fullName);
            }
        } catch (error) {
            console.error('Error decoding token', error);
        }
    }

    get currentUserValue() {
        return {
            id: Number(localStorage.getItem('user_id')),
            meno: localStorage.getItem('user_fullName') || 'Používateľ',
            rola: localStorage.getItem('user_role') || 'USER'
        };
    }

    hasRole(role: string): boolean {
        const currentRole = localStorage.getItem('user_role');
        return currentRole?.toUpperCase() === role.toUpperCase();
    }
}