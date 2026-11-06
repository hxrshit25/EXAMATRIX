import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { Role } from './server/types';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function bootstrapServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Request logger for audit and diagnostics
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
          console.warn(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
        }
      });
    }
    next();
  });

  // ==========================================
  // AUTHENTICATION & SESSION ENDPOINTS
  // ==========================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      const users = db.getRawData().users;

      // Find user matching role or email
      let user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user && role) {
        user = users.find((u) => u.role === role);
      }

      if (!user) {
        // Fallback demo user
        user = {
          id: `usr_${Date.now()}`,
          name: role === 'admin' ? 'System Administrator' : role === 'coordinator' ? 'Exam Coordinator' : 'Faculty Invigilator',
          email: email || `${role || 'admin'}@examatrix.edu`,
          role: (role as Role) || 'admin',
        };
      }

      db.addAuditLog('USER_LOGIN', 'Auth', `User logged in with role: ${user.role.toUpperCase()}`, user.email, user.name);

      res.json({
        success: true,
        user,
        token: `mock_jwt_${user.id}_${Date.now()}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // STATS & DASHBOARD AGGREGATIONS
  // ==========================================
  app.get('/api/stats', (_req: Request, res: Response) => {
    try {
      const raw = db.getRawData();
      const totalStudents = raw.students.length;
      const eligibleStudents = raw.students.filter((s) => s.isEligible).length;
      const totalRooms = raw.rooms.length;
      const totalAvailableSeats = raw.rooms
        .filter((r) => r.isAvailable)
        .reduce((sum, r) => sum + r.availableSeats, 0);

      // Current active allocation
      const publishedAllocation = raw.allocations.find((a) => a.status === 'published') || raw.allocations[0];
      const allocatedSeats = publishedAllocation ? publishedAllocation.seats.length : 0;
      const unallocatedStudents = publishedAllocation ? publishedAllocation.unallocatedStudents.length : 0;

      const roomOccupancyPercent = totalAvailableSeats > 0 ? Math.round((allocatedSeats / totalAvailableSeats) * 100) : 0;
      const totalInvigilators = raw.invigilators.length;

      // Upcoming exams (next 14 days)
      const upcomingExams = raw.examSchedules
        .slice(0, 5)
        .map((sch) => ({
          ...sch,
          department: raw.departments.find((d) => d.id === sch.departmentId)?.name || 'General',
        }));

      res.json({
        totalStudents,
        eligibleStudents,
        upcomingExamsCount: raw.examSchedules.length,
        totalRooms,
        totalAvailableSeats,
        allocatedSeats,
        unallocatedStudents,
        roomOccupancyPercent,
        totalInvigilators,
        recentActivities: raw.auditLogs.slice(0, 8),
        upcomingExams,
        qualityScore: publishedAllocation ? publishedAllocation.qualityReport.overallScore : 98.5,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // STUDENT MANAGEMENT ENDPOINTS
  // ==========================================
  app.get('/api/students', (req: Request, res: Response) => {
    try {
      let list = db.getStudents();
      const { search, departmentId, semester, eligibility } = req.query;

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.regNumber.toLowerCase().includes(q)
        );
      }
      if (departmentId && typeof departmentId === 'string' && departmentId !== 'all') {
        list = list.filter((s) => s.departmentId === departmentId);
      }
      if (semester && typeof semester === 'string' && semester !== 'all') {
        list = list.filter((s) => s.semester === parseInt(semester, 10));
      }
      if (eligibility && typeof eligibility === 'string' && eligibility !== 'all') {
        list = list.filter((s) => (eligibility === 'eligible' ? s.isEligible : !s.isEligible));
      }

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/students', (req: Request, res: Response) => {
    try {
      const student = db.addStudent(req.body);
      res.status(201).json(student);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateStudent(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/students/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deleteStudent(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Student not found' });
      res.json({ success: true, message: 'Student deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/students/bulk', (req: Request, res: Response) => {
    try {
      const { students } = req.body;
      if (!Array.isArray(students)) {
        return res.status(400).json({ error: 'students array is required' });
      }
      const result = db.bulkAddStudents(students);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // MASTER DATA: DEPARTMENTS, COURSES, SUBJECTS
  // ==========================================
  app.get('/api/departments', (_req: Request, res: Response) => {
    res.json(db.getRawData().departments);
  });

  app.get('/api/courses', (_req: Request, res: Response) => {
    res.json(db.getRawData().courses);
  });

  app.get('/api/subjects', (_req: Request, res: Response) => {
    res.json(db.getRawData().subjects);
  });

  // ==========================================
  // ROOM & CLASSROOM MANAGEMENT
  // ==========================================
  app.get('/api/rooms', (_req: Request, res: Response) => {
    try {
      res.json(db.getRooms());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/rooms', (req: Request, res: Response) => {
    try {
      const room = db.addRoom(req.body);
      res.status(201).json(room);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/rooms/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateRoom(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/rooms/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deleteRoom(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Room not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // EXAMINATION SCHEDULES
  // ==========================================
  app.get('/api/exams', (_req: Request, res: Response) => {
    try {
      const schedules = db.getExamSchedules();
      res.json(schedules);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/exams', (req: Request, res: Response) => {
    try {
      const sch = db.addExamSchedule(req.body);
      res.status(201).json(sch);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/exams/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateExamSchedule(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/exams/:id', (req: Request, res: Response) => {
    try {
      const ok = db.deleteExamSchedule(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Schedule not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Detect schedule and room conflicts
  app.get('/api/exams/conflicts', (_req: Request, res: Response) => {
    try {
      const schedules = db.getExamSchedules();
      const conflicts: { schedule1: string; schedule2: string; reason: string }[] = [];

      // Check pairs for same subject in same shift or overlapping times
      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const s1 = schedules[i];
          const s2 = schedules[j];

          if (s1.examDate === s2.examDate && s1.shift === s2.shift) {
            if (s1.subjectCode === s2.subjectCode) {
              conflicts.push({
                schedule1: `${s1.subjectCode} (${s1.examName})`,
                schedule2: `${s2.subjectCode} (${s2.examName})`,
                reason: `Duplicate subject examination scheduled on ${s1.examDate} during ${s1.shift}`,
              });
            }
          }
        }
      }

      res.json(conflicts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // SEATING ALLOCATION ENGINE ENDPOINTS
  // ==========================================
  app.get('/api/allocations', (_req: Request, res: Response) => {
    try {
      const list = db.getAllocations();
      // Return summaries
      const summaries = list.map((a) => ({
        id: a.id,
        examDate: a.examDate,
        shift: a.shift,
        status: a.status,
        generatedAt: a.generatedAt,
        qualityReport: a.qualityReport,
        totalSeats: a.seats.length,
        version: a.version,
      }));
      res.json(summaries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/allocations/:id', (req: Request, res: Response) => {
    try {
      const alloc = db.getAllocationById(req.params.id);
      if (!alloc) return res.status(404).json({ error: 'Allocation not found' });
      res.json(alloc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/allocations/generate', (req: Request, res: Response) => {
    try {
      const { examDate, shift } = req.body;
      if (!examDate || !shift) {
        return res.status(400).json({ error: 'examDate and shift are required' });
      }
      const allocation = db.generateAllocation(examDate, shift);
      res.status(201).json(allocation);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/allocations/:id/status', (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!['draft', 'locked', 'published'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const alloc = db.updateAllocationStatus(req.params.id, status);
      res.json(alloc);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/allocations/:id/override', (req: Request, res: Response) => {
    try {
      const { sourceSeatId, targetSeatId } = req.body;
      if (!sourceSeatId || !targetSeatId) {
        return res.status(400).json({ error: 'sourceSeatId and targetSeatId are required' });
      }
      const updated = db.overrideSeatAssignment(req.params.id, sourceSeatId, targetSeatId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // INVIGILATOR & ATTENDANCE MANAGEMENT
  // ==========================================
  app.get('/api/invigilators', (_req: Request, res: Response) => {
    res.json(db.getInvigilators());
  });

  app.get('/api/invigilators/assignments', (_req: Request, res: Response) => {
    res.json(db.getInvigilatorAssignments());
  });

  app.post('/api/invigilators/assign', (req: Request, res: Response) => {
    try {
      const assignment = db.assignInvigilator(req.body);
      res.status(201).json(assignment);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/invigilators/assignments/:id', (req: Request, res: Response) => {
    try {
      const ok = db.removeInvigilatorAssignment(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Assignment not found' });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/attendance/:allocationId/seat/:seatId', (req: Request, res: Response) => {
    try {
      const { status, remarks } = req.body;
      const updatedSeat = db.updateAttendance(req.params.allocationId, req.params.seatId, status, remarks);
      res.json(updatedSeat);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // STUDENT PUBLIC PORTAL LOOKUP
  // ==========================================
  app.get('/api/student-portal/lookup', (req: Request, res: Response) => {
    try {
      const query = ((req.query.query as string) || '').trim().toUpperCase();
      if (!query || query.length < 3) {
        return res.status(400).json({ error: 'Please enter at least 3 characters of your Roll Number or Registration Number.' });
      }

      const raw = db.getRawData();
      const student = raw.students.find(
        (s) => s.rollNumber.toUpperCase() === query || s.regNumber.toUpperCase() === query
      );

      if (!student) {
        return res.status(404).json({ error: `No student record found matching "${query}". Please check your university hall ticket or contact the Registrar.` });
      }

      // Find published seat allocations for this student
      const publishedAllocations = raw.allocations.filter((a) => a.status === 'published');
      const studentSeats: any[] = [];

      publishedAllocations.forEach((alloc) => {
        const seat = alloc.seats.find((s) => s.studentId === student.id || s.rollNumber === student.rollNumber);
        if (seat) {
          studentSeats.push({
            allocationId: alloc.id,
            examDate: alloc.examDate,
            shift: alloc.shift,
            roomNumber: seat.roomNumber,
            building: seat.building,
            floor: seat.floor === 0 ? 'Ground Floor' : `Floor ${seat.floor}`,
            rowNumber: seat.rowNumber,
            colNumber: seat.colNumber,
            seatLabel: seat.seatLabel,
            subjectCode: seat.subjectCode,
            subjectName: seat.subjectName,
            status: alloc.status,
          });
        }
      });

      res.json({
        student: {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          regNumber: student.regNumber,
          department: raw.departments.find((d) => d.id === student.departmentId)?.name || student.departmentId,
          semester: student.semester,
          isEligible: student.isEligible,
          eligibilityReason: student.eligibilityReason,
          specialNeeds: student.specialNeeds,
        },
        allocations: studentSeats,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ANALYTICS & VISUALIZATION
  // ==========================================
  app.get('/api/analytics', (_req: Request, res: Response) => {
    try {
      const raw = db.getRawData();

      // 1. Department-wise student breakdown
      const departmentDistribution = raw.departments.map((dept) => {
        const count = raw.students.filter((s) => s.departmentId === dept.id).length;
        return {
          code: dept.code,
          name: dept.name,
          count,
        };
      });

      // 2. Room utilization across all published allocations
      const roomStats = raw.rooms.map((room) => {
        // Count how many times seats in this room were allocated
        let totalAssigned = 0;
        raw.allocations.forEach((alloc) => {
          totalAssigned += alloc.seats.filter((s) => s.roomId === room.id).length;
        });

        const avgUtilization =
          raw.allocations.length > 0 && room.availableSeats > 0
            ? Math.min(100, Math.round((totalAssigned / (raw.allocations.length * room.availableSeats)) * 100))
            : 0;

        return {
          roomNumber: room.roomNumber,
          building: room.building,
          capacity: room.seatCapacity,
          availableSeats: room.availableSeats,
          utilizationPercent: avgUtilization,
        };
      });

      // 3. Subject-wise enrollment
      const subjectDistribution = raw.subjects.map((sub) => {
        const count = raw.students.filter((s) => s.subjectCodes.includes(sub.code)).length;
        return {
          code: sub.code,
          name: sub.name,
          count,
        };
      });

      // 4. Attendance summary across active seats
      let presentCount = 0;
      let absentCount = 0;
      let malpracticeCount = 0;
      let notMarkedCount = 0;

      raw.allocations.forEach((alloc) => {
        alloc.seats.forEach((seat) => {
          if (seat.attendanceStatus === 'present') presentCount++;
          else if (seat.attendanceStatus === 'absent') absentCount++;
          else if (seat.attendanceStatus === 'malpractice') malpracticeCount++;
          else notMarkedCount++;
        });
      });

      // 5. Allocation efficiency history
      const efficiencyHistory = raw.allocations.map((a) => ({
        date: a.examDate,
        shift: a.shift.split(' ')[0],
        score: a.qualityReport.overallScore,
        utilization: a.qualityReport.seatUtilizationPercent,
        violations: a.qualityReport.sameSubjectHorizontalViolations + a.qualityReport.sameSubjectVerticalViolations,
      }));

      res.json({
        departmentDistribution,
        roomStats,
        subjectDistribution,
        attendanceBreakdown: {
          present: presentCount,
          absent: absentCount,
          malpractice: malpracticeCount,
          notMarked: notMarkedCount,
        },
        efficiencyHistory,
        summary: {
          totalStudents: raw.students.length,
          totalRooms: raw.rooms.length,
          totalExams: raw.examSchedules.length,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // AUDIT LOGS, SETTINGS & SYSTEM RESET
  // ==========================================
  app.get('/api/audit-logs', (_req: Request, res: Response) => {
    res.json(db.getRawData().auditLogs);
  });

  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = db.updateSettings(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/system/reset-demo', (_req: Request, res: Response) => {
    try {
      db.resetToDefault();
      res.json({ success: true, message: 'Database reset to default reference demonstration state.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE DEV SERVER OR STATIC PRODUCTION
  // ==========================================
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production dist directory not found. Please run npm run build.');
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EXAMATRIX] Application server running at http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error('[EXAMATRIX] Fatal Server Error:', err);
  process.exit(1);
});
