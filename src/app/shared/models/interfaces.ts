

export interface AttendanceItemDto {
  attendanceId: number;
  attendance: string; 
  exerciseSessionId?: number;
  sessionDate?: string;
}


export interface StudentBasic {
  id: number;
  fullName: string;
  aisId?: number;
}

export interface ApiResponse<T> {
  status?: string;
  message?: string;
  data: T;
  timestamp?: string;
}


export interface AssignmentHeader {
  id: number;
  name: string;
  maxPoints: number;
}

export interface UserDTO {
  id: number;
  fullName: string;
  email: string;
  roleEnum: string;
}

export interface StudentAssignmentDto {
  studentAssignmentId: number;
  assignmentId?: number;
  earnedPoints: number;
  note?: string;
}


export interface StudentGradingRow {
  studentId?: number;
  studentFullName: string;
  aisId?: number;
  studentAssignments: StudentAssignmentDto[];
}


export interface SessionColumn {
  id: number;
  label: string;
  date?: string;
}

export interface StudentDto {
  aisId: number;
  fullName: string;
}

export interface UserInfo {
  meno: string;
  rola: string;
}


export interface SidebarButton { 
  label: string; 
  isAdminAvailable: boolean;
  isTeacherAvailable: boolean;  
  isHelperAvailable: boolean;  
}


export interface Exercise {
    id: number;
    firstSessionDate: string;
    startTime: string;
    roomEnum: string;
}

