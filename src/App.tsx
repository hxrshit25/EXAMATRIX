import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/Toast';

// Views
import { DashboardView } from './views/DashboardView';
import { StudentManagementView } from './views/StudentManagementView';
import { ExamManagementView } from './views/ExamManagementView';
import { RoomManagementView } from './views/RoomManagementView';
import { AllocationEngineView } from './views/AllocationEngineView';
import { VisualSeatingPlanView } from './views/VisualSeatingPlanView';
import { InvigilatorManagementView } from './views/InvigilatorManagementView';
import { AttendanceManagementView } from './views/AttendanceManagementView';
import { StudentPortalView } from './views/StudentPortalView';
import { ReportsView } from './views/ReportsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 min-w-0 overflow-y-auto">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'students' && <StudentManagementView />}
      {activeTab === 'exams' && <ExamManagementView />}
      {activeTab === 'rooms' && <RoomManagementView />}
      {activeTab === 'allocation' && <AllocationEngineView />}
      {activeTab === 'seating-plan' && <VisualSeatingPlanView />}
      {activeTab === 'invigilators' && <InvigilatorManagementView />}
      {activeTab === 'attendance' && <AttendanceManagementView />}
      {activeTab === 'student-portal' && <StudentPortalView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'settings' && <SettingsView />}

      {/* University Accreditation Footer */}
      <footer className="mt-12 py-6 px-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">EXAMATRIX</span>
            <span>·</span>
            <span>LPU (Lovely Professional University) Examination System</span>
          </div>

          <div className="text-[11px] text-slate-400">
            Smarter Planning · Fairer Allocation · Zero Confusion · Statutory Academic Regulations
          </div>
        </div>
      </footer>
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <MainContent />
        </div>
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
