import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { SeatingAllocation, Room, AllocatedSeat } from '../types';
import {
  Building2,
  Calendar,
  Clock,
  Layers,
  Armchair,
  Ban,
  User,
  ArrowRightLeft,
  X,
  CheckCircle2,
  Filter,
  Sparkles,
} from 'lucide-react';

export const VisualSeatingPlanView: React.FC = () => {
  const {
    refreshTrigger,
    triggerRefresh,
    showToast,
    selectedAllocationId,
  } = useApp();

  const [allocations, setAllocations] = useState<any[]>([]);
  const [currentAllocation, setCurrentAllocation] = useState<SeatingAllocation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Seat Inspection & Manual Swap Modal
  const [inspectingSeat, setInspectingSeat] = useState<AllocatedSeat | null>(null);
  const [swapTargetSeatId, setSwapTargetSeatId] = useState<string>('');
  const [isSwapping, setIsSwapping] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allocList, roomList] = await Promise.all([
        api.getAllocations(),
        api.getRooms(),
      ]);

      setAllocations(allocList);
      setRooms(roomList);

      let targetAllocId = selectedAllocationId;
      if (!targetAllocId && allocList.length > 0) {
        targetAllocId = allocList[0].id;
      }

      if (targetAllocId) {
        const fullAlloc = await api.getAllocationById(targetAllocId);
        setCurrentAllocation(fullAlloc);

        // Find which rooms are used in this allocation
        if (fullAlloc.seats.length > 0 && !selectedRoomId) {
          setSelectedRoomId(fullAlloc.seats[0].roomId);
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

  // Seats in the active room
  const roomAllocatedSeats = useMemo(() => {
    if (!currentAllocation || !activeRoom) return [];
    return currentAllocation.seats.filter((s) => s.roomId === activeRoom.id);
  }, [currentAllocation, activeRoom]);

  // Distinct subjects in this room
  const subjectsInRoom = useMemo(() => {
    const set = new Set<string>();
    roomAllocatedSeats.forEach((s) => set.add(s.subjectCode));
    return Array.from(set);
  }, [roomAllocatedSeats]);

  // Color mapper for distinct subjects (interleaving visualizer)
  const getSubjectColorClasses = (code: string) => {
    if (code === 'CS501') {
      return 'bg-blue-600 text-white border-blue-700';
    }
    if (code === 'EC501') {
      return 'bg-emerald-600 text-white border-emerald-700';
    }
    if (code === 'ME501') {
      return 'bg-amber-600 text-white border-amber-700';
    }
    if (code === 'IT501') {
      return 'bg-purple-600 text-white border-purple-700';
    }
    if (code === 'CS502') {
      return 'bg-indigo-600 text-white border-indigo-700';
    }
    if (code === 'CE501') {
      return 'bg-teal-600 text-white border-teal-700';
    }
    return 'bg-slate-700 text-white border-slate-800';
  };

  // Perform manual override seat swap
  const handlePerformSwap = async () => {
    if (!currentAllocation || !inspectingSeat || !swapTargetSeatId) return;

    try {
      setIsSwapping(true);
      await api.overrideSeat(currentAllocation.id, inspectingSeat.seatId, swapTargetSeatId);
      showToast(
        `Successfully swapped/reassigned seat for ${inspectingSeat.rollNumber}.`,
        'success'
      );
      setInspectingSeat(null);
      setSwapTargetSeatId('');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSwapping(false);
    }
  };

  if (loading || !currentAllocation || !activeRoom) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading classroom seating plan...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Visual Classroom Floorplan</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {currentAllocation.examDate} · {currentAllocation.shift}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Classroom-accurate examination grid with subject color coding and real-time seat inspection
          </p>
        </div>

        {/* Room Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {rooms.map((room) => {
            const isSelected = room.id === activeRoom.id;
            const seatedCount = currentAllocation.seats.filter((s) => s.roomId === room.id).length;

            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{room.roomNumber}</span>
                <span className="text-[10px] font-mono opacity-70">({seatedCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hall Meta & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">Building:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">{activeRoom.building}</strong>
          </div>
          <div>
            <span className="text-slate-400">Floor:</span>{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {activeRoom.floor === 0 ? 'Ground' : `Floor ${activeRoom.floor}`}
            </strong>
          </div>
          <div>
            <span className="text-slate-400">Occupancy:</span>{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
              {roomAllocatedSeats.length} / {activeRoom.availableSeats} Seats
            </strong>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Highlight Subject:</span>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
          >
            <option value="all">All Subjects (Interleaved)</option>
            {subjectsInRoom.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Classroom Layout Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
        {/* Front of Classroom Podium & Blackboard */}
        <div className="p-3 rounded-lg bg-slate-900 text-white text-center text-xs font-mono font-bold tracking-widest uppercase border border-slate-800 shadow-md flex items-center justify-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>FRONT OF EXAMINATION HALL · INVIGILATOR PODIUM & BLACKBOARD</span>
        </div>

        {/* Classroom Seats Grid */}
        <div className="overflow-x-auto p-4 bg-slate-50/60 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="inline-block min-w-full space-y-3">
            {Array.from({ length: activeRoom.totalRows }).map((_, rIdx) => {
              const rowNum = rIdx + 1;

              return (
                <div key={rowNum} className="flex items-center justify-center gap-2">
                  {/* Row Indicator */}
                  <div className="w-8 text-xs font-mono font-bold text-slate-400 text-right pr-2 shrink-0">
                    R{rowNum}
                  </div>

                  {/* Seat Columns */}
                  {Array.from({ length: activeRoom.totalColumns }).map((_, cIdx) => {
                    const colNum = cIdx + 1;
                    const seatCode = `R${rowNum}C${colNum}`;
                    const isBlocked = (activeRoom.layoutConfig.blockedSeats || []).includes(
                      seatCode
                    );
                    const isAisleAfter = (activeRoom.layoutConfig.aisles || []).includes(colNum);

                    // Find if student is allocated to this seat
                    const allocated = roomAllocatedSeats.find(
                      (s) => s.rowNumber === rowNum && s.colNumber === colNum
                    );

                    const isHighlighted =
                      subjectFilter === 'all' ||
                      (allocated && allocated.subjectCode === subjectFilter);

                    return (
                      <React.Fragment key={seatCode}>
                        <div
                          onClick={() => {
                            if (allocated) setInspectingSeat(allocated);
                          }}
                          className={`w-28 h-20 rounded-lg p-1.5 flex flex-col justify-between text-left transition-all select-none border ${
                            isBlocked
                              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-500 opacity-60 cursor-not-allowed'
                              : allocated
                              ? `cursor-pointer hover:scale-105 hover:shadow-md ${
                                  isHighlighted
                                    ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs'
                                    : 'opacity-40 bg-slate-100 dark:bg-slate-850 border-slate-200'
                                }`
                              : 'bg-slate-100/60 dark:bg-slate-850/50 border-dashed border-slate-300 dark:border-slate-750 text-slate-400'
                          }`}
                        >
                          {/* Seat Top Bar */}
                          <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                            <span className="font-bold text-slate-600 dark:text-slate-300">
                              R{rowNum}-{String(colNum).padStart(2, '0')}
                            </span>
                            {allocated && (
                              <span
                                className={`text-[9px] font-bold px-1 py-0.5 rounded ${getSubjectColorClasses(
                                  allocated.subjectCode
                                )}`}
                              >
                                {allocated.subjectCode}
                              </span>
                            )}
                            {isBlocked && (
                              <span className="text-[9px] font-bold text-rose-500">BLOCKED</span>
                            )}
                          </div>

                          {/* Seat Body */}
                          {allocated ? (
                            <div className="space-y-0.5 my-auto">
                              <div className="text-[11px] font-mono font-bold text-slate-900 dark:text-white truncate">
                                {allocated.rollNumber}
                              </div>
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate leading-tight">
                                {allocated.studentName}
                              </div>
                            </div>
                          ) : isBlocked ? (
                            <div className="flex items-center justify-center text-[10px] font-mono text-rose-400">
                              <Ban className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-[10px] font-mono text-slate-400">
                              Vacant
                            </div>
                          )}

                          {/* Seat Footer status */}
                          <div className="text-[9px] text-slate-400 flex items-center justify-between">
                            {allocated ? (
                              <span
                                className={`font-semibold capitalize ${
                                  allocated.attendanceStatus === 'present'
                                    ? 'text-emerald-600'
                                    : allocated.attendanceStatus === 'absent'
                                    ? 'text-rose-500'
                                    : 'text-slate-400'
                                }`}
                              >
                                {allocated.attendanceStatus === 'not_marked'
                                  ? 'Active'
                                  : allocated.attendanceStatus}
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                            <span className="text-[8px] opacity-70">
                              {allocated ? allocated.departmentCode : ''}
                            </span>
                          </div>
                        </div>

                        {/* Walking Aisle Spacer */}
                        {isAisleAfter && (
                          <div
                            className="w-5 h-20 flex items-center justify-center text-amber-500/60 text-[10px] font-mono shrink-0 border-x border-dashed border-amber-300 dark:border-amber-900/60"
                            title="Walking Aisle Gap"
                          >
                            <span className="rotate-90 text-[9px] font-bold tracking-widest opacity-60">
                              AISLE
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-medium">Subject Interleaving Color Codes:</span>
            {subjectsInRoom.map((code) => (
              <div key={code} className="flex items-center gap-1.5 font-mono">
                <div
                  className={`w-3.5 h-3.5 rounded ${getSubjectColorClasses(code)}`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{code}</span>
              </div>
            ))}
          </div>

          <div className="text-slate-400 text-[11px]">
            Click any occupied seat to inspect candidate details or perform administrative seat swap
          </div>
        </div>
      </div>

      {/* Seat Inspection & Manual Swap Modal */}
      {inspectingSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Armchair className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Seat Inspection: {inspectingSeat.roomNumber} · {inspectingSeat.seatLabel}
                </h3>
              </div>
              <button
                onClick={() => setInspectingSeat(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Card */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {inspectingSeat.studentName}
                  </div>
                  <div className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    Roll: {inspectingSeat.rollNumber}
                  </div>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-bold">
                  {inspectingSeat.subjectCode}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                <div>
                  <span>Reg No:</span>{' '}
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    {inspectingSeat.regNumber}
                  </strong>
                </div>
                <div>
                  <span>Dept:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {inspectingSeat.departmentCode}
                  </strong>
                </div>
                <div>
                  <span>Attendance:</span>{' '}
                  <strong className="capitalize text-emerald-600">
                    {inspectingSeat.attendanceStatus}
                  </strong>
                </div>
                <div>
                  <span>Position:</span>{' '}
                  <strong className="font-mono text-slate-800 dark:text-slate-200">
                    Row {inspectingSeat.rowNumber}, Col {inspectingSeat.colNumber}
                  </strong>
                </div>
              </div>

              {inspectingSeat.remarks && (
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-[11px]">
                  <strong>Special Note:</strong> {inspectingSeat.remarks}
                </div>
              )}
            </div>

            {/* Manual Override Action: Swap / Reassign */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>Manual Administrative Swap / Reassign</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Select another allocated student in this room to swap seats with, or move candidate to a vacant position.
              </p>

              <select
                value={swapTargetSeatId}
                onChange={(e) => setSwapTargetSeatId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              >
                <option value="">-- Choose target seat to swap with --</option>
                {roomAllocatedSeats
                  .filter((s) => s.seatId !== inspectingSeat.seatId)
                  .map((target) => (
                    <option key={target.seatId} value={target.seatId}>
                      Seat {target.seatLabel} ({target.rollNumber} - {target.studentName} [
                      {target.subjectCode}])
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingSeat(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!swapTargetSeatId || isSwapping}
                onClick={handlePerformSwap}
                className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
              >
                {isSwapping ? 'Swapping...' : 'Execute Seat Swap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
