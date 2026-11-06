import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { SystemSettings, AuditLog } from '../types';
import {
  Settings,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search in audit logs
  const [logSearch, setLogSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        api.getSettings(),
        api.getAuditLogs(),
      ]);
      setSettings(settingsRes);
      setAuditLogs(logsRes);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateSettings(settings);
      showToast('System settings updated successfully.', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (
      window.confirm(
        'WARNING: This will reset all students, rooms, exams, and allocations back to the original reference demonstration dataset. Continue?'
      )
    ) {
      try {
        await api.resetDemoData();
        showToast('Database reset to initial university seed state.', 'success');
        triggerRefresh();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!logSearch) return true;
    const q = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userEmail.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q)
    );
  });

  if (loading || !settings) {
    return <div className="p-12 text-center text-slate-400">Loading system settings...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>System Settings & Security Audit Logs</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Enterprise Governance
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure institutional policies, algorithm strictness, and review complete cryptographic audit trails
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demonstration Database</span>
        </button>
      </div>

      {/* 2-Column Split: System Config on Left, Audit Logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Institution & Algorithm Rules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Institutional Parameters
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={settings.universityName}
                  onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Current Academic Year
                </label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  Allocation Engine Rules
                </h3>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableInterleaving}
                    onChange={(e) =>
                      setSettings({ ...settings, enableInterleaving: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Multi-Subject Interleaving
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Distribute adjacent seats to students appearing for different exam papers.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.strictAdjacencyPrevention}
                    onChange={(e) =>
                      setSettings({ ...settings, strictAdjacencyPrevention: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Strict Same-Subject Prevention
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Reject seat candidates that place same-subject peers in direct side-by-side contact.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowManualOverrides}
                    onChange={(e) =>
                      setSettings({ ...settings, allowManualOverrides: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Allow Administrative Manual Overrides
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Enable coordinators to execute seat swaps even after allocation is locked.
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Automatic Lock Window (Minutes Before Exam)
                </label>
                <input
                  type="number"
                  min={30}
                  max={720}
                  value={settings.autoLockMinutesBeforeShift}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      autoLockMinutesBeforeShift: parseInt(e.target.value, 10) || 120,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (7 cols): Audit Trail Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                  Administrative Action Audit Trail
                </h2>
                <p className="text-xs text-slate-500">
                  Cryptographically trackable record of every allocation, student edit, and hall change
                </p>
              </div>

              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter logs by action, user..."
                className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5">Timestamp</th>
                    <th className="px-3 py-2.5">User</th>
                    <th className="px-3 py-2.5">Action</th>
                    <th className="px-3 py-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
