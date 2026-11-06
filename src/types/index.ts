export type Role = 'admin' | 'coordinator' | 'invigilator' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  building: string;
}

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  durationYears: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  semester: number;
  credits: number;
}

export interface Student {
  id: string;
  regNumber: string;
  rollNumber: string;
  name: string;
  email: string;
  departmentId: string;
  courseId: string;
  semester: number;
  section: string;
  subjectCodes: string[];
  isEligible: boolean;
  eligibilityReason?: string;
  specialNeeds?: boolean;
}

export interface RoomLayoutConfig {
  blockedSeats: string[]; // e.g. ["R1C3", "R2C4"]
  aisles: number[]; // Column indices after which there is an aisle (1-indexed)
  customLabels?: Record<string, string>;
}

export interface Room {
  id: string;
  roomNumber: string;
  building: string;
  floor: number;
  totalRows: number;
  totalColumns: number;
  seatCapacity: number;
  availableSeats: number;
  roomType: 'Auditorium' | 'Examination Hall' | 'Lecture Theater' | 'Classroom';
  accessibilityInfo: string;
  isAvailable: boolean;
  layoutConfig: RoomLayoutConfig;
}

export interface ExamSession {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'allocated' | 'published' | 'completed';
}

export type ExamShift = 'Morning (09:30 - 12:30)' | 'Afternoon (14:00 - 17:00)';

export interface ExamSchedule {
  id: string;
  sessionId: string;
  examName: string;
  departmentId: string;
  semester: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  shift: ExamShift;
  eligibleStudentCount: number;
  department?: string;
}

export interface AllocatedSeat {
  seatId: string;
  roomId: string;
  roomNumber: string;
  building: string;
  floor: number;
  rowNumber: number;
  colNumber: number;
  seatLabel: string;
  studentId: string;
  regNumber: string;
  rollNumber: string;
  studentName: string;
  subjectCode: string;
  subjectName: string;
  departmentCode: string;
  attendanceStatus: 'not_marked' | 'present' | 'absent' | 'malpractice';
  remarks?: string;
}

export interface UnallocatedStudent {
  studentId: string;
  rollNumber: string;
  studentName: string;
  subjectCode: string;
  departmentCode: string;
  reason: string;
}

export interface AllocationQualityReport {
  totalEligible: number;
  totalAllocated: number;
  totalUnallocated: number;
  roomsUtilizedCount: number;
  seatUtilizationPercent: number;
  sameSubjectHorizontalViolations: number;
  sameSubjectVerticalViolations: number;
  sameSubjectDiagonalViolations: number;
  overallScore: number;
  notes: string[];
}

export interface SeatingAllocation {
  id: string;
  scheduleIds: string[];
  examDate: string;
  shift: ExamShift;
  status: 'draft' | 'locked' | 'published';
  generatedAt: string;
  qualityReport: AllocationQualityReport;
  seats: AllocatedSeat[];
  unallocatedStudents: UnallocatedStudent[];
  version: number;
}

export interface Invigilator {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  isAvailable: boolean;
}

export interface InvigilatorAssignment {
  id: string;
  invigilatorId: string;
  invigilatorName: string;
  roomId: string;
  roomNumber: string;
  examDate: string;
  shift: ExamShift;
  scheduleIds: string[];
  status: 'assigned' | 'confirmed' | 'completed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
}

export interface SystemSettings {
  universityName: string;
  academicYear: string;
  enableInterleaving: boolean;
  strictAdjacencyPrevention: boolean;
  allowManualOverrides: boolean;
  autoLockMinutesBeforeShift: number;
  requireInvigilatorConfirmation: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  eligibleStudents: number;
  upcomingExamsCount: number;
  totalRooms: number;
  totalAvailableSeats: number;
  allocatedSeats: number;
  unallocatedStudents: number;
  roomOccupancyPercent: number;
  totalInvigilators: number;
  recentActivities: AuditLog[];
  upcomingExams: ExamSchedule[];
  qualityScore: number;
}

export interface StudentLookupResult {
  student: {
    id: string;
    name: string;
    rollNumber: string;
    regNumber: string;
    department: string;
    semester: number;
    isEligible: boolean;
    eligibilityReason?: string;
    specialNeeds?: boolean;
  };
  allocations: Array<{
    allocationId: string;
    examDate: string;
    shift: string;
    roomNumber: string;
    building: string;
    floor: string;
    rowNumber: number;
    colNumber: number;
    seatLabel: string;
    subjectCode: string;
    subjectName: string;
    status: string;
  }>;
}
