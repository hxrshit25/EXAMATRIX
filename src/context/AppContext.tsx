import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, Department, Course, Subject } from '../types';
import { api } from '../api/client';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'exams'
  | 'rooms'
  | 'allocation'
  | 'seating-plan'
  | 'invigilators'
  | 'attendance'
  | 'student-portal'
  | 'reports'
  | 'analytics'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextValue {
  currentUser: User;
  switchRole: (role: Role) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  departments: Department[];
  courses: Course[];
  subjects: Subject[];
  refreshMasterData: () => Promise<void>;
  refreshTrigger: number;
  triggerRefresh: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  removeToast: (id: string) => void;
  selectedAllocationId: string | null;
  setSelectedAllocationId: (id: string | null) => void;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_USERS: Record<Role, User> = {
  admin: {
    id: 'usr_admin',
    name: 'Dr. Arthur Vance',
    email: 'admin@examatrix.edu',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  },
  coordinator: {
    id: 'usr_coord',
    name: 'Prof. Elena Rostova',
    email: 'coordinator@examatrix.edu',
    role: 'coordinator',
    departmentId: 'dept_cse',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
  invigilator: {
    id: 'usr_invig1',
    name: 'Dr. Michael Chen',
    email: 'invigilator@examatrix.edu',
    role: 'invigilator',
    departmentId: 'dept_ece',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
  },
  student: {
    id: 'usr_student',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@student.examatrix.edu',
    role: 'student',
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS.admin);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('examatrix_theme') === 'dark';
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('examatrix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('examatrix_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const switchRole = (role: Role) => {
    const user = DEFAULT_USERS[role];
    setCurrentUser(user);
    if (role === 'student') {
      setActiveTab('student-portal');
    } else if (role === 'invigilator') {
      setActiveTab('attendance');
    } else if (activeTab === 'student-portal') {
      setActiveTab('dashboard');
    }
    showToast(`Switched active context to ${role.toUpperCase()} mode: ${user.name}`, 'info');
  };

  const refreshMasterData = async () => {
    try {
      const [deptRes, crsRes, subRes] = await Promise.all([
        api.getDepartments(),
        api.getCourses(),
        api.getSubjects(),
      ]);
      setDepartments(deptRes);
      setCourses(crsRes);
      setSubjects(subRes);
    } catch (err: any) {
      console.error('Failed to load master data:', err);
    }
  };

  useEffect(() => {
    refreshMasterData();
  }, [refreshTrigger]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchRole,
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        departments,
        courses,
        subjects,
        refreshMasterData,
        refreshTrigger,
        triggerRefresh,
        toasts,
        showToast,
        removeToast,
        selectedAllocationId,
        setSelectedAllocationId,
        selectedRoomId,
        setSelectedRoomId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
