import { Component, Input, Output, EventEmitter } from '@angular/core'; 
import { CommonModule, NgClass } from '@angular/common'; 
import { SearchBar } from '../search-bar/search-bar';

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

  @Input() currentUser!: UserInfo; 
  @Input() isSidebarOpen: boolean = false; 
  @Input() sidebarButtons: SidebarButton[] = []; 
  @Input() activeView!: string;

  @Output() logout = new EventEmitter<void>(); 
  @Output() buttonClick = new EventEmitter<string>(); 
  @Output() studentSelected = new EventEmitter<any>();
  @Output() isSidebarOpenChange = new EventEmitter<boolean>();

  isAdmin(): boolean { 
    return this.currentUser?.rola?.toUpperCase() === 'ADMIN';
  }
  isTeacher(): boolean { 
    return this.currentUser?.rola?.toUpperCase() === 'TEACHER';
  }
  isHelper(): boolean { 
    return this.currentUser?.rola?.toUpperCase() === 'HELPER';
  }  

  onButtonClick(label: string): void { 
    this.buttonClick.emit(label);
  } 

  onLogoutClick(): void { 
    this.logout.emit(); 
  } 

  onStudentFound(student: any): void {
    this.studentSelected.emit(student);
    this.closeSidebar();
  }
  closeSidebar(): void {
    this.isSidebarOpen = false;
    this.isSidebarOpenChange.emit(false);
  }
}