import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { SeatingAllocation, Room, InvigilatorAssignment } from '../types';
import {
  FileText,
  Download,
  Printer,
  Table,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { refreshTrigger, showToast } = useApp();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedAlloc, setSelectedAlloc] = useState<SeatingAllocation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invDuties, setInvDuties] = useState<InvigilatorAssignment[]>([]);
  const [reportType, setReportType] = useState<
    'room-plan' | 'student-master' | 'subject-summary' | 'invigilator-roster' | 'utilization'
  >('room-plan');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocList, roomList, dutyList] = await Promise.all([
        api.getAllocations(),
        api.getRooms(),
        api.getInvigilatorAssignments(),
      ]);
      setAllocations(allocList);
      setRooms(roomList);
      setInvDuties(dutyList);

      if (allocList.length > 0) {
        const full = await api.getAllocationById(allocList[0].id);
        setSelectedAlloc(full);
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

  // Export current report as CSV
  const handleExportCsv = () => {
    if (!selectedAlloc) return;
    let csvContent = '';
    let filename = `examatrix_${reportType}_${Date.now()}.csv`;

    if (reportType === 'room-plan' || reportType === 'student-master') {
      csvContent = 'RoomNumber,Building,SeatLabel,RowNumber,ColNumber,RollNumber,RegNumber,StudentName,SubjectCode,SubjectName,Department\n';
      const rows = selectedAlloc.seats
        .filter((s) => selectedRoomId === 'all' || s.roomId === selectedRoomId)
        .map(
          (s) =>
            `"${s.roomNumber}","${s.building}","${s.seatLabel}",${s.rowNumber},${s.colNumber},"${s.rollNumber}","${s.regNumber}","${s.studentName}","${s.subjectCode}","${s.subjectName}","${s.departmentCode}"`
        );
      csvContent += rows.join('\n');
    } else if (reportType === 'invigilator-roster') {
      csvContent = 'InvigilatorName,RoomNumber,ExamDate,Shift,Status\n';
      const rows = invDuties.map(
        (d) => `"${d.invigilatorName}","${d.roomNumber}","${d.examDate}","${d.shift}","${d.status}"`
      );
      csvContent += rows.join('\n');
    } else if (reportType === 'utilization') {
      csvContent = 'RoomNumber,Building,Floor,TotalCapacity,UsableSeats,AllocatedSeats,UtilizationPercent\n';
      const rows = rooms.map((r) => {
        const allocated = selectedAlloc.seats.filter((s) => s.roomId === r.id).length;
        const pct = r.availableSeats > 0 ? Math.round((allocated / r.availableSeats) * 100) : 0;
        return `"${r.roomNumber}","${r.building}",${r.floor},${r.seatCapacity},${r.availableSeats},${allocated},"${pct}%"`;
      });
      csvContent += rows.join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename} successfully.`, 'success');
  };

  if (loading || !selectedAlloc) {
    return <div className="p-12 text-center text-slate-400">Loading reports module...</div>;
  }

  // Filter seats based on room selection
  const visibleSeats = selectedAlloc.seats.filter(
    (s) => selectedRoomId === 'all' || s.roomId === selectedRoomId
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Examination Reports & Compliance Center</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Official Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download and print classroom door posters, master candidate lists, invigilator duty rosters, and utilization audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Data</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'room-plan', label: 'Room Door Poster', icon: Building2 },
            { id: 'student-master', label: 'Master Student List', icon: Users },
            { id: 'subject-summary', label: 'Subject Breakdown', icon: Layers },
            { id: 'invigilator-roster', label: 'Invigilator Roster', icon: CheckCircle2 },
            { id: 'utilization', label: 'Room Utilization Audit', icon: Table },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-1.5" />
                <div className="text-xs">{tab.label}</div>
              </button>
            );
          })}
        </div>

        {/* Room Filter for Room Door Poster */}
        {(reportType === 'room-plan' || reportType === 'student-master') && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">Filter by Examination Hall:</span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
            >
              <option value="all">All Examination Halls (Combined)</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} - {r.building}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Rendered Document View (Print-Ready) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md p-8 space-y-6">
        {/* University Header with Crest */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/examatrix_university_crest_1793944234229.jpg"
              alt="Crest"
              className="w-16 h-16 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                Lovely Professional University (LPU)
              </h2>
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Division of Academic Affairs & Examinations · Autumn Term 2026
              </div>
              <div className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400 uppercase mt-0.5">
                {reportType === 'room-plan' && 'ROOM-WISE SEATING ARRANGEMENT (DOOR NOTICE)'}
                {reportType === 'student-master' && 'MASTER CANDIDATE SEATING ALLOCATION ROSTER'}
                {reportType === 'subject-summary' && 'SUBJECT-WISE ALLOCATION DISTRIBUTION SUMMARY'}
                {reportType === 'invigilator-roster' && 'FACULTY INVIGILATOR DUTY ALLOCATION CHART'}
                {reportType === 'utilization' && 'EXAMINATION HALL CAPACITY & UTILIZATION AUDIT'}
              </div>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-slate-500">
            <div>Date: {selectedAlloc.examDate}</div>
            <div>Shift: {selectedAlloc.shift}</div>
            <div className="text-[10px] text-emerald-600 font-bold">STATUS: PUBLISHED</div>
          </div>
        </div>

        {/* 1. Room Door Poster / Seating Plan */}
        {(reportType === 'room-plan' || reportType === 'student-master') && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Hall</th>
                    <th className="px-3 py-2.5">Seat No</th>
                    <th className="px-3 py-2.5">Roll Number</th>
                    <th className="px-3 py-2.5">Candidate Name</th>
                    <th className="px-3 py-2.5">Subject Code</th>
                    <th className="px-3 py-2.5">Subject Name</th>
                    <th className="px-3 py-2.5">Dept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleSeats.map((s) => (
                    <tr key={s.seatId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                        {s.roomNumber}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {s.seatLabel}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">{s.rollNumber}</td>
                      <td className="px-3 py-2 font-medium">{s.studentName}</td>
                      <td className="px-3 py-2 font-mono font-bold">{s.subjectCode}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                        {s.subjectName}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{s.departmentCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Invigilator Duty Roster */}
        {reportType === 'invigilator-roster' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Invigilator Name</th>
                  <th className="px-4 py-2.5">Assigned Hall</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Shift</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Invigilator Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {invDuties.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {d.invigilatorName}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      Hall {d.roomNumber}
                    </td>
                    <td className="px-4 py-3 font-mono">{d.examDate}</td>
                    <td className="px-4 py-3">{d.shift}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-600 text-[11px] uppercase">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-32 border-b border-slate-300 h-6" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Room Utilization Audit Report */}
        {reportType === 'utilization' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Room</th>
                  <th className="px-4 py-2.5">Building</th>
                  <th className="px-4 py-2.5">Floor</th>
                  <th className="px-4 py-2.5">Gross Capacity</th>
                  <th className="px-4 py-2.5">Usable Seats</th>
                  <th className="px-4 py-2.5">Seated Candidates</th>
                  <th className="px-4 py-2.5">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {rooms.map((r) => {
                  const allocated = selectedAlloc.seats.filter((s) => s.roomId === r.id).length;
                  const pct = r.availableSeats > 0 ? Math.round((allocated / r.availableSeats) * 100) : 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {r.roomNumber}
                      </td>
                      <td className="px-4 py-3">{r.building}</td>
                      <td className="px-4 py-3">{r.floor === 0 ? 'Ground' : `Floor ${r.floor}`}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{r.seatCapacity}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">{r.availableSeats}</td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums text-blue-600">
                        {allocated}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold tabular-nums">
                        <span className={pct >= 80 ? 'text-emerald-600' : 'text-slate-700'}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Subject-Wise Summary */}
        {reportType === 'subject-summary' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from(new Set(selectedAlloc.seats.map((s) => s.subjectCode))).map((code) => {
                const subSeats = selectedAlloc.seats.filter((s) => s.subjectCode === code);
                const firstSeat = subSeats[0];
                return (
                  <div key={code} className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {code}
                      </span>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                        {subSeats.length} Candidates
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">
                      {firstSeat?.subjectName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Distributed across {new Set(subSeats.map((s) => s.roomNumber)).size} halls
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certification Footer */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs text-slate-500">
          <div>
            <div>Controller of Examinations: Dr. Arthur Vance</div>
            <div className="text-[10px] text-slate-400 font-mono">
              System Audit Hash: {selectedAlloc.id} · v{selectedAlloc.version}
            </div>
          </div>

          <div className="text-right">
            <div className="w-48 border-b border-slate-400 h-6 mb-1 ml-auto" />
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Registrar Official Seal & Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
