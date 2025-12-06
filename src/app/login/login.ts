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

  /**
   * Pomocná funkcia na dekódovanie JWT payloadu.
   * Zoberie token, rozdelí ho a dekóduje prostrednú časť (payload).
   */
  private decodeTokenPayload(token: string): any {
    try {
      // 1. Zoberieme prostrednú časť (payload)
      const payloadBase64 = token.split('.')[1];
      
      // 2. Opravíme Base64Url kódovanie (nahradíme '-' za '+' a '_' za '/')
      //    a pridáme padding, ak chýba, aby bola dĺžka deliteľná 4
      let correctedPayload = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      while (correctedPayload.length % 4) {
        correctedPayload += '=';
      }

      // 3. Dekódujeme Base64 string a prevedieme na objekt
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
          // --- KÓD UPRAVENÝ TU ---

          // 1. Uložíme si celý token (pre interceptor)
          localStorage.setItem('auth_token', res.token);

          // 2. Dekódujeme token, aby sme získali dáta
          const payload = this.decodeTokenPayload(res.token);
          
          if (payload) {
            console.log("Dekódovaný token:", payload);
            // payload teraz obsahuje: {sub: '...', id: 1, role: 'ADMIN', ...}
            
            // 3. Uložíme si dáta do localStorage pre TeacherComponent
            localStorage.setItem('user_role', payload.role); 
            localStorage.setItem('user_id', payload.id); 
            localStorage.setItem('user_fullName', payload.sub); // 'sub' je email/username
          }

          // 4. Navigujeme
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