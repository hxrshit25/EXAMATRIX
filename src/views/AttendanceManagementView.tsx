import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { SeatingAllocation, Room, AllocatedSeat } from '../types';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  Search,
} from 'lucide-react';

export const AttendanceManagementView: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast, selectedAllocationId } = useApp();
  const [allocations, setAllocations] = useState<any[]>([]);
  const [currentAllocation, setCurrentAllocation] = useState<SeatingAllocation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Malpractice note editor
  const [editingMalpracticeSeatId, setEditingMalpracticeSeatId] = useState<string | null>(null);
  const [malpracticeNote, setMalpracticeNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocList, roomList] = await Promise.all([
        api.getAllocations(),
        api.getRooms(),
      ]);
      setAllocations(allocList);
      setRooms(roomList);

      let targetId = selectedAllocationId || allocList[0]?.id;
      if (targetId) {
        const full = await api.getAllocationById(targetId);
        setCurrentAllocation(full);
        if (full.seats.length > 0 && !selectedRoomId) {
          setSelectedRoomId(full.seats[0].roomId);
        }
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger, selectedAllocationId]);

  const activeRoom = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  // Filtered seats in this room
  const roomSeats = useMemo(() => {
    if (!currentAllocation || !activeRoom) return [];
    return currentAllocation.seats
      .filter((s) => s.roomId === activeRoom.id)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.rollNumber.toLowerCase().includes(q) ||
          s.studentName.toLowerCase().includes(q) ||
          s.seatLabel.toLowerCase().includes(q) ||
          s.subjectCode.toLowerCase().includes(q)
        );
      });
  }, [currentAllocation, activeRoom, search]);

  // Attendance Metrics for this room
  const metrics = useMemo(() => {
    let present = 0;
    let absent = 0;
    let malpractice = 0;
    let notMarked = 0;

    roomSeats.forEach((s) => {
      if (s.attendanceStatus === 'present') present++;
      else if (s.attendanceStatus === 'absent') absent++;
      else if (s.attendanceStatus === 'malpractice') malpractice++;
      else notMarked++;
    });

    return { present, absent, malpractice, notMarked, total: roomSeats.length };
  }, [roomSeats]);

  const handleUpdateStatus = async (
    seat: AllocatedSeat,
    status: AllocatedSeat['attendanceStatus'],
    remarks?: string
  ) => {
    if (!currentAllocation) return;
    try {
      await api.updateAttendance(currentAllocation.id, seat.seatId, status, remarks);
      // Update local state directly for speed
      seat.attendanceStatus = status;
      if (remarks !== undefined) seat.remarks = remarks;
      showToast(`Updated attendance for ${seat.rollNumber} to ${status.toUpperCase()}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkAllRemainingPresent = async () => {
    if (!currentAllocation) return;
    try {
      const unmarked = roomSeats.filter((s) => s.attendanceStatus === 'not_marked');
      for (const s of unmarked) {
        await api.updateAttendance(currentAllocation.id, s.seatId, 'present');
      }
      showToast(`Marked ${unmarked.length} candidates as Present.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading || !currentAllocation || !activeRoom) {
    return <div className="p-12 text-center text-slate-400">Loading attendance register...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Examination Hall Attendance Register</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Room {activeRoom.roomNumber}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time candidate verification, absence tracking, and invigilator signature certification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Attendance Sheet</span>
          </button>
          <button
            onClick={handleMarkAllRemainingPresent}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Remaining Present</span>
          </button>
        </div>
      </div>

      {/* Room Switcher & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Room Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Hall:</span>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roomNumber} - {r.building}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by roll, name, seat..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Live Attendance Counters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <div className="text-slate-500 text-[10px]">Total Candidates</div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {metrics.total}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
            <div className="text-emerald-700 dark:text-emerald-300 text-[10px]">Present</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.present}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40">
            <div className="text-rose-700 dark:text-rose-300 text-[10px]">Absent</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
              {metrics.absent}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
            <div className="text-amber-700 dark:text-amber-300 text-[10px]">Malpractice / Report</div>
            <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.malpractice}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <div className="text-blue-700 dark:text-blue-300 text-[10px]">Pending Verification</div>
            <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              {metrics.notMarked}
            </div>
          </div>
        </div>
      </div>

      {/* Official Attendance Sheet (Printable format) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 text-center space-y-1">
          <div className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
            Lovely Professional University (LPU) · Examination Division
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Official Room Attendance & Verification Register
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>
              Hall: <strong className="text-slate-900 dark:text-white">{activeRoom.roomNumber}</strong> ({activeRoom.building})
            </span>
            <span>·</span>
            <span>
              Date: <strong className="text-slate-900 dark:text-white">{currentAllocation.examDate}</strong>
            </span>
            <span>·</span>
            <span>
              Shift: <strong className="text-slate-900 dark:text-white">{currentAllocation.shift}</strong>
            </span>
          </div>
        </div>

        {/* Attendance Register Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2.5">Seat</th>
                <th className="px-3 py-2.5">Roll Number</th>
                <th className="px-3 py-2.5">Student Name</th>
                <th className="px-3 py-2.5">Subject</th>
                <th className="px-3 py-2.5">Dept</th>
                <th className="px-3 py-2.5">Attendance Status</th>
                <th className="px-3 py-2.5">Candidate Signature</th>
                <th className="px-3 py-2.5 text-right no-print">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roomSeats.map((seat) => (
                <tr
                  key={seat.seatId}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    seat.attendanceStatus === 'malpractice'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20'
                      : seat.attendanceStatus === 'absent'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {seat.seatLabel}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {seat.rollNumber}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {seat.studentName}
                    </div>
                    {seat.remarks && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                        Note: {seat.remarks}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {seat.subjectCode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{seat.departmentCode}</td>

                  {/* Attendance Status Badge */}
                  <td className="px-3 py-2.5">
                    {seat.attendanceStatus === 'present' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PRESENT</span>
                      </span>
                    ) : seat.attendanceStatus === 'absent' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ABSENT</span>
                      </span>
                    ) : seat.attendanceStatus === 'malpractice' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-600 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>REPORTED</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">UNVERIFIED</span>
                    )}
                  </td>

                  {/* Student Signature Line */}
                  <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">
                    <div className="w-24 border-b border-slate-300 dark:border-slate-700 h-5" />
                  </td>

                  {/* Quick Action Buttons (Hidden on Print) */}
                  <td className="px-3 py-2.5 text-right no-print">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStatus(seat, 'present')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          seat.attendanceStatus === 'present'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        P
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(seat, 'absent')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          seat.attendanceStatus === 'absent'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        A
                      </button>

                      <button
                        onClick={() => {
                          const note = window.prompt(
                            `Record Malpractice / Irregularity for ${seat.rollNumber}:`,
                            seat.remarks || 'Unauthorized material confiscated'
                          );
                          if (note !== null) {
                            handleUpdateStatus(seat, 'malpractice', note);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          seat.attendanceStatus === 'malpractice'
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                        title="Report Incident / Malpractice"
                      >
                        R
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invigilator Certification & Signature Section */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          <div className="space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Invigilator Certification:
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              I certify that all seated candidates have presented valid university hall tickets with
              matching identity, and the attendance markings recorded above accurately reflect the
              candidate attendance in Hall {activeRoom.roomNumber}.
            </p>
          </div>

          <div className="space-y-4 text-right">
            <div className="inline-block text-left space-y-1">
              <div className="w-48 border-b-2 border-slate-400 dark:border-slate-600 h-8" />
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Authorized Invigilator Signature
              </div>
              <div className="text-[10px] text-slate-400">Date & Hall Seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
