import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SearchBar } from '../search-bar/search-bar';
import { LoggerService } from '../../../core/logging/logger.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SidebarButton } from '../../../shared/models/interfaces';
import { StudentBasic } from '../../../shared/models/interfaces';
import { CloseOnEscDirective } from '../../../shared/directives/close-on-esc.directive';

interface UserInfo {
  meno: string;
  rola: string;
}

@Component({
  selector: 'app-teacher-sidebar',
  standalone: true,
  imports: [CommonModule, NgClass, SearchBar, FormsModule, CloseOnEscDirective],
  templateUrl: './teacher-side-bar.html',
})
export class TeacherSidebarComponent {
  private logger = inject(LoggerService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/api/v1/user/change-password`;

  @Input() public currentUser!: UserInfo;
  @Input() public isSidebarOpen: boolean = false;
  @Input() public sidebarButtons: SidebarButton[] = [];
  @Input() public activeView!: string;
  @Input() public showSearch: boolean = false;

  @Output() public logout = new EventEmitter<void>();
  @Output() public buttonClick = new EventEmitter<string>();
  @Output() public studentSelected = new EventEmitter<StudentBasic>();
  @Output() public isSidebarOpenChange = new EventEmitter<boolean>();

  public isPasswordModalOpen: boolean = false;
  public oldPassword: string = '';
  public newPassword: string = '';
  public newPasswordConfirm: string = '';
  public isSubmitting: boolean = false;
  public showOldPassword = false;
  public showNewPassword = false;
  public showConfirmPassword = false;

  public passwordError: string | null = null;
  public passwordSuccess: string | null = null;


  public openPasswordModal(): void {
    this.isPasswordModalOpen = true;
    this.resetModalState();
  }

  public closePasswordModal(): void {
    if (this.isSubmitting) return;
    this.isPasswordModalOpen = false;
    this.resetModalState();
  }

  private resetModalState(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.newPasswordConfirm = '';
    this.passwordError = null;
    this.passwordSuccess = null;
    this.isSubmitting = false;
  }

  public async submitPasswordChange(): Promise<void> {
    if (!this.oldPassword || !this.newPassword || !this.newPasswordConfirm) {
      this.passwordError = 'Všetky polia (staré heslo, nové heslo a potvrdenie) sú povinné.';
      return;
    }

    if (this.newPassword !== this.newPasswordConfirm) {
      this.passwordError = 'Nové heslá sa nezhodujú.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.passwordError = 'Nové heslo musí obsahovať aspoň 8 znakov.';
      return;
    }
    if (!/[a-z]/.test(this.newPassword)) {
      this.passwordError = 'Heslo musí obsahovať aspoň jedno malé písmeno.';
      return;
    }
    if (!/[A-Z]/.test(this.newPassword)) {
      this.passwordError = 'Heslo musí obsahovať aspoň jedno veľké písmeno.';
      return;
    }
    if (!/[0-9]/.test(this.newPassword)) {
      this.passwordError = 'Heslo musí obsahovať aspoň jednu číslicu.';
      return;
    }

    this.isSubmitting = true;
    this.passwordError = null;
    this.passwordSuccess = null;

    const payload = {
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    };

    try {
      this.logger.log(`Odosielam požiadavku na zmenu hesla: ${this.apiUrl}`);

      await lastValueFrom(this.http.put(this.apiUrl, payload));

      this.passwordSuccess = 'Heslo bolo úspešne zmenené.';

      setTimeout(() => {
        if (this.isPasswordModalOpen) {

          this.oldPassword = '';
          this.newPassword = '';
          this.newPasswordConfirm = '';

          this.closePasswordModal()
        };
      }, 2000);


    } catch (error: any) {
      this.logger.error('Zmena hesla zlyhala', error);

      if (error.status === 422) {
        this.passwordError = 'Nesprávne staré heslo alebo nové heslo nespĺňa bezpečnostné požiadavky.';
      } else {
        this.passwordError = 'Nastala chyba pri komunikácii so serverom. Skúste to neskôr.';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  public isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  public isTeacher(): boolean {
    return this.authService.hasRole('TEACHER');
  }

  public isHelper(): boolean {
    return this.authService.hasRole('HELPER');
  }

  public onButtonClick(label: string): void {
    this.logger.log(`Sidebar button clicked: ${label}`);
    this.buttonClick.emit(label);
  }

  public onLogoutClick(): void {
    this.logger.log('Logout clicked from sidebar');
    this.logout.emit();
  }

  public onStudentFound(student: StudentBasic): void {
    this.logger.log('Student found via sidebar search', student);
    this.studentSelected.emit(student);
    this.closeSidebar();
  }

  public closeSidebar(): void {
    this.logger.log('Closing sidebar');
    this.isSidebarOpen = false;
    this.isSidebarOpenChange.emit(false);
  }

  public shouldShowButton(button: SidebarButton): boolean {
    if (this.isAdmin()) return button.isAdminAvailable;
    if (this.isTeacher()) return button.isTeacherAvailable;
    if (this.isHelper()) return button.isHelperAvailable;
    return false;
  }
}