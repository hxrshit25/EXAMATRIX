import {
  Department,
  Course,
  Subject,
  Student,
  Room,
  ExamSession,
  ExamSchedule,
  Invigilator,
  InvigilatorAssignment,
  SystemSettings,
  AuditLog,
  User,
} from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Dr. Arthur Vance',
    email: 'admin@examatrix.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_coord',
    name: 'Prof. Elena Rostova',
    email: 'coordinator@examatrix.edu',
    role: 'coordinator',
    departmentId: 'dept_cse',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_invig1',
    name: 'Dr. Michael Chen',
    email: 'invigilator@examatrix.edu',
    role: 'invigilator',
    departmentId: 'dept_ece',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering', building: 'Turing Technology Complex' },
  { id: 'dept_ece', code: 'ECE', name: 'Electronics & Communication Engineering', building: 'Maxwell Electrical Block' },
  { id: 'dept_me', code: 'ME', name: 'Mechanical Engineering', building: 'Carnot Industrial Wing' },
  { id: 'dept_it', code: 'IT', name: 'Information Technology', building: 'Shannon Computing Center' },
  { id: 'dept_ce', code: 'CE', name: 'Civil Engineering', building: 'Smeaton Infrastructure Block' },
];

export const INITIAL_COURSES: Course[] = [
  { id: 'crs_btech_cse', departmentId: 'dept_cse', code: 'BTECH-CSE', name: 'Bachelor of Technology in Computer Science', durationYears: 4 },
  { id: 'crs_btech_ece', departmentId: 'dept_ece', code: 'BTECH-ECE', name: 'Bachelor of Technology in Electronics & Comm.', durationYears: 4 },
  { id: 'crs_btech_me', departmentId: 'dept_me', code: 'BTECH-ME', name: 'Bachelor of Technology in Mechanical Eng.', durationYears: 4 },
  { id: 'crs_btech_it', departmentId: 'dept_it', code: 'BTECH-IT', name: 'Bachelor of Technology in Information Tech.', durationYears: 4 },
  { id: 'crs_btech_ce', departmentId: 'dept_ce', code: 'BTECH-CE', name: 'Bachelor of Technology in Civil Engineering', durationYears: 4 },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub_cs501', code: 'CS501', name: 'Data Structures & Algorithms', departmentId: 'dept_cse', semester: 5, credits: 4 },
  { id: 'sub_cs502', code: 'CS502', name: 'Operating Systems & Concurrency', departmentId: 'dept_cse', semester: 5, credits: 4 },
  { id: 'sub_ec501', code: 'EC501', name: 'Digital Signal Processing', departmentId: 'dept_ece', semester: 5, credits: 4 },
  { id: 'sub_ec502', code: 'EC502', name: 'VLSI Circuit Design', departmentId: 'dept_ece', semester: 5, credits: 3 },
  { id: 'sub_me501', code: 'ME501', name: 'Applied Thermodynamics & Heat Transfer', departmentId: 'dept_me', semester: 5, credits: 4 },
  { id: 'sub_it501', code: 'IT501', name: 'Relational Database Management Systems', departmentId: 'dept_it', semester: 5, credits: 4 },
  { id: 'sub_ce501', code: 'CE501', name: 'Structural Analysis & Design', departmentId: 'dept_ce', semester: 5, credits: 4 },
  { id: 'sub_ma501', code: 'MA501', name: 'Advanced Discrete Mathematics', departmentId: 'dept_cse', semester: 5, credits: 3 },
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'rm_r101',
    roomNumber: 'R-101',
    building: 'Ramanujan Mathematical Complex',
    floor: 0,
    totalRows: 6,
    totalColumns: 10,
    seatCapacity: 60,
    availableSeats: 58,
    roomType: 'Examination Hall',
    accessibilityInfo: 'Wheelchair Accessible, Ground Floor, Direct Ramp Access',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: ['R1C5', 'R1C6'], // Reserved for invigilator desk and proctor cameras
      aisles: [5], // Main center aisle between col 5 and 6
      customLabels: {},
    },
  },
  {
    id: 'rm_t201',
    roomNumber: 'T-201',
    building: 'Turing Technology Complex',
    floor: 2,
    totalRows: 8,
    totalColumns: 10,
    seatCapacity: 80,
    availableSeats: 76,
    roomType: 'Auditorium',
    accessibilityInfo: 'Elevator Accessible, Stepped Hall, PA System Integrated',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: ['R8C1', 'R8C2', 'R8C9', 'R8C10'], // Damaged audio sockets
      aisles: [3, 7], // Twin side aisles
      customLabels: {},
    },
  },
  {
    id: 'rm_c102',
    roomNumber: 'C-102',
    building: 'Curie Science Pavilion',
    floor: 1,
    totalRows: 5,
    totalColumns: 8,
    seatCapacity: 40,
    availableSeats: 40,
    roomType: 'Lecture Theater',
    accessibilityInfo: 'Elevator Accessible, Wide Desks, CCTV Monitored',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: [],
      aisles: [4],
      customLabels: {},
    },
  },
  {
    id: 'rm_ng01',
    roomNumber: 'N-G01',
    building: 'Newton Wing',
    floor: 0,
    totalRows: 5,
    totalColumns: 8,
    seatCapacity: 40,
    availableSeats: 38,
    roomType: 'Classroom',
    accessibilityInfo: 'Wheelchair Accessible, Ground Floor, Air Conditioned',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: ['R5C1', 'R5C2'],
      aisles: [4],
      customLabels: {},
    },
  },
  {
    id: 'rm_a301',
    roomNumber: 'A-301',
    building: 'Aryabhata Academic Block',
    floor: 3,
    totalRows: 6,
    totalColumns: 8,
    seatCapacity: 48,
    availableSeats: 48,
    roomType: 'Lecture Theater',
    accessibilityInfo: 'Elevator access available, 3rd Floor',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: [],
      aisles: [4],
      customLabels: {},
    },
  },
  {
    id: 'rm_b205',
    roomNumber: 'B-205',
    building: 'Babbage Computing Center',
    floor: 2,
    totalRows: 4,
    totalColumns: 8,
    seatCapacity: 32,
    availableSeats: 30,
    roomType: 'Classroom',
    accessibilityInfo: 'Elevator access, Floor 2',
    isAvailable: true,
    layoutConfig: {
      blockedSeats: ['R1C1', 'R4C8'],
      aisles: [4],
      customLabels: {},
    },
  },
];

export const INITIAL_INVIGILATORS: Invigilator[] = [
  { id: 'inv_01', employeeId: 'FAC-2011', name: 'Dr. Michael Chen', email: 'm.chen@examatrix.edu', phone: '+1 (555) 019-2831', departmentId: 'dept_ece', designation: 'Associate Professor', isAvailable: true },
  { id: 'inv_02', employeeId: 'FAC-2018', name: 'Prof. Sarah Jenkins', email: 's.jenkins@examatrix.edu', phone: '+1 (555) 019-4820', departmentId: 'dept_cse', designation: 'Professor', isAvailable: true },
  { id: 'inv_03', employeeId: 'FAC-2022', name: 'Dr. Rajesh Nair', email: 'r.nair@examatrix.edu', phone: '+1 (555) 019-7712', departmentId: 'dept_me', designation: 'Assistant Professor', isAvailable: true },
  { id: 'inv_04', employeeId: 'FAC-2015', name: 'Dr. Diane Foster', email: 'd.foster@examatrix.edu', phone: '+1 (555) 019-3390', departmentId: 'dept_it', designation: 'Associate Professor', isAvailable: true },
  { id: 'inv_05', employeeId: 'FAC-2024', name: 'Dr. Kevin Walsh', email: 'k.walsh@examatrix.edu', phone: '+1 (555) 019-9182', departmentId: 'dept_ce', designation: 'Assistant Professor', isAvailable: true },
  { id: 'inv_06', employeeId: 'FAC-2010', name: 'Prof. Amara Okafor', email: 'a.okafor@examatrix.edu', phone: '+1 (555) 019-5419', departmentId: 'dept_cse', designation: 'Professor', isAvailable: true },
  { id: 'inv_07', employeeId: 'FAC-2021', name: 'Dr. Hiroshi Tanaka', email: 'h.tanaka@examatrix.edu', phone: '+1 (555) 019-6120', departmentId: 'dept_ece', designation: 'Assistant Professor', isAvailable: true },
  { id: 'inv_08', employeeId: 'FAC-2019', name: 'Dr. Maria Morales', email: 'm.morales@examatrix.edu', phone: '+1 (555) 019-8801', departmentId: 'dept_me', designation: 'Assistant Professor', isAvailable: true },
];

export const INITIAL_EXAM_SESSIONS: ExamSession[] = [
  {
    id: 'sess_autumn2026',
    name: 'Autumn End-Semester Regular Examinations 2026',
    academicYear: '2026-2027',
    startDate: '2026-11-10',
    endDate: '2026-11-25',
    status: 'scheduled',
  },
  {
    id: 'sess_midterm2026',
    name: 'Continuous Assessment Mid-Term Evaluations 2026',
    academicYear: '2026-2027',
    startDate: '2026-12-05',
    endDate: '2026-12-15',
    status: 'draft',
  },
];

export const INITIAL_EXAM_SCHEDULES: ExamSchedule[] = [
  {
    id: 'sch_cs501',
    sessionId: 'sess_autumn2026',
    examName: 'Data Structures & Algorithms Final Exam',
    departmentId: 'dept_cse',
    semester: 5,
    subjectId: 'sub_cs501',
    subjectCode: 'CS501',
    subjectName: 'Data Structures & Algorithms',
    examDate: '2026-11-10',
    startTime: '09:30',
    endTime: '12:30',
    shift: 'Morning (09:30 - 12:30)',
    eligibleStudentCount: 38,
  },
  {
    id: 'sch_ec501',
    sessionId: 'sess_autumn2026',
    examName: 'Digital Signal Processing Theory Exam',
    departmentId: 'dept_ece',
    semester: 5,
    subjectId: 'sub_ec501',
    subjectCode: 'EC501',
    subjectName: 'Digital Signal Processing',
    examDate: '2026-11-10',
    startTime: '09:30',
    endTime: '12:30',
    shift: 'Morning (09:30 - 12:30)',
    eligibleStudentCount: 26,
  },
  {
    id: 'sch_me501',
    sessionId: 'sess_autumn2026',
    examName: 'Applied Thermodynamics Mid/End Exam',
    departmentId: 'dept_me',
    semester: 5,
    subjectId: 'sub_me501',
    subjectCode: 'ME501',
    subjectName: 'Applied Thermodynamics & Heat Transfer',
    examDate: '2026-11-10',
    startTime: '14:00',
    endTime: '17:00',
    shift: 'Afternoon (14:00 - 17:00)',
    eligibleStudentCount: 24,
  },
  {
    id: 'sch_it501',
    sessionId: 'sess_autumn2026',
    examName: 'Database Management Systems Examination',
    departmentId: 'dept_it',
    semester: 5,
    subjectId: 'sub_it501',
    subjectCode: 'IT501',
    subjectName: 'Relational Database Management Systems',
    examDate: '2026-11-10',
    startTime: '14:00',
    endTime: '17:00',
    shift: 'Afternoon (14:00 - 17:00)',
    eligibleStudentCount: 20,
  },
  {
    id: 'sch_cs502',
    sessionId: 'sess_autumn2026',
    examName: 'Operating Systems & Concurrency Final',
    departmentId: 'dept_cse',
    semester: 5,
    subjectId: 'sub_cs502',
    subjectCode: 'CS502',
    subjectName: 'Operating Systems & Concurrency',
    examDate: '2026-11-12',
    startTime: '09:30',
    endTime: '12:30',
    shift: 'Morning (09:30 - 12:30)',
    eligibleStudentCount: 38,
  },
  {
    id: 'sch_ce501',
    sessionId: 'sess_autumn2026',
    examName: 'Structural Analysis & Design Exam',
    departmentId: 'dept_ce',
    semester: 5,
    subjectId: 'sub_ce501',
    subjectCode: 'CE501',
    subjectName: 'Structural Analysis & Design',
    examDate: '2026-11-12',
    startTime: '09:30',
    endTime: '12:30',
    shift: 'Morning (09:30 - 12:30)',
    eligibleStudentCount: 16,
  },
];

// Helper to generate 115 realistic university students
export function generateSeedStudents(): Student[] {
  const students: Student[] = [];

  const cseNames = [
    'Aarav Sharma', 'Aditi Verma', 'Alex Mercer', 'Ananya Patel', 'Benjamin Hayes',
    'Chloe Zhao', 'Daniel Kim', 'Devon Brooks', 'Emily Watson', 'Faisal Al-Mansoor',
    'Gaurav Rao', 'Grace Hopper', 'Hannah Schmidt', 'Ian Gallagher', 'Isha Mehra',
    'Jacob Miller', 'Jessica Taylor', 'Karan Johar', 'Kavya Nair', 'Lucas Bennett',
    'Maya Lin', 'Nathan Drake', 'Nisha Sen', 'Oliver Queen', 'Pooja Hegde',
    'Quinn Fabray', 'Rohan Gupta', 'Samantha Ray', 'Siddharth Roy', 'Tara Davis',
    'Uma Krishnan', 'Varun Dhawan', 'Victor Frankenstein', 'William Bell', 'Xavier Woods',
    'Yasmin Khan', 'Zachary Levi', 'Zoya Akhtar', 'Aiden Pearce', 'Bradley Cooper'
  ];

  const eceNames = [
    'Abhishek Bose', 'Bhavna Kulkarni', 'Carlos Mendoza', 'Deepak Chopra', 'Elena Gilbert',
    'Farhan Akhtar', 'Geeta Phogat', 'Harshit Agrawal', 'Indira Varma', 'Justin Trudeau',
    'Kriti Sanon', 'Lakshya Sen', 'Manish Malhotra', 'Nandini Murthy', 'Omkar Patil',
    'Pranav Anand', 'Radhika Apte', 'Sanjay Dutt', 'Tanvi Shah', 'Udit Narayan',
    'Vandana Shiva', 'Winston Churchill', 'Yash Raj', 'Zara Larson', 'Aakash Verma', 'Bharat Reddy'
  ];

  const meNames = [
    'Akshay Kumar', 'Bipasha Basu', 'Chetan Bhagat', 'Dia Mirza', 'Esha Deol',
    'Fardeen Khan', 'Govinda Ahuja', 'Hema Malini', 'Imran Hashmi', 'Juhi Chawla',
    'Kapil Sharma', 'Lara Dutta', 'Madhuri Dixit', 'Nana Patekar', 'Paresh Rawal',
    'Rajkummar Rao', 'Sonu Sood', 'Tabu Hashmi', 'Upendra Rao', 'Vivek Oberoi',
    'Waheeda Rehman', 'Zayed Khan', 'Armaan Malik', 'Badshah Singh', 'Chunky Pandey'
  ];

  const itNames = [
    'Alia Bhatt', 'Bobby Deol', 'Daisy Shah', 'Dino Morea', 'Genelia DSouza',
    'Harman Baweja', 'Ileana DCruz', 'Jackie Shroff', 'Kareena Kapoor', 'Malaika Arora',
    'Nargis Fakhri', 'Preity Zinta', 'Rani Mukerji', 'Saif Ali Khan', 'Tiger Shroff',
    'Urvashee Rautela', 'Varun Sharma', 'Yami Gautam', 'Zeenat Aman', 'Aftab Shivdasani'
  ];

  const ceNames = [
    'Anupam Kher', 'Boman Irani', 'Danny Denzongpa', 'Gulshan Grover', 'Kay Kay Menon',
    'Manoj Bajpayee', 'Naseeruddin Shah', 'Pankaj Tripathi', 'Piyush Mishra', 'Raghubir Yadav',
    'Saurabh Shukla', 'Tigmanshu Dhulia', 'Virendra Saxena', 'Ashutosh Rana', 'Vijay Raaz', 'Deepak Dobriyal'
  ];

  let idCounter = 1;

  // CSE Students (40 students, Semester 5)
  cseNames.forEach((name, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    const isSpecial = i === 4; // Alex Mercer has mobility requirement (needs ground floor)
    const isDebarred = i === 38; // Aiden Pearce debarred for low attendance
    students.push({
      id: `stu_cse_${idCounter++}`,
      regNumber: `2024REGCS${num}`,
      rollNumber: `24BCS${num}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@student.examatrix.edu`,
      departmentId: 'dept_cse',
      courseId: 'crs_btech_cse',
      semester: 5,
      section: i < 20 ? 'A' : 'B',
      subjectCodes: ['CS501', 'CS502', 'MA501'],
      isEligible: !isDebarred,
      eligibilityReason: isDebarred ? 'Debarred: Attendance below 75% statutory threshold' : 'Eligible for all enrolled subjects',
      specialNeeds: isSpecial,
    });
  });

  // ECE Students (26 students, Semester 5)
  eceNames.forEach((name, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    const isSpecial = i === 2; // Carlos Mendoza requires ground floor
    students.push({
      id: `stu_ece_${idCounter++}`,
      regNumber: `2024REGEC${num}`,
      rollNumber: `24BEC${num}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@student.examatrix.edu`,
      departmentId: 'dept_ece',
      courseId: 'crs_btech_ece',
      semester: 5,
      section: 'A',
      subjectCodes: ['EC501', 'EC502', 'MA501'],
      isEligible: true,
      eligibilityReason: 'Eligible',
      specialNeeds: isSpecial,
    });
  });

  // ME Students (25 students, Semester 5)
  meNames.forEach((name, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    const isDebarred = i === 24;
    students.push({
      id: `stu_me_${idCounter++}`,
      regNumber: `2024REGME${num}`,
      rollNumber: `24BME${num}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@student.examatrix.edu`,
      departmentId: 'dept_me',
      courseId: 'crs_btech_me',
      semester: 5,
      section: 'A',
      subjectCodes: ['ME501'],
      isEligible: !isDebarred,
      eligibilityReason: isDebarred ? 'Fee dues pending clearance' : 'Eligible',
      specialNeeds: false,
    });
  });

  // IT Students (20 students, Semester 5)
  itNames.forEach((name, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    students.push({
      id: `stu_it_${idCounter++}`,
      regNumber: `2024REGIT${num}`,
      rollNumber: `24BIT${num}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@student.examatrix.edu`,
      departmentId: 'dept_it',
      courseId: 'crs_btech_it',
      semester: 5,
      section: 'A',
      subjectCodes: ['IT501', 'MA501'],
      isEligible: true,
      eligibilityReason: 'Eligible',
      specialNeeds: false,
    });
  });

  // CE Students (16 students, Semester 5)
  ceNames.forEach((name, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    students.push({
      id: `stu_ce_${idCounter++}`,
      regNumber: `2024REGCE${num}`,
      rollNumber: `24BCE${num}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@student.examatrix.edu`,
      departmentId: 'dept_ce',
      courseId: 'crs_btech_ce',
      semester: 5,
      section: 'A',
      subjectCodes: ['CE501'],
      isEligible: true,
      eligibilityReason: 'Eligible',
      specialNeeds: false,
    });
  });

  return students;
}

export const INITIAL_SETTINGS: SystemSettings = {
  universityName: 'Lovely Professional University (LPU)',
  academicYear: '2026-2027',
  enableInterleaving: true,
  strictAdjacencyPrevention: true,
  allowManualOverrides: true,
  autoLockMinutesBeforeShift: 180,
  requireInvigilatorConfirmation: true,
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    timestamp: '2026-11-05T14:32:00Z',
    userEmail: 'admin@examatrix.edu',
    userName: 'Dr. Arthur Vance',
    action: 'SESSION_INITIALIZATION',
    entity: 'ExamSession',
    details: 'Configured Autumn End-Semester Regular Examinations 2026 academic window.',
  },
  {
    id: 'log_02',
    timestamp: '2026-11-05T15:10:00Z',
    userEmail: 'coordinator@examatrix.edu',
    userName: 'Prof. Elena Rostova',
    action: 'SCHEDULE_CREATION',
    entity: 'ExamSchedule',
    details: 'Added schedule CS501 Data Structures and EC501 Digital Signal Processing for 2026-11-10 Morning Shift.',
  },
  {
    id: 'log_03',
    timestamp: '2026-11-05T16:05:00Z',
    userEmail: 'admin@examatrix.edu',
    userName: 'Dr. Arthur Vance',
    action: 'ROOM_LAYOUT_CONFIGURED',
    entity: 'Room',
    details: 'Configured Ramanujan Hall (R-101) with 60 capacity and 2 AV-blocked proctor seats.',
  },
];
