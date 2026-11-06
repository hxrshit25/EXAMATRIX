import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Invigilator, InvigilatorAssignment, Room, ExamSchedule } from '../types';
import {
  UserCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';

export const InvigilatorManagementView: React.FC = () => {
  const { departments, refreshTrigger, triggerRefresh, showToast } = useApp();
  const [invigilators, setInvigilators] = useState<Invigilator[]>([]);
  const [assignments, setAssignments] = useState<InvigilatorAssignment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    invigilatorId: '',
    roomId: '',
    examDate: '2026-11-10',
    shift: 'Morning (09:30 - 12:30)',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invList, assignList, roomList, schList] = await Promise.all([
        api.getInvigilators(),
        api.getInvigilatorAssignments(),
        api.getRooms(),
        api.getExams(),
      ]);
      setInvigilators(invList);
      setAssignments(assignList);
      setRooms(roomList);
      setSchedules(schList);

      if (invList.length > 0 && !assignForm.invigilatorId) {
        setAssignForm((prev) => ({
          ...prev,
          invigilatorId: invList[0].id,
          roomId: roomList[0]?.id || '',
        }));
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invigilators.find((i) => i.id === assignForm.invigilatorId);
    const room = rooms.find((r) => r.id === assignForm.roomId);

    if (!inv || !room) {
      showToast('Select valid invigilator and room.', 'error');
      return;
    }

    try {
      await api.assignInvigilator({
        invigilatorId: inv.id,
        invigilatorName: inv.name,
        roomId: room.id,
        roomNumber: room.roomNumber,
        examDate: assignForm.examDate,
        shift: assignForm.shift as any,
        scheduleIds: schedules
          .filter((s) => s.examDate === assignForm.examDate && s.shift === assignForm.shift)
          .map((s) => s.id),
        status: 'assigned',
      });
      showToast(`Assigned ${inv.name} to Hall ${room.roomNumber}.`, 'success');
      setIsAssignModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveDuty = async (id: string, name: string) => {
    if (window.confirm(`Unassign duty for ${name}?`)) {
      try {
        await api.removeInvigilatorAssignment(id);
        showToast('Invigilator duty unassigned.', 'success');
        triggerRefresh();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Faculty Invigilator Management</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {invigilators.length} Faculty
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hall duty scheduling, double-booking conflict prevention, and proctor assignments
          </p>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Assign Hall Duty</span>
        </button>
      </div>

      {/* 2-Column Split: Active Duty Schedule & Faculty Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Duty Schedule Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Active Examination Hall Duties ({assignments.length})
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No invigilator duties assigned yet. Click 'Assign Hall Duty' above.
                </div>
              ) : (
                assignments.map((duty) => (
                  <div
                    key={duty.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {duty.invigilatorName}
                        </span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          Hall {duty.roomNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{duty.examDate}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{duty.shift}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmed</span>
                      </span>

                      <button
                        onClick={() => handleRemoveDuty(duty.id, duty.invigilatorName)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Remove Duty"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Invigilator Faculty Roster */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Faculty Pool Roster ({invigilators.length})
            </h2>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {invigilators.map((inv) => {
              const dept = departments.find((d) => d.id === inv.departmentId);
              const isAssigned = assignments.some((a) => a.invigilatorId === inv.id);

              return (
                <div
                  key={inv.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{inv.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.designation} · {dept?.code || 'Engineering'}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isAssigned
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {isAssigned ? 'ON DUTY' : 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{inv.email}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{inv.phone}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assign Duty Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assign Invigilation Hall Duty
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Faculty Member *
                </label>
                <select
                  required
                  value={assignForm.invigilatorId}
                  onChange={(e) => setAssignForm({ ...assignForm, invigilatorId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {invigilators.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.designation} - {inv.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Examination Hall / Room *
                </label>
                <select
                  required
                  value={assignForm.roomId}
                  onChange={(e) => setAssignForm({ ...assignForm, roomId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.building} ({r.availableSeats} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.examDate}
                    onChange={(e) => setAssignForm({ ...assignForm, examDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Shift
                  </label>
                  <select
                    value={assignForm.shift}
                    onChange={(e) => setAssignForm({ ...assignForm, shift: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Morning (09:30 - 12:30)">Morning</option>
                    <option value="Afternoon (14:00 - 17:00)">Afternoon</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Confirm Duty Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
