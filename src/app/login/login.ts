import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthResponse, AuthService } from '../core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  public errorMessage: string = '';

  public loginForm: FormGroup = new FormGroup({
    email: new FormControl(""),
    password: new FormControl("")
  });

  private authService = inject(AuthService);
  private router = inject(Router);

  public onLogin() {
    this.errorMessage = '';
    const formValue = this.loginForm.value;

    this.authService.login(formValue).subscribe({
      next: (res: AuthResponse) => {

        this.router.navigate(['/teacher']);
      },

      error: (err: HttpErrorResponse) => {
        this.errorMessage = err?.error?.message || "Nastala chyba pri prihlasovaní";
      }
    });
  }
}