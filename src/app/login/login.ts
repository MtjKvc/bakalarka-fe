import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup = new FormGroup({
    email: new FormControl(""),
    password: new FormControl("")
  });

  http = inject(HttpClient);
  router = inject(Router);

  private decodeTokenPayload(token: string): any {
    try {
      const payloadBase64 = token.split('.')[1];
      
      let correctedPayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      while (correctedPayload.length % 4) {
        correctedPayload += '=';
      }

      const decoded = JSON.parse(atob(correctedPayload));
      
      return decoded;

    } catch (error) {
      console.error("Chyba pri dekódovaní tokenu:", error);
      return null;
    }
  }

  onLogin() {
    const formValue = this.loginForm.value;
    this.http.post("http://localhost:8080/api/v1/auth/authenticate", formValue).subscribe({
      next: (res: any) => {
        if (res.token) {
          localStorage.setItem('auth_token', res.token);

          const payload = this.decodeTokenPayload(res.token);
          
          if (payload) {
            console.log("Dekódovaný token:", payload);
            
            localStorage.setItem('user_role', payload.role); 
            localStorage.setItem('user_id', payload.id); 
            localStorage.setItem('user_fullName', payload.sub);
          }

          this.router.navigate(['/teacher']); 
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        console.error("Login error:", err);
        alert(err?.error?.message || "Login failed");
      }
    });
  }
}