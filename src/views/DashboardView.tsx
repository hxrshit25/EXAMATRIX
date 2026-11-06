import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import {
  Users,
  Calendar,
  Building2,
  Armchair,
  Percent,
  Cpu,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setActiveTab, refreshTrigger, showToast } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getStats()
      .then((data) => {
        if (mounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-slate-500 font-medium">Loading university exam metrics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with University Identity & System Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white p-6 md:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-800/60 border border-blue-700/50 text-blue-200 text-xs font-medium mb-3">
            <span>LPU (Lovely Professional University) Examination Platform</span>
            <span>·</span>
            <span>Autumn Term 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            Intelligent Examination Seating & Fair Allocation
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
            Automating multi-department seat distribution, anti-malpractice interleaving, invigilator
            rosters, and official attendance compliance sheets with zero manual friction.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => setActiveTab('allocation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Allocation Engine</span>
            </button>
            <button
              onClick={() => setActiveTab('seating-plan')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/20"
            >
              <span>View Visual Classroom Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Students</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalStudents}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">{stats.eligibleStudents}</span> eligible
          </div>
        </div>

        {/* Total Halls */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Exam Halls</span>
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalRooms}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 4 campus blocks</div>
        </div>

        {/* Total Seats */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Available Seats</span>
            <Armchair className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalAvailableSeats}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Net usable capacity</div>
        </div>

        {/* Allocated Seats */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Seated Students</span>
            <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.allocatedSeats}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className={stats.unallocatedStudents > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600'}>
              {stats.unallocatedStudents}
            </span>{' '}
            unseated
          </div>
        </div>

        {/* Room Occupancy */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Occupancy</span>
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.roomOccupancyPercent}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.roomOccupancyPercent)}%` }}
            />
          </div>
        </div>

        {/* Quality Score */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Allocation Score</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.qualityScore}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">High integrity</div>
        </div>
      </div>

      {/* Main 2-Column Split: Upcoming Exams & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Upcoming Exam Schedules & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Schedules Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Upcoming Examination Sessions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scheduled evaluations requiring hall allocation
                </p>
              </div>
              <button
                onClick={() => setActiveTab('exams')}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
              >
                <span>View All Schedules</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        {exam.subjectCode}
                      </span>
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {exam.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.examDate}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.shift}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {exam.eligibleStudentCount} Students
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {exam.department || 'Enrolled Candidates'}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('allocation')}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      Allocate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Scenarios & Stress Tests Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Engine Evaluation Test Scenarios
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pre-configured benchmark cases to inspect algorithm constraints
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setActiveTab('allocation');
                  showToast('Selected Multi-Subject Interleaving test case for 2026-11-10 Morning Shift.', 'info');
                }}
                className="p-3 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Scenario A: Multi-Subject Interleaving
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Runs CS501 + EC501 concurrently. Verifies checkerboard seating to prevent side-by-side cheating.
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('rooms');
                  showToast('Navigated to Classroom Layouts to inspect custom blocked seats and aisles.', 'info');
                }}
                className="p-3 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Scenario B: Blocked Seats & Walking Aisles
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inspects Ramanujan Hall & Turing Auditorium with disabled seats and center aisles.
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('students');
                  showToast('Opened Student Directory to review debarred students and mobility accommodations.', 'info');
                }}
                className="p-3 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Scenario C: Ineligibility & Debarred Filtering
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Validates that debarred students are excluded from allocations with explicit audit logs.
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('attendance');
                  showToast('Loaded Attendance Register to review Present, Absent, and Malpractice reporting.', 'info');
                }}
                className="p-3 text-left rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Scenario D: Invigilator Sign-Off & Malpractice
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Simulates room-wise attendance marking with confiscated formula sheet incident.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Quick Actions & Recent Activities */}
        <div className="space-y-6">
          {/* Quick Action Buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-3">
              Administrative Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('students')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Enroll New Student</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('rooms')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Configure Room Seating</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('invigilators')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Assign Hall Invigilators</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span>Export Seating PDF & CSV</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Audit Activity Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Recent Audit Trail
              </h3>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View all logs
              </button>
            </div>

            <div className="space-y-3">
              {stats.recentActivities.slice(0, 6).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
