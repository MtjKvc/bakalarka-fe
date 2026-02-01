import { Component, Input, Output, EventEmitter, inject } from '@angular/core'; 
import { CommonModule, NgClass } from '@angular/common'; 
import { SearchBar } from '../search-bar/search-bar';
import { LoggerService } from '../../../core/logging/logger';
import { AuthService } from '../../../core/auth/auth.service';

interface UserInfo { 
  meno: string; 
  rola: string; 
} 

interface SidebarButton { 
  label: string; 
  isAdminAvailable: boolean;
  isTeacherAvailable: boolean;  
  isHelperAvailable: boolean;  
} 

@Component({ 
  selector: 'app-teacher-sidebar', 
  standalone: true, 
  imports: [CommonModule, NgClass, SearchBar], 
  templateUrl: './teacher-side-bar.html', 
  styleUrl: './teacher-side-bar.css'  
}) 
export class TeacherSidebarComponent { 
  private logger = inject(LoggerService);
  private authService = inject(AuthService);

  @Input() currentUser!: UserInfo; 
  @Input() isSidebarOpen: boolean = false; 
  @Input() sidebarButtons: SidebarButton[] = []; 
  @Input() activeView!: string;

  @Input() showSearch: boolean = false;

  @Output() logout = new EventEmitter<void>(); 
  @Output() buttonClick = new EventEmitter<string>(); 
  @Output() studentSelected = new EventEmitter<any>();
  @Output() isSidebarOpenChange = new EventEmitter<boolean>();

  isAdmin(): boolean { 
    return this.authService.hasRole('ADMIN');
  }
  
  isTeacher(): boolean { 
    return this.authService.hasRole('TEACHER');
  }
  
  isHelper(): boolean { 
    return this.authService.hasRole('HELPER');
  }   

  onButtonClick(label: string): void { 
    this.logger.log(`Sidebar button clicked: ${label}`);
    this.buttonClick.emit(label);
  } 

  onLogoutClick(): void { 
    this.logger.log('Logout clicked from sidebar');
    this.logout.emit(); 
  } 

  onStudentFound(student: any): void {
    this.logger.log('Student found via sidebar search', student);
    this.studentSelected.emit(student);
    this.closeSidebar();
  }
  
  closeSidebar(): void {
    this.logger.log('Closing sidebar');
    this.isSidebarOpen = false;
    this.isSidebarOpenChange.emit(false);
  }

  shouldShowButton(button: SidebarButton): boolean {
    if (this.isAdmin()) return button.isAdminAvailable;
    if (this.isTeacher()) return button.isTeacherAvailable;
    if (this.isHelper()) return button.isHelperAvailable;
    return false;
  }
}