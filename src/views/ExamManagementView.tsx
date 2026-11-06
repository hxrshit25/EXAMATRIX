import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { ExamSchedule, ExamShift } from '../types';
import {
  CalendarDays,
  Plus,
  Clock,
  AlertTriangle,
  Building,
  Users,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const ExamManagementView: React.FC = () => {
  const { departments, subjects, refreshTrigger, triggerRefresh, showToast, setActiveTab } = useApp();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [conflicts, setConflicts] = useState<Array<{ schedule1: string; schedule2: string; reason: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);

  const [formData, setFormData] = useState({
    examName: '',
    departmentId: '',
    semester: 5,
    subjectId: '',
    examDate: '2026-11-10',
    startTime: '09:30',
    endTime: '12:30',
    shift: 'Morning (09:30 - 12:30)' as ExamShift,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [schData, confData] = await Promise.all([
        api.getExams(),
        api.getExamConflicts(),
      ]);
      setSchedules(schData);
      setConflicts(confData);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (departments.length > 0 && !formData.departmentId) {
      setFormData((prev) => ({
        ...prev,
        departmentId: departments[0].id,
      }));
    }
    if (subjects.length > 0 && !formData.subjectId) {
      setFormData((prev) => ({
        ...prev,
        subjectId: subjects[0].id,
      }));
    }
  }, [departments, subjects]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchShift = selectedShift === 'all' || s.shift.includes(selectedShift);
      const matchDept = selectedDept === 'all' || s.departmentId === selectedDept;
      return matchShift && matchDept;
    });
  }, [schedules, selectedShift, selectedDept]);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      examName: 'Final Semester Examination',
      departmentId: departments[0]?.id || 'dept_cse',
      semester: 5,
      subjectId: subjects[0]?.id || 'sub_cs501',
      examDate: '2026-11-15',
      startTime: '09:30',
      endTime: '12:30',
      shift: 'Morning (09:30 - 12:30)',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: ExamSchedule) => {
    setEditingSchedule(sch);
    setFormData({
      examName: sch.examName,
      departmentId: sch.departmentId,
      semester: sch.semester,
      subjectId: sch.subjectId,
      examDate: sch.examDate,
      startTime: sch.startTime,
      endTime: sch.endTime,
      shift: sch.shift,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selSubject = subjects.find((s) => s.id === formData.subjectId);
    if (!selSubject) {
      showToast('Please select a valid subject.', 'error');
      return;
    }

    const payload: any = {
      sessionId: 'sess_autumn2026',
      examName: formData.examName,
      departmentId: formData.departmentId,
      semester: Number(formData.semester),
      subjectId: selSubject.id,
      subjectCode: selSubject.code,
      subjectName: selSubject.name,
      examDate: formData.examDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      shift: formData.shift,
    };

    try {
      if (editingSchedule) {
        await api.updateExam(editingSchedule.id, payload);
        showToast(`Schedule for ${selSubject.code} updated.`, 'success');
      } else {
        await api.createExam(payload);
        showToast(`Exam ${selSubject.code} scheduled successfully.`, 'success');
      }
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Delete examination schedule for ${code}?`)) {
      try {
        await api.deleteExam(id);
        showToast(`Schedule ${code} deleted.`, 'success');
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
            <span>Examination Schedules</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {filteredSchedules.length} Sessions
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plan examination dates, morning and afternoon shifts, and evaluate timetable conflicts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Examination Schedule</span>
        </button>
      </div>

      {/* Overlap & Conflict Alert Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Timetable Scheduling Conflicts Detected ({conflicts.length})</span>
          </div>
          <div className="text-xs space-y-1">
            {conflicts.map((c, i) => (
              <div key={i} className="pl-6 text-[11px] list-item">
                <span className="font-semibold">{c.reason}:</span> {c.schedule1} vs {c.schedule2}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Shift Filter</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Shifts (Morning & Afternoon)</option>
              <option value="Morning">Morning Shift (09:30 - 12:30)</option>
              <option value="Afternoon">Afternoon Shift (14:00 - 17:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.map((sch) => {
          const dept = departments.find((d) => d.id === sch.departmentId);
          const isMorning = sch.shift.includes('Morning');

          return (
            <div
              key={sch.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {sch.subjectCode}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      isMorning
                        ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {isMorning ? 'MORNING SHIFT' : 'AFTERNOON SHIFT'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">
                  {sch.subjectName}
                </h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {sch.examName} · {dept?.code || 'CSE'} Sem {sch.semester}
                </div>

                <div className="space-y-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Exam Date</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {sch.examDate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timings</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {sch.startTime} - {sch.endTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>Eligible Candidates</span>
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {sch.eligibleStudentCount} students
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2">
                <button
                  onClick={() => setActiveTab('allocation')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seating Allocation</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sch)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Edit Schedule"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(sch.id, sch.subjectCode)}
                    className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingSchedule ? 'Modify Examination Schedule' : 'Create Examination Schedule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Examination Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.examName}
                  onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                  placeholder="e.g. End Semester Autumn 2026 Regular"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Examination Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Shift *
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => {
                      const sh = e.target.value as ExamShift;
                      setFormData({
                        ...formData,
                        shift: sh,
                        startTime: sh.includes('Morning') ? '09:30' : '14:00',
                        endTime: sh.includes('Morning') ? '12:30' : '17:00',
                      });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Morning (09:30 - 12:30)">Morning (09:30 - 12:30)</option>
                    <option value="Afternoon (14:00 - 17:00)">Afternoon (14:00 - 17:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {editingSchedule ? 'Save Changes' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
