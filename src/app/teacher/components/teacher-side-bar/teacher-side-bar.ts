import { Component, Input, Output, EventEmitter } from '@angular/core'; 
import { CommonModule, NgClass } from '@angular/common'; 

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
  imports: [CommonModule, NgClass], 
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
}