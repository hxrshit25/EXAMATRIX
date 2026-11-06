import {
  Student,
  Room,
  ExamSchedule,
  SeatingAllocation,
  Invigilator,
  InvigilatorAssignment,
  SystemSettings,
  DashboardStats,
  StudentLookupResult,
  Department,
  Course,
  Subject,
  AuditLog,
  User,
} from '../types';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `API request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) errorMsg = body.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, role?: string) =>
    request<{ success: boolean; user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  // Stats
  getStats: () => request<DashboardStats>('/api/stats'),

  // Master data
  getDepartments: () => request<Department[]>('/api/departments'),
  getCourses: () => request<Course[]>('/api/courses'),
  getSubjects: () => request<Subject[]>('/api/subjects'),

  // Students
  getStudents: (params?: { search?: string; departmentId?: string; semester?: string; eligibility?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<Student[]>(`/api/students${qs ? `?${qs}` : ''}`);
  },
  createStudent: (data: Omit<Student, 'id'>) =>
    request<Student>('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStudent: (id: string, data: Partial<Student>) =>
    request<Student>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteStudent: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/students/${id}`, {
      method: 'DELETE',
    }),
  bulkImportStudents: (students: Omit<Student, 'id'>[]) =>
    request<{ added: number; skipped: number; errors: string[] }>('/api/students/bulk', {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  // Rooms
  getRooms: () => request<Room[]>('/api/rooms'),
  createRoom: (data: Omit<Room, 'id' | 'availableSeats'>) =>
    request<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRoom: (id: string, data: Partial<Room>) =>
    request<Room>(`/api/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRoom: (id: string) =>
    request<{ success: boolean }>(`/api/rooms/${id}`, {
      method: 'DELETE',
    }),

  // Exams
  getExams: () => request<ExamSchedule[]>('/api/exams'),
  createExam: (data: Omit<ExamSchedule, 'id' | 'eligibleStudentCount'>) =>
    request<ExamSchedule>('/api/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExam: (id: string, data: Partial<ExamSchedule>) =>
    request<ExamSchedule>(`/api/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExam: (id: string) =>
    request<{ success: boolean }>(`/api/exams/${id}`, {
      method: 'DELETE',
    }),
  getExamConflicts: () =>
    request<Array<{ schedule1: string; schedule2: string; reason: string }>>('/api/exams/conflicts'),

  // Allocations
  getAllocations: () =>
    request<
      Array<{
        id: string;
        examDate: string;
        shift: any;
        status: 'draft' | 'locked' | 'published';
        generatedAt: string;
        qualityReport: any;
        totalSeats: number;
        version: number;
      }>
    >('/api/allocations'),
  getAllocationById: (id: string) => request<SeatingAllocation>(`/api/allocations/${id}`),
  generateAllocation: (examDate: string, shift: string) =>
    request<SeatingAllocation>('/api/allocations/generate', {
      method: 'POST',
      body: JSON.stringify({ examDate, shift }),
    }),
  updateAllocationStatus: (id: string, status: 'draft' | 'locked' | 'published') =>
    request<SeatingAllocation>(`/api/allocations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  overrideSeat: (allocationId: string, sourceSeatId: string, targetSeatId: string) =>
    request<SeatingAllocation>(`/api/allocations/${allocationId}/override`, {
      method: 'POST',
      body: JSON.stringify({ sourceSeatId, targetSeatId }),
    }),

  // Invigilators
  getInvigilators: () => request<Invigilator[]>('/api/invigilators'),
  getInvigilatorAssignments: () => request<InvigilatorAssignment[]>('/api/invigilators/assignments'),
  assignInvigilator: (data: Omit<InvigilatorAssignment, 'id'>) =>
    request<InvigilatorAssignment>('/api/invigilators/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeInvigilatorAssignment: (id: string) =>
    request<{ success: boolean }>(`/api/invigilators/assignments/${id}`, {
      method: 'DELETE',
    }),

  // Attendance
  updateAttendance: (allocationId: string, seatId: string, status: string, remarks?: string) =>
    request<any>(`/api/attendance/${allocationId}/seat/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    }),

  // Student Portal
  lookupStudent: (query: string) =>
    request<StudentLookupResult>(`/api/student-portal/lookup?query=${encodeURIComponent(query)}`),

  // Analytics
  getAnalytics: () =>
    request<{
      departmentDistribution: { code: string; name: string; count: number }[];
      roomStats: { roomNumber: string; building: string; capacity: number; availableSeats: number; utilizationPercent: number }[];
      subjectDistribution: { code: string; name: string; count: number }[];
      attendanceBreakdown: { present: number; absent: number; malpractice: number; notMarked: number };
      efficiencyHistory: { date: string; shift: string; score: number; utilization: number; violations: number }[];
      summary: { totalStudents: number; totalRooms: number; totalExams: number };
    }>('/api/analytics'),

  // Audit Logs & Settings
  getAuditLogs: () => request<AuditLog[]>('/api/audit-logs'),
  getSettings: () => request<SystemSettings>('/api/settings'),
  updateSettings: (settings: Partial<SystemSettings>) =>
    request<SystemSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  resetDemoData: () =>
    request<{ success: boolean; message: string }>('/api/system/reset-demo', {
      method: 'POST',
    }),
};
