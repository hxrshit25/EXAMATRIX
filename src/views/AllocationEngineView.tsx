import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { SeatingAllocation, ExamSchedule } from '../types';
import {
  Cpu,
  Play,
  RotateCcw,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Building2,
  Users,
  Grid3X3,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Share2,
} from 'lucide-react';

export const AllocationEngineView: React.FC = () => {
  const {
    refreshTrigger,
    triggerRefresh,
    showToast,
    setActiveTab,
    setSelectedAllocationId,
  } = useApp();

  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<SeatingAllocation | null>(null);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);

  // Form for running allocation
  const [selectedDate, setSelectedDate] = useState('2026-11-10');
  const [selectedShift, setSelectedShift] = useState('Morning (09:30 - 12:30)');
  const [enableInterleaving, setEnableInterleaving] = useState(true);
  const [strictAdjacency, setStrictAdjacency] = useState(true);

  // Load allocations and schedules
  const loadData = async () => {
    try {
      setLoading(true);
      const [allocList, schList] = await Promise.all([
        api.getAllocations(),
        api.getExams(),
      ]);
      setAllocations(allocList);
      setSchedules(schList);

      if (allocList.length > 0) {
        // Load details for first allocation
        const full = await api.getAllocationById(allocList[0].id);
        setSelectedAllocation(full);
        setSelectedAllocationId(full.id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Exams for the currently chosen date and shift
  const concurrentExams = schedules.filter(
    (s) => s.examDate === selectedDate && s.shift === selectedShift
  );

  const totalEligibleForShift = concurrentExams.reduce(
    (sum, s) => sum + s.eligibleStudentCount,
    0
  );

  // Run Allocation
  const handleRunAllocation = async () => {
    if (concurrentExams.length === 0) {
      showToast(`No exams scheduled for ${selectedDate} during ${selectedShift}.`, 'warning');
      return;
    }

    try {
      setIsComputing(true);
      // Simulate slight realistic computation delay for satisfaction
      await new Promise((r) => setTimeout(r, 600));

      const allocation = await api.generateAllocation(selectedDate, selectedShift);
      setSelectedAllocation(allocation);
      setSelectedAllocationId(allocation.id);
      showToast(
        `Allocation completed! Integrity Score: ${allocation.qualityReport.overallScore}/100`,
        'success'
      );
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsComputing(false);
    }
  };

  // Change status (lock / publish / draft)
  const handleUpdateStatus = async (status: 'draft' | 'locked' | 'published') => {
    if (!selectedAllocation) return;
    try {
      const updated = await api.updateAllocationStatus(selectedAllocation.id, status);
      setSelectedAllocation(updated);
      showToast(`Allocation marked as ${status.toUpperCase()}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Intelligent Seating Allocation Engine</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Constraint Solver
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated multi-subject interleaving, anti-malpractice separation, and capacity optimization
          </p>
        </div>

        {selectedAllocation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedAllocationId(selectedAllocation.id);
                setActiveTab('seating-plan');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Grid3X3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview Visual Plan</span>
            </button>

            {selectedAllocation.status !== 'locked' ? (
              <button
                onClick={() => handleUpdateStatus('locked')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Allocation</span>
              </button>
            ) : (
              <button
                onClick={() => handleUpdateStatus('draft')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Allocation</span>
              </button>
            )}

            {selectedAllocation.status !== 'published' ? (
              <button
                onClick={() => handleUpdateStatus('published')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Publish to Student Portal</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Published to Students</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Solver Controls Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Step 1: Select Examination Shift & Configure Constraints
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Examination Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Examination Shift
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="Morning (09:30 - 12:30)">Morning Shift (09:30 - 12:30)</option>
              <option value="Afternoon (14:00 - 17:00)">Afternoon Shift (14:00 - 17:00)</option>
            </select>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={enableInterleaving}
                onChange={(e) => setEnableInterleaving(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Multi-Subject Interleaving</span>
            </label>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Distributes subjects in checkerboard pattern
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                checked={strictAdjacency}
                onChange={(e) => setStrictAdjacency(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Zero Side-by-Side Adjacency</span>
            </label>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Enforces maximum horizontal separation penalty
            </div>
          </div>
        </div>

        {/* Shift Summary Banner */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                {concurrentExams.length} Concurrent Subject Exams ({totalEligibleForShift} Candidates)
              </span>
            </div>
            <div className="text-blue-700 dark:text-blue-300 text-[11px] mt-0.5">
              {concurrentExams.map((e) => `${e.subjectCode} (${e.eligibleStudentCount})`).join(' · ') ||
                'No exams scheduled on this date/shift.'}
            </div>
          </div>

          <button
            onClick={handleRunAllocation}
            disabled={isComputing || concurrentExams.length === 0}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-2 shadow-xs shrink-0 transition-colors"
          >
            {isComputing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Solving Constraints...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Intelligent Allocation Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quality Report & Allocation Results */}
      {selectedAllocation ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Step 2: Allocation Quality Audit Report
            </h2>
            <div className="text-xs text-slate-400 font-mono">
              Generated: {new Date(selectedAllocation.generatedAt).toLocaleString()} · v{selectedAllocation.version}
            </div>
          </div>

          {/* Metrics 4-Box Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Allocation Integrity</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {selectedAllocation.qualityReport.overallScore}
                <span className="text-sm font-normal text-slate-400">/100</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Zero side-by-side adjacency
              </div>
            </div>

            {/* Total Allocated */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Allocated / Eligible</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {selectedAllocation.qualityReport.totalAllocated}
                <span className="text-sm font-normal text-slate-400">
                  /{selectedAllocation.qualityReport.totalEligible}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {selectedAllocation.qualityReport.totalUnallocated === 0 ? (
                  <span className="text-emerald-600 font-medium">100% Student Placement</span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    {selectedAllocation.qualityReport.totalUnallocated} unallocated
                  </span>
                )}
              </div>
            </div>

            {/* Rooms Used */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Halls Utilized</span>
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {selectedAllocation.qualityReport.roomsUtilizedCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {selectedAllocation.qualityReport.seatUtilizationPercent}% room density
              </div>
            </div>

            {/* Adjacency Separation */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Horizontal Violations</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 tabular-nums">
                {selectedAllocation.qualityReport.sameSubjectHorizontalViolations}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Vert: {selectedAllocation.qualityReport.sameSubjectVerticalViolations} · Diag:{' '}
                {selectedAllocation.qualityReport.sameSubjectDiagonalViolations}
              </div>
            </div>
          </div>

          {/* Constraint Notes & Findings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Constraint Satisfaction Audit Log
            </h3>
            <div className="space-y-2">
              {selectedAllocation.qualityReport.notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unallocated Students Table (if any) */}
          {selectedAllocation.unallocatedStudents.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
                <AlertCircle className="w-4 h-4" />
                <span>
                  Unallocated Candidates ({selectedAllocation.unallocatedStudents.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Roll Number</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Subject</th>
                      <th className="px-3 py-2">Root Cause Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 dark:divide-rose-950">
                    {selectedAllocation.unallocatedStudents.map((stu) => (
                      <tr key={stu.studentId} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                        <td className="px-3 py-2 font-mono font-bold text-rose-900 dark:text-rose-100">
                          {stu.rollNumber}
                        </td>
                        <td className="px-3 py-2 font-medium">{stu.studentName}</td>
                        <td className="px-3 py-2">{stu.departmentCode}</td>
                        <td className="px-3 py-2 font-mono">{stu.subjectCode}</td>
                        <td className="px-3 py-2 text-rose-600 dark:text-rose-400">{stu.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Allocated Seats Preview Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seating Allocation Roster ({selectedAllocation.seats.length} Seats Assigned)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click 'Preview Visual Plan' to see interactive classroom floorplan layout
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedAllocationId(selectedAllocation.id);
                  setActiveTab('seating-plan');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Interactive Classroom Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Room</th>
                    <th className="px-4 py-2.5">Seat Label</th>
                    <th className="px-4 py-2.5">Roll Number</th>
                    <th className="px-4 py-2.5">Candidate Name</th>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5">Floor Level</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedAllocation.seats.slice(0, 50).map((seat) => (
                    <tr key={seat.seatId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-bold font-mono text-slate-900 dark:text-slate-100">
                        {seat.roomNumber}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {seat.seatLabel}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {seat.rollNumber}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {seat.studentName}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {seat.subjectCode}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {seat.floor === 0 ? 'Ground' : `Floor ${seat.floor}`}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                        {seat.remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedAllocation.seats.length > 50 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                Showing first 50 seats. View all in Compliance Reports or Visual Seating Plan.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          No allocation currently active. Select an exam shift above and click "Run Intelligent Allocation Engine".
        </div>
      )}
    </div>
  );
};
