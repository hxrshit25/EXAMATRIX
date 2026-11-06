import React from 'react';
import { useApp } from '../../context/AppContext';
import { Role } from '../../types';
import { Sun, Moon, Search, Shield, UserCheck, GraduationCap, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchRole,
    darkMode,
    toggleDarkMode,
    setActiveTab,
    showToast,
    triggerRefresh,
  } = useApp();

  const handleResetDemo = async () => {
    if (window.confirm('Reset database to pristine university demonstration seed state?')) {
      try {
        await api.resetDemoData();
        triggerRefresh();
        showToast('Database reset to reference university state.', 'success');
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-extrabold text-lg shadow-sm group-hover:bg-blue-800 transition-colors">
                <span className="tracking-tighter">EX</span>
              </div>
              <div>
                <div className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                  EXAMATRIX
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    ACADEMIC
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
                  Smarter Planning · Fairer Allocation · Zero Confusion
                </div>
              </div>
            </button>
          </div>

          {/* Zone 2: Role Switcher & Context Selector */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-750">
            <button
              onClick={() => switchRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentUser.role === 'admin'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => switchRole('coordinator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentUser.role === 'coordinator'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Coordinator</span>
            </button>

            <button
              onClick={() => switchRole('invigilator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentUser.role === 'invigilator'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Invigilator</span>
            </button>

            <button
              onClick={() => switchRole('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                currentUser.role === 'student'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </button>
          </div>

          {/* Zone 3: Quick Tools & Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('student-portal')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title="Lookup Exam Seat by Roll Number"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Seat Lookup</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Reset Demo Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
