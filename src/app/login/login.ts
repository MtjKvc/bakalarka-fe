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
        // Bezpečné mapovanie chýb výlučne do slovenčiny
        switch (err.status) {
          case 400:
            this.errorMessage = "Nesprávne zadané údaje (chybný formát).";
            break;
            
          case 401:
            this.errorMessage = "Nesprávne prihlasovacie meno alebo heslo.";
            break;
            
          case 403:
            this.errorMessage = "Prístup zamietnutý. Platnosť tokenu vypršala alebo je neplatný.";
            break;
            
          case 409:
            this.errorMessage = "Tento záznam už v systéme existuje (konflikt údajov).";
            break;
            
          case 422:
            if (err.error?.message === "HELPER can login only on the day of assigned exercise") {
              this.errorMessage = "HELPER sa môže prihlásiť iba v deň priradeného cvičenia.";
            } 
            else if(err.error?.message === "Login allowed only between 07:00 and 19:00"){
              this.errorMessage = "HELPER sa môže prihlásiť iba medzi 7:00 a 19:00.";
            }
            else {
              this.errorMessage = "Zadané údaje neprešli kontrolou (chyba validácie).";
            }
            break;
            
          default:
            this.errorMessage = "Vyskytla sa nečakaná chyba. Skúste to prosím neskôr.";
            break;
        }
      }
    });
  }
}