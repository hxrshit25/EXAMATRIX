import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  CheckCircle2,
  PieChart,
  Activity,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { refreshTrigger, showToast } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .getAnalytics()
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        showToast(err.message, 'error');
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  if (loading || !data) {
    return <div className="p-12 text-center text-slate-400">Loading university analytics...</div>;
  }

  const {
    departmentDistribution,
    roomStats,
    subjectDistribution,
    attendanceBreakdown,
    efficiencyHistory,
  } = data;

  const totalAttendance =
    attendanceBreakdown.present +
    attendanceBreakdown.absent +
    attendanceBreakdown.malpractice +
    attendanceBreakdown.notMarked;

  const attendanceRate =
    totalAttendance > 0
      ? Math.round((attendanceBreakdown.present / totalAttendance) * 100)
      : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Examination Analytics & Utilization Insights</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Live Aggregations
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time space efficiency, departmental demographics, attendance metrics, and algorithm performance
          </p>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-medium">
            <span>Overall Attendance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {attendanceBreakdown.present} verified candidates
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-medium">
            <span>Average Room Utilization</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {Math.round(
              roomStats.reduce((acc: number, r: any) => acc + r.utilizationPercent, 0) /
                (roomStats.length || 1)
            )}
            %
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across active examination halls</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-medium">
            <span>Algorithm Integrity Score</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {efficiencyHistory[0]?.score || 98.5}
            <span className="text-xs text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Optimized interleaving
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-medium">
            <span>Irregularity / Malpractice</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {attendanceBreakdown.malpractice}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Incident reports filed</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Room Utilization Breakdown */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Examination Hall Utilization
            </h3>
            <span className="text-xs text-slate-500">Gross Capacity vs Seated Candidates</span>
          </div>

          <div className="space-y-3 pt-2">
            {roomStats.map((room: any) => (
              <div key={room.roomNumber} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {room.roomNumber} ({room.building})
                  </span>
                  <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                    {room.utilizationPercent}% ({room.availableSeats} Available)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      room.utilizationPercent >= 80
                        ? 'bg-blue-600'
                        : room.utilizationPercent >= 50
                        ? 'bg-emerald-500'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${room.utilizationPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Department-Wise Candidate Distribution */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Department Student Distribution
            </h3>
            <span className="text-xs text-slate-500">Total Enrolled Candidates</span>
          </div>

          <div className="space-y-3 pt-2">
            {departmentDistribution.map((dept: any) => {
              const total = departmentDistribution.reduce(
                (sum: number, d: any) => sum + d.count,
                0
              );
              const pct = total > 0 ? Math.round((dept.count / total) * 100) : 0;

              return (
                <div key={dept.code} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.code} - {dept.name}
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {dept.count} Students ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Subject Candidate Counts */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Subject Enrollment Density
            </h3>
            <span className="text-xs text-slate-500">Candidates by Examination Paper</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {subjectDistribution.map((sub: any) => (
              <div
                key={sub.code}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {sub.code}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {sub.count}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">{sub.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Candidate Attendance Breakdown */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Attendance Verification Ratio
            </h3>
            <span className="text-xs text-slate-500">Real-Time Hall Status</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Horizontal Stacked Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-6 rounded-lg overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                style={{
                  width: `${
                    totalAttendance > 0
                      ? (attendanceBreakdown.present / totalAttendance) * 100
                      : 0
                  }%`,
                }}
                title={`Present: ${attendanceBreakdown.present}`}
              >
                {attendanceBreakdown.present > 0 && `${attendanceBreakdown.present} P`}
              </div>
              <div
                className="bg-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                style={{
                  width: `${
                    totalAttendance > 0
                      ? (attendanceBreakdown.absent / totalAttendance) * 100
                      : 0
                  }%`,
                }}
                title={`Absent: ${attendanceBreakdown.absent}`}
              >
                {attendanceBreakdown.absent > 0 && `${attendanceBreakdown.absent} A`}
              </div>
              <div
                className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                style={{
                  width: `${
                    totalAttendance > 0
                      ? (attendanceBreakdown.malpractice / totalAttendance) * 100
                      : 0
                  }%`,
                }}
                title={`Reported: ${attendanceBreakdown.malpractice}`}
              >
                {attendanceBreakdown.malpractice > 0 && `${attendanceBreakdown.malpractice} R`}
              </div>
              <div
                className="bg-blue-400 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                style={{
                  width: `${
                    totalAttendance > 0
                      ? (attendanceBreakdown.notMarked / totalAttendance) * 100
                      : 0
                  }%`,
                }}
                title={`Pending: ${attendanceBreakdown.notMarked}`}
              >
                {attendanceBreakdown.notMarked > 0 && `${attendanceBreakdown.notMarked} pending`}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  Present ({attendanceBreakdown.present})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  Absent ({attendanceBreakdown.absent})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-400">
                  Reported ({attendanceBreakdown.malpractice})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-400" />
                <span className="text-slate-600 dark:text-slate-400">
                  Pending ({attendanceBreakdown.notMarked})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
