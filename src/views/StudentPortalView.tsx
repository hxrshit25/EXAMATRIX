import React, { useState } from 'react';
import { api } from '../api/client';
import { StudentLookupResult } from '../types';
import {
  Search,
  Printer,
  Calendar,
  Clock,
  Building2,
  Armchair,
  CheckCircle2,
  AlertCircle,
  FileText,
  Accessibility,
  ShieldAlert,
} from 'lucide-react';

export const StudentPortalView: React.FC = () => {
  const [query, setQuery] = useState('24BCS001');
  const [result, setResult] = useState<StudentLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.lookupStudent(query.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md space-y-4 no-print">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-800/60 border border-blue-700/60 text-blue-200 text-xs font-mono font-semibold mb-2">
            OFFICIAL STUDENT EXAMINATION PORTAL
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hall Ticket & Examination Seat Finder
          </h1>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Enter your official university Roll Number (e.g. 24BCS001) or Registration Number to
            access your verified examination hall and seat allocation.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Roll No (e.g. 24BCS001)"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/10 text-white placeholder-blue-200/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono text-sm uppercase font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Find My Seat</span>
            )}
          </button>
        </form>

        {/* Quick Demo Roll Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-blue-200 pt-2">
          <span className="text-[11px] opacity-70">Demo Quick Lookups:</span>
          {['24BCS001', '24BCS005', '24BEC001', '24BME001', '24BIT001'].map((roll) => (
            <button
              key={roll}
              type="button"
              onClick={() => {
                setQuery(roll);
                api.lookupStudent(roll).then(setResult).catch((err) => setError(err.message));
              }}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors"
            >
              {roll}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Record Not Found</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Hall Ticket Card */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Official University Examination Hall Ticket
            </h2>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Hall Ticket</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md p-6 md:p-8 space-y-6">
            {/* University Crest & Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <img
                  src="/src/assets/images/examatrix_university_crest_1793944234229.jpg"
                  alt="University Crest"
                  className="w-16 h-16 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="font-bold text-base text-slate-900 dark:text-white uppercase tracking-tight">
                    Lovely Professional University (LPU)
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Office of the Controller of Examinations · Autumn Term 2026
                  </div>
                  <div className="text-[11px] font-mono text-blue-700 dark:text-blue-400 font-semibold mt-0.5">
                    AUTHENTICATED CANDIDATE HALL TICKET
                  </div>
                </div>
              </div>

              {/* QR Mock & Barcode */}
              <div className="text-center sm:text-right shrink-0">
                <div className="w-20 h-20 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mx-auto sm:ml-auto flex flex-col items-center justify-center">
                  <div className="text-[9px] font-mono font-bold text-slate-500">EXAM-QR</div>
                  <div className="grid grid-cols-4 gap-1 p-1">
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white" />
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600" />
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white" />
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white" />
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600" />
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white" />
                    <div className="w-2 h-2 bg-slate-300 dark:bg-slate-600" />
                    <div className="w-2 h-2 bg-slate-900 dark:bg-white" />
                  </div>
                  <div className="text-[7px] font-mono text-slate-400">VERIFIED</div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  {result.student.rollNumber}
                </div>
              </div>
            </div>

            {/* Candidate Academic Profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-mono">
                  Candidate Name
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {result.student.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-mono">
                  Roll Number
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {result.student.rollNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-mono">
                  Registration No
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {result.student.regNumber}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-mono">
                  Department / Sem
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {result.student.department} · Sem {result.student.semester}
                </span>
              </div>
            </div>

            {/* Special accommodation notice */}
            {result.student.specialNeeds && (
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-blue-600" />
                <span>
                  <strong>Mobility Accommodation Active:</strong> Seating allocated on Ground Floor with direct ramp access.
                </span>
              </div>
            )}

            {/* Allocated Exam Seats Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Confirmed Examination Seating Assignments
              </h3>

              {result.allocations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  Seating allocation for your enrolled examinations has not yet been published by the Academic Registrar. Please check back 24 hours prior to the exam.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {result.allocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-900">
                            {alloc.subjectCode}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {alloc.subjectName}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{alloc.examDate}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{alloc.shift}</span>
                          </span>
                        </div>
                      </div>

                      {/* Seat Highlight Box */}
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900">
                        <div className="text-right">
                          <div className="text-[10px] font-mono uppercase text-blue-700 dark:text-blue-300 font-semibold">
                            {alloc.building}
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Room {alloc.roomNumber} ({alloc.floor})
                          </div>
                        </div>

                        <div className="h-8 w-px bg-blue-200 dark:bg-blue-800" />

                        <div className="text-center">
                          <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                            SEAT NUMBER
                          </div>
                          <div className="text-xl font-extrabold font-mono text-blue-700 dark:text-blue-300">
                            {alloc.seatLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Examination Regulations */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Mandatory Examination Hall Instructions & Code of Conduct</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                <li>Candidates must be seated in their designated hall at least 15 minutes before scheduled start time.</li>
                <li>Candidate identity will be cross-verified using physical university photo identity card and this hall ticket.</li>
                <li>Mobile phones, smartwatches, programmable calculators, and unauthorized sheets are strictly prohibited in the exam hall.</li>
                <li>Students attempting to swap allocated seats will face immediate malpractice disqualification.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
