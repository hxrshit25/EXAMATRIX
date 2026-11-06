import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Building2,
  Cpu,
  Grid3X3,
  UserCheck,
  ClipboardCheck,
  Search,
  FileSpreadsheet,
  BarChart3,
  Settings,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'allocation', label: 'Seating Engine', icon: Cpu, badge: 'Core' },
  { id: 'seating-plan', label: 'Visual Floorplan', icon: Grid3X3 },
  { id: 'exams', label: 'Exam Schedules', icon: CalendarDays },
  { id: 'rooms', label: 'Classroom Layouts', icon: Building2 },
  { id: 'students', label: 'Student Directory', icon: GraduationCap },
  { id: 'invigilators', label: 'Invigilator Roster', icon: UserCheck },
  { id: 'attendance', label: 'Attendance Sheet', icon: ClipboardCheck },
  { id: 'student-portal', label: 'Hall Ticket Lookup', icon: Search },
  { id: 'reports', label: 'Compliance Reports', icon: FileSpreadsheet },
  { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Logs', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, currentUser } = useApp();

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-slate-50/50 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 p-4 select-none no-print">
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Main Management
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Academic Infrastructure
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.slice(3, 8).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Reports & Insights
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.slice(8).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Status card */}
        <div className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Live Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              OPTIMIZED
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Interleaving algorithm prevents adjacent same-subject cheating.
          </p>
        </div>
      </div>
    </aside>
  );
};
