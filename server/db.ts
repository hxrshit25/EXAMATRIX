import fs from 'fs';
import path from 'path';
import {
  User,
  Department,
  Course,
  Subject,
  Student,
  Room,
  ExamSession,
  ExamSchedule,
  SeatingAllocation,
  Invigilator,
  InvigilatorAssignment,
  AuditLog,
  SystemSettings,
  AllocatedSeat,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_COURSES,
  INITIAL_SUBJECTS,
  INITIAL_ROOMS,
  INITIAL_INVIGILATORS,
  INITIAL_EXAM_SESSIONS,
  INITIAL_EXAM_SCHEDULES,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  generateSeedStudents,
} from './seedData';
import { runAllocationEngine } from './allocationEngine';

export interface DatabaseSchema {
  users: User[];
  departments: Department[];
  courses: Course[];
  subjects: Subject[];
  students: Student[];
  rooms: Room[];
  examSessions: ExamSession[];
  examSchedules: ExamSchedule[];
  allocations: SeatingAllocation[];
  invigilators: Invigilator[];
  invigilatorAssignments: InvigilatorAssignment[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DB_PATH = path.resolve(process.cwd(), 'data/examatrix_db.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.students && parsed.rooms && parsed.examSchedules) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to parse existing database file, re-initializing seed data:', err);
    }

    return this.createSeedDatabase();
  }

  public createSeedDatabase(): DatabaseSchema {
    const students = generateSeedStudents();
    const rooms = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    const schedules = JSON.parse(JSON.stringify(INITIAL_EXAM_SCHEDULES));

    // Automatically run baseline allocation for Nov 10 Morning Shift (CS501 + EC501)
    const morningSchedules = schedules.filter(
      (s: ExamSchedule) => s.examDate === '2026-11-10' && s.shift.includes('Morning')
    );

    const initialAllocation = runAllocationEngine({
      schedules: morningSchedules,
      students,
      rooms,
      examDate: '2026-11-10',
      shift: 'Morning (09:30 - 12:30)',
      enableInterleaving: true,
      strictAdjacency: true,
    });

    initialAllocation.status = 'published';

    // Mark sample attendance for demonstration in room R-101
    initialAllocation.seats.forEach((seat, idx) => {
      if (idx === 12) {
        seat.attendanceStatus = 'absent';
        seat.remarks = 'Medical leave documented';
      } else if (idx === 28) {
        seat.attendanceStatus = 'absent';
        seat.remarks = 'Unexcused absence at bell';
      } else if (idx === 41) {
        seat.attendanceStatus = 'malpractice';
        seat.remarks = 'Unauthorized formula sheet confiscated by Invigilator';
      } else if (idx < 50) {
        seat.attendanceStatus = 'present';
      }
    });

    // Initial invigilator assignments
    const invAssignments: InvigilatorAssignment[] = [
      {
        id: 'assign_01',
        invigilatorId: 'inv_01',
        invigilatorName: 'Dr. Michael Chen',
        roomId: 'rm_r101',
        roomNumber: 'R-101',
        examDate: '2026-11-10',
        shift: 'Morning (09:30 - 12:30)',
        scheduleIds: morningSchedules.map((s: ExamSchedule) => s.id),
        status: 'confirmed',
      },
      {
        id: 'assign_02',
        invigilatorId: 'inv_02',
        invigilatorName: 'Prof. Sarah Jenkins',
        roomId: 'rm_ng01',
        roomNumber: 'N-G01',
        examDate: '2026-11-10',
        shift: 'Morning (09:30 - 12:30)',
        scheduleIds: morningSchedules.map((s: ExamSchedule) => s.id),
        status: 'confirmed',
      },
    ];

    const initialDb: DatabaseSchema = {
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      courses: INITIAL_COURSES,
      subjects: INITIAL_SUBJECTS,
      students,
      rooms,
      examSessions: INITIAL_EXAM_SESSIONS,
      examSchedules: schedules,
      allocations: [initialAllocation],
      invigilators: INITIAL_INVIGILATORS,
      invigilatorAssignments: invAssignments,
      auditLogs: INITIAL_AUDIT_LOGS,
      settings: INITIAL_SETTINGS,
    };

    this.saveData(initialDb);
    return initialDb;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  public save() {
    this.saveData(this.data);
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Audit Logging Helper ---
  public addAuditLog(action: string, entity: string, details: string, userEmail = 'admin@examatrix.edu', userName = 'Administrator') {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userEmail,
      userName,
      action,
      entity,
      details,
    };
    this.data.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
    return log;
  }

  // --- Students ---
  public getStudents(): Student[] {
    return this.data.students;
  }

  public addStudent(studentData: Omit<Student, 'id'>): Student {
    // Check duplicates
    const existing = this.data.students.find(
      (s) => s.rollNumber.toUpperCase() === studentData.rollNumber.toUpperCase()
    );
    if (existing) {
      throw new Error(`Student with Roll Number ${studentData.rollNumber} already exists`);
    }

    const newStudent: Student = {
      ...studentData,
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rollNumber: studentData.rollNumber.toUpperCase().trim(),
      regNumber: studentData.regNumber.toUpperCase().trim(),
    };
    this.data.students.push(newStudent);
    this.addAuditLog('CREATE_STUDENT', 'Student', `Added student ${newStudent.name} (${newStudent.rollNumber})`);
    this.save();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student not found');

    if (updates.rollNumber) {
      const duplicate = this.data.students.find(
        (s) => s.id !== id && s.rollNumber.toUpperCase() === updates.rollNumber!.toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Roll number ${updates.rollNumber} is already assigned to another student`);
      }
    }

    this.data.students[idx] = {
      ...this.data.students[idx],
      ...updates,
    };
    this.addAuditLog('UPDATE_STUDENT', 'Student', `Updated student profile for ${this.data.students[idx].rollNumber}`);
    this.save();
    return this.data.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    const removed = this.data.students.splice(idx, 1)[0];
    this.addAuditLog('DELETE_STUDENT', 'Student', `Deleted student record ${removed.name} (${removed.rollNumber})`);
    this.save();
    return true;
  }

  public bulkAddStudents(students: Omit<Student, 'id'>[]): { added: number; skipped: number; errors: string[] } {
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    students.forEach((stu, index) => {
      if (!stu.rollNumber || !stu.name || !stu.departmentId) {
        skipped++;
        errors.push(`Row ${index + 1}: Missing mandatory fields (Roll Number, Name, Department)`);
        return;
      }

      const roll = stu.rollNumber.toUpperCase().trim();
      if (this.data.students.some((s) => s.rollNumber === roll)) {
        skipped++;
        errors.push(`Row ${index + 1}: Duplicate roll number ${roll}`);
        return;
      }

      const newStudent: Student = {
        ...stu,
        id: `stu_bulk_${Date.now()}_${index}`,
        rollNumber: roll,
        regNumber: (stu.regNumber || `REG-${roll}`).toUpperCase().trim(),
        subjectCodes: Array.isArray(stu.subjectCodes) ? stu.subjectCodes : [],
        isEligible: stu.isEligible !== false,
      };
      this.data.students.push(newStudent);
      added++;
    });

    this.addAuditLog('BULK_IMPORT_STUDENTS', 'Student', `Bulk imported ${added} students (${skipped} skipped)`);
    this.save();
    return { added, skipped, errors };
  }

  // --- Rooms ---
  public getRooms(): Room[] {
    return this.data.rooms;
  }

  public addRoom(roomData: Omit<Room, 'id' | 'availableSeats'>): Room {
    const existing = this.data.rooms.find(
      (r) => r.roomNumber.toLowerCase() === roomData.roomNumber.toLowerCase()
    );
    if (existing) {
      throw new Error(`Room number ${roomData.roomNumber} already exists`);
    }

    const blockedCount = (roomData.layoutConfig.blockedSeats || []).length;
    const seatCapacity = roomData.totalRows * roomData.totalColumns;
    const availableSeats = Math.max(0, seatCapacity - blockedCount);

    const newRoom: Room = {
      ...roomData,
      id: `rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      seatCapacity,
      availableSeats,
    };
    this.data.rooms.push(newRoom);
    this.addAuditLog('CREATE_ROOM', 'Room', `Created examination room ${newRoom.roomNumber} with ${availableSeats} usable seats`);
    this.save();
    return newRoom;
  }

  public updateRoom(id: string, updates: Partial<Room>): Room {
    const idx = this.data.rooms.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Room not found');

    const current = this.data.rooms[idx];
    const totalRows = updates.totalRows ?? current.totalRows;
    const totalColumns = updates.totalColumns ?? current.totalColumns;
    const layoutConfig = updates.layoutConfig ?? current.layoutConfig;
    const blockedCount = (layoutConfig.blockedSeats || []).length;
    const seatCapacity = totalRows * totalColumns;
    const availableSeats = Math.max(0, seatCapacity - blockedCount);

    this.data.rooms[idx] = {
      ...current,
      ...updates,
      totalRows,
      totalColumns,
      layoutConfig,
      seatCapacity,
      availableSeats,
    };
    this.addAuditLog('UPDATE_ROOM', 'Room', `Updated room ${this.data.rooms[idx].roomNumber} configuration`);
    this.save();
    return this.data.rooms[idx];
  }

  public deleteRoom(id: string): boolean {
    const idx = this.data.rooms.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    const removed = this.data.rooms.splice(idx, 1)[0];
    this.addAuditLog('DELETE_ROOM', 'Room', `Deleted room ${removed.roomNumber}`);
    this.save();
    return true;
  }

  // --- Examinations & Schedules ---
  public getExamSchedules(): ExamSchedule[] {
    return this.data.examSchedules;
  }

  public addExamSchedule(schData: Omit<ExamSchedule, 'id' | 'eligibleStudentCount'>): ExamSchedule {
    // Check conflicts: overlapping room or subject schedule
    const conflict = this.data.examSchedules.find(
      (s) =>
        s.examDate === schData.examDate &&
        s.shift === schData.shift &&
        s.subjectCode === schData.subjectCode
    );
    if (conflict) {
      throw new Error(`Schedule for subject ${schData.subjectCode} already exists on ${schData.examDate} during ${schData.shift}`);
    }

    // Count eligible students
    const eligibleCount = this.data.students.filter(
      (stu) => stu.isEligible && stu.subjectCodes.includes(schData.subjectCode)
    ).length;

    const newSch: ExamSchedule = {
      ...schData,
      id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eligibleStudentCount: eligibleCount,
    };

    this.data.examSchedules.push(newSch);
    this.addAuditLog('CREATE_SCHEDULE', 'ExamSchedule', `Scheduled examination ${newSch.subjectCode} (${newSch.subjectName}) for ${newSch.examDate}`);
    this.save();
    return newSch;
  }

  public updateExamSchedule(id: string, updates: Partial<ExamSchedule>): ExamSchedule {
    const idx = this.data.examSchedules.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Exam schedule not found');

    const subjectCode = updates.subjectCode || this.data.examSchedules[idx].subjectCode;
    const eligibleCount = this.data.students.filter(
      (stu) => stu.isEligible && stu.subjectCodes.includes(subjectCode)
    ).length;

    this.data.examSchedules[idx] = {
      ...this.data.examSchedules[idx],
      ...updates,
      eligibleStudentCount: eligibleCount,
    };
    this.addAuditLog('UPDATE_SCHEDULE', 'ExamSchedule', `Modified schedule ${this.data.examSchedules[idx].subjectCode}`);
    this.save();
    return this.data.examSchedules[idx];
  }

  public deleteExamSchedule(id: string): boolean {
    const idx = this.data.examSchedules.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    const removed = this.data.examSchedules.splice(idx, 1)[0];
    this.addAuditLog('DELETE_SCHEDULE', 'ExamSchedule', `Deleted schedule for ${removed.subjectCode}`);
    this.save();
    return true;
  }

  // --- Allocations ---
  public getAllocations(): SeatingAllocation[] {
    return this.data.allocations;
  }

  public getAllocationById(id: string): SeatingAllocation | undefined {
    return this.data.allocations.find((a) => a.id === id);
  }

  public generateAllocation(examDate: string, shift: any): SeatingAllocation {
    // Find all schedules running on this date & shift
    const matchingSchedules = this.data.examSchedules.filter(
      (s) => s.examDate === examDate && s.shift === shift
    );

    if (matchingSchedules.length === 0) {
      throw new Error(`No examination schedules found for Date: ${examDate} and Shift: ${shift}`);
    }

    const allocation = runAllocationEngine({
      schedules: matchingSchedules,
      students: this.data.students,
      rooms: this.data.rooms,
      examDate,
      shift,
      enableInterleaving: this.data.settings.enableInterleaving,
      strictAdjacency: this.data.settings.strictAdjacencyPrevention,
    });

    // Remove any previous draft allocation for this date/shift
    this.data.allocations = this.data.allocations.filter(
      (a) => !(a.examDate === examDate && a.shift === shift && a.status === 'draft')
    );

    this.data.allocations.unshift(allocation);
    this.addAuditLog(
      'GENERATE_ALLOCATION',
      'SeatingAllocation',
      `Generated seating allocation for ${examDate} (${shift}) with score ${allocation.qualityReport.overallScore}/100. Allocated: ${allocation.qualityReport.totalAllocated}`
    );
    this.save();
    return allocation;
  }

  public updateAllocationStatus(id: string, status: 'draft' | 'locked' | 'published'): SeatingAllocation {
    const alloc = this.getAllocationById(id);
    if (!alloc) throw new Error('Allocation not found');
    alloc.status = status;
    this.addAuditLog('ALLOCATION_STATUS_CHANGE', 'SeatingAllocation', `Changed allocation status to ${status.toUpperCase()} for ${alloc.examDate}`);
    this.save();
    return alloc;
  }

  public overrideSeatAssignment(
    allocationId: string,
    sourceSeatId: string,
    targetSeatId: string
  ): SeatingAllocation {
    const alloc = this.getAllocationById(allocationId);
    if (!alloc) throw new Error('Allocation not found');
    if (alloc.status === 'locked' && !this.data.settings.allowManualOverrides) {
      throw new Error('Allocation is locked and manual overrides are disabled');
    }

    const sourceSeat = alloc.seats.find((s) => s.seatId === sourceSeatId);
    if (!sourceSeat) throw new Error('Source seat assignment not found');

    const targetSeat = alloc.seats.find((s) => s.seatId === targetSeatId);

    if (targetSeat) {
      // Swap student details between the two seats
      const tempStudent = {
        studentId: sourceSeat.studentId,
        regNumber: sourceSeat.regNumber,
        rollNumber: sourceSeat.rollNumber,
        studentName: sourceSeat.studentName,
        subjectCode: sourceSeat.subjectCode,
        subjectName: sourceSeat.subjectName,
        departmentCode: sourceSeat.departmentCode,
      };

      sourceSeat.studentId = targetSeat.studentId;
      sourceSeat.regNumber = targetSeat.regNumber;
      sourceSeat.rollNumber = targetSeat.rollNumber;
      sourceSeat.studentName = targetSeat.studentName;
      sourceSeat.subjectCode = targetSeat.subjectCode;
      sourceSeat.subjectName = targetSeat.subjectName;
      sourceSeat.departmentCode = targetSeat.departmentCode;

      targetSeat.studentId = tempStudent.studentId;
      targetSeat.regNumber = tempStudent.regNumber;
      targetSeat.rollNumber = tempStudent.rollNumber;
      targetSeat.studentName = tempStudent.studentName;
      targetSeat.subjectCode = tempStudent.subjectCode;
      targetSeat.subjectName = tempStudent.subjectName;
      targetSeat.departmentCode = tempStudent.departmentCode;

      alloc.version += 1;
      this.addAuditLog(
        'MANUAL_OVERRIDE_SWAP',
        'SeatingAllocation',
        `Swapped seats between Roll ${sourceSeat.rollNumber} and ${targetSeat.rollNumber}`
      );
    } else {
      // Moving to an empty seat
      // Extract target room and label from targetSeatId (format: roomId-seatLabel)
      const parts = targetSeatId.split('-');
      const roomId = parts[0] + (parts[1] && !parts[1].startsWith('R') ? `-${parts[1]}` : '');
      const room = this.data.rooms.find((r) => r.id === roomId || targetSeatId.startsWith(r.id));
      if (!room) throw new Error('Target room not found');

      // Create new seat position
      const rowMatch = targetSeatId.match(/R(\d+)/);
      const colMatch = targetSeatId.match(/(\d+)$/);
      const rNum = rowMatch ? parseInt(rowMatch[1], 10) : 1;
      const cNum = colMatch ? parseInt(colMatch[1], 10) : 1;

      sourceSeat.seatId = targetSeatId;
      sourceSeat.roomId = room.id;
      sourceSeat.roomNumber = room.roomNumber;
      sourceSeat.building = room.building;
      sourceSeat.floor = room.floor;
      sourceSeat.rowNumber = rNum;
      sourceSeat.colNumber = cNum;
      sourceSeat.seatLabel = `R${rNum}-${String(cNum).padStart(2, '0')}`;

      alloc.version += 1;
      this.addAuditLog(
        'MANUAL_OVERRIDE_MOVE',
        'SeatingAllocation',
        `Reassigned student ${sourceSeat.rollNumber} to seat ${sourceSeat.seatLabel} in room ${room.roomNumber}`
      );
    }

    this.save();
    return alloc;
  }

  // --- Attendance ---
  public updateAttendance(
    allocationId: string,
    seatId: string,
    attendanceStatus: AllocatedSeat['attendanceStatus'],
    remarks?: string
  ): AllocatedSeat {
    const alloc = this.getAllocationById(allocationId);
    if (!alloc) throw new Error('Allocation not found');

    const seat = alloc.seats.find((s) => s.seatId === seatId);
    if (!seat) throw new Error('Seat not found in allocation');

    seat.attendanceStatus = attendanceStatus;
    if (remarks !== undefined) {
      seat.remarks = remarks;
    }

    this.addAuditLog(
      'UPDATE_ATTENDANCE',
      'Attendance',
      `Marked attendance for Roll ${seat.rollNumber} as ${attendanceStatus.toUpperCase()} (${seat.roomNumber} Seat ${seat.seatLabel})`
    );
    this.save();
    return seat;
  }

  // --- Invigilators ---
  public getInvigilators(): Invigilator[] {
    return this.data.invigilators;
  }

  public getInvigilatorAssignments(): InvigilatorAssignment[] {
    return this.data.invigilatorAssignments;
  }

  public assignInvigilator(data: Omit<InvigilatorAssignment, 'id'>): InvigilatorAssignment {
    // Check overlap
    const overlap = this.data.invigilatorAssignments.find(
      (a) =>
        a.invigilatorId === data.invigilatorId &&
        a.examDate === data.examDate &&
        a.shift === data.shift
    );
    if (overlap) {
      throw new Error(`Invigilator ${data.invigilatorName} is already assigned to Room ${overlap.roomNumber} during this shift`);
    }

    const assignment: InvigilatorAssignment = {
      ...data,
      id: `assign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.data.invigilatorAssignments.push(assignment);
    this.addAuditLog(
      'ASSIGN_INVIGILATOR',
      'Invigilator',
      `Assigned ${assignment.invigilatorName} to Room ${assignment.roomNumber} on ${assignment.examDate} (${assignment.shift})`
    );
    this.save();
    return assignment;
  }

  public removeInvigilatorAssignment(id: string): boolean {
    const idx = this.data.invigilatorAssignments.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const removed = this.data.invigilatorAssignments.splice(idx, 1)[0];
    this.addAuditLog('REMOVE_INVIGILATOR_DUTY', 'Invigilator', `Unassigned ${removed.invigilatorName} from Room ${removed.roomNumber}`);
    this.save();
    return true;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };
    this.addAuditLog('UPDATE_SETTINGS', 'SystemSettings', 'Updated system allocation rules and preferences');
    this.save();
    return this.data.settings;
  }

  // --- Reset to Pristine Demo Data ---
  public resetToDefault(): DatabaseSchema {
    this.data = this.createSeedDatabase();
    this.addAuditLog('SYSTEM_RESET', 'System', 'Database was reset to university reference seed demonstration state');
    return this.data;
  }
}

export const db = new DatabaseStore();
