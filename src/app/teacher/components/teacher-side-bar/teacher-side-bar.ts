import { Component, Input, Output, EventEmitter, inject } from '@angular/core'; 
import { CommonModule, NgClass } from '@angular/common'; 
import { SearchBar } from '../search-bar/search-bar';
import { LoggerService } from '../../../core/logging/logger.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SidebarButton } from '../../../shared/models/interfaces';
import { StudentBasic } from '../../../shared/models/interfaces';

interface UserInfo { 
  meno: string; 
  rola: string; 
} 


@Component({ 
  selector: 'app-teacher-sidebar', 
  standalone: true, 
  imports: [CommonModule, NgClass, SearchBar], 
  templateUrl: './teacher-side-bar.html',   
}) 
export class TeacherSidebarComponent { 
  private logger = inject(LoggerService);
  private authService = inject(AuthService);

  @Input() public currentUser!: UserInfo; 
  @Input() public isSidebarOpen: boolean = false; 
  @Input() public sidebarButtons: SidebarButton[] = []; 
  @Input() public activeView!: string;

  @Input() public showSearch: boolean = false;

  @Output() public logout = new EventEmitter<void>(); 
  @Output() public buttonClick = new EventEmitter<string>(); 
  @Output() public studentSelected = new EventEmitter<StudentBasic>();
  @Output() public isSidebarOpenChange = new EventEmitter<boolean>();

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