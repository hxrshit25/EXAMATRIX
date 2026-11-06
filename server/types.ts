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
  specialNeeds?: boolean; // e.g., mobility/ground floor requirement
}

export interface RoomLayoutConfig {
  blockedSeats: string[]; // e.g. ["R1C3", "R2C4"]
  aisles: number[]; // Column indices after which there is an aisle, 1-indexed (e.g. [2, 5])
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
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  shift: ExamShift;
  eligibleStudentCount: number;
}

export interface AllocatedSeat {
  seatId: string; // e.g., "H101-R1C1"
  roomId: string;
  roomNumber: string;
  building: string;
  floor: number;
  rowNumber: number;
  colNumber: number;
  seatLabel: string; // e.g., "R1-01"
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
  overallScore: number; // 0 - 100
  notes: string[];
}

export interface SeatingAllocation {
  id: string;
  scheduleIds: string[]; // One allocation can cover multiple exams running concurrently in the shift!
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
