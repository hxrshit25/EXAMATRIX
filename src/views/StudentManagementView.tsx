import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Student } from '../types';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Filter,
  X,
  FileText,
  Accessibility,
} from 'lucide-react';

export const StudentManagementView: React.FC = () => {
  const { departments, subjects, refreshTrigger, triggerRefresh, showToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedEligibility, setSelectedEligibility] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    regNumber: '',
    email: '',
    departmentId: '',
    semester: 5,
    section: 'A',
    subjectCodes: [] as string[],
    isEligible: true,
    eligibilityReason: 'Eligible for all examinations',
    specialNeeds: false,
  });

  // Bulk CSV text state
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // Load students
  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents();
      setStudents(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [refreshTrigger]);

  // Set default department in form
  useEffect(() => {
    if (departments.length > 0 && !formData.departmentId) {
      setFormData((prev) => ({ ...prev, departmentId: departments[0].id }));
    }
  }, [departments]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.regNumber.toLowerCase().includes(q);

      const matchesDept = selectedDept === 'all' || s.departmentId === selectedDept;
      const matchesSem = selectedSemester === 'all' || s.semester.toString() === selectedSemester;
      const matchesElig =
        selectedEligibility === 'all' ||
        (selectedEligibility === 'eligible' && s.isEligible) ||
        (selectedEligibility === 'ineligible' && !s.isEligible);

      return matchesSearch && matchesDept && matchesSem && matchesElig;
    });
  }, [students, search, selectedDept, selectedSemester, selectedEligibility]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      rollNumber: '',
      regNumber: '',
      email: '',
      departmentId: departments[0]?.id || 'dept_cse',
      semester: 5,
      section: 'A',
      subjectCodes: ['CS501', 'CS502'],
      isEligible: true,
      eligibilityReason: 'Eligible for all examinations',
      specialNeeds: false,
    });
    setEditingStudent(null);
  };

  // Open Edit
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      regNumber: student.regNumber,
      email: student.email,
      departmentId: student.departmentId,
      semester: student.semester,
      section: student.section,
      subjectCodes: student.subjectCodes || [],
      isEligible: student.isEligible,
      eligibilityReason: student.eligibilityReason || '',
      specialNeeds: !!student.specialNeeds,
    });
    setIsAddModalOpen(true);
  };

  // Save student (Add / Edit)
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.rollNumber.trim()) {
      showToast('Name and Roll Number are required.', 'error');
      return;
    }

    try {
      const studentPayload: any = {
        name: formData.name.trim(),
        rollNumber: formData.rollNumber.trim().toUpperCase(),
        regNumber: (formData.regNumber || `REG-${formData.rollNumber}`).trim().toUpperCase(),
        email: formData.email.trim() || `${formData.rollNumber.toLowerCase()}@student.examatrix.edu`,
        departmentId: formData.departmentId,
        courseId: `crs_btech_${formData.departmentId.replace('dept_', '')}`,
        semester: Number(formData.semester),
        section: formData.section,
        subjectCodes: formData.subjectCodes,
        isEligible: formData.isEligible,
        eligibilityReason: formData.isEligible ? 'Eligible' : formData.eligibilityReason,
        specialNeeds: formData.specialNeeds,
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.id, studentPayload);
        showToast(`Student ${formData.rollNumber} updated successfully.`, 'success');
      } else {
        await api.createStudent(studentPayload);
        showToast(`Student ${formData.rollNumber} enrolled successfully.`, 'success');
      }

      setIsAddModalOpen(false);
      resetForm();
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    try {
      await api.deleteStudent(deletingStudent.id);
      showToast(`Student ${deletingStudent.rollNumber} removed.`, 'success');
      setDeletingStudent(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Sample CSV generator
  const downloadSampleCsv = () => {
    const sample = `RollNumber,RegistrationNumber,FullName,Email,DepartmentCode,Semester,Section,SubjectCodes,IsEligible,SpecialNeeds\n24BCS099,2024REGCS099,Marcus Vance,marcus.v@student.examatrix.edu,CSE,5,A,CS501;CS502,true,false\n24BEC099,2024REGEC099,Sonia Gupta,sonia.g@student.examatrix.edu,ECE,5,A,EC501,true,true\n24BME099,2024REGME099,Rajesh K,rajesh.k@student.examatrix.edu,ME,5,A,ME501,false,false`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'examatrix_students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export current list to CSV
  const exportToCsv = () => {
    const headers = 'RollNumber,RegNumber,Name,Email,Department,Semester,Section,Subjects,Eligible,SpecialNeeds\n';
    const rows = filteredStudents
      .map((s) =>
        `"${s.rollNumber}","${s.regNumber}","${s.name}","${s.email}","${s.departmentId.replace('dept_', '').toUpperCase()}","${s.semester}","${s.section}","${(s.subjectCodes || []).join(';')}","${s.isEligible ? 'YES' : 'NO'}","${s.specialNeeds ? 'YES' : 'NO'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `examatrix_students_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredStudents.length} student records to CSV.`, 'success');
  };

  // Bulk CSV process
  const handleProcessBulkCsv = async () => {
    if (!bulkCsvText.trim()) {
      showToast('Please paste CSV text or load file.', 'error');
      return;
    }

    const lines = bulkCsvText.trim().split('\n');
    if (lines.length < 2) {
      setBulkErrors(['CSV must contain a header row and at least one student data row.']);
      return;
    }

    const studentsToUpload: any[] = [];
    const parseErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());

      if (cols.length < 5) {
        parseErrors.push(`Row ${i}: Expected at least 5 columns (RollNumber, RegNumber, FullName, Email, DepartmentCode)`);
        continue;
      }

      const [roll, reg, name, email, deptCode, sem, sec, subjectsStr, eligStr, specialStr] = cols;
      const deptId = `dept_${(deptCode || 'CSE').toLowerCase()}`;
      const subjectsList = subjectsStr ? subjectsStr.split(';').map((s) => s.trim()) : ['CS501'];

      studentsToUpload.push({
        rollNumber: roll,
        regNumber: reg || `REG-${roll}`,
        name,
        email: email || `${roll.toLowerCase()}@student.examatrix.edu`,
        departmentId: deptId,
        courseId: `crs_btech_${(deptCode || 'cse').toLowerCase()}`,
        semester: sem ? parseInt(sem, 10) : 5,
        section: sec || 'A',
        subjectCodes: subjectsList,
        isEligible: eligStr ? eligStr.toLowerCase() !== 'false' : true,
        specialNeeds: specialStr ? specialStr.toLowerCase() === 'true' : false,
      });
    }

    if (parseErrors.length > 0) {
      setBulkErrors(parseErrors);
      return;
    }

    try {
      const res = await api.bulkImportStudents(studentsToUpload);
      showToast(`Imported ${res.added} students (${res.skipped} skipped).`, 'success');
      if (res.errors && res.errors.length > 0) {
        setBulkErrors(res.errors);
      } else {
        setIsBulkModalOpen(false);
        setBulkCsvText('');
        setBulkErrors([]);
        triggerRefresh();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Student Academic Directory</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {filteredStudents.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage student registrations, exam eligibility rules, and special accommodation needs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSampleCsv}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            title="Download Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV Template</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={exportToCsv}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll, reg #..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Department */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="3">Semester 3</option>
              <option value="5">Semester 5</option>
              <option value="7">Semester 7</option>
            </select>
          </div>

          {/* Eligibility */}
          <div>
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Eligibility</option>
              <option value="eligible">Eligible Only</option>
              <option value="ineligible">Debarred / Ineligible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Sem / Sec</th>
                <th className="px-4 py-3">Enrolled Subjects</th>
                <th className="px-4 py-3">Eligibility Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No students found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const dept = departments.find((d) => d.id === s.departmentId);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {s.rollNumber}
                        <div className="text-[10px] text-slate-400 font-normal">{s.regNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{s.name}</span>
                          {s.specialNeeds && (
                            <span
                              className="inline-flex items-center text-blue-600 dark:text-blue-400"
                              title="Special Needs: Mobility accommodation required (Ground Floor Preferred)"
                            >
                              <Accessibility className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{s.email}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {dept ? dept.code : s.departmentId.replace('dept_', '').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3 tabular-nums">
                        Sem {s.semester} · Sec {s.section}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(s.subjectCodes || []).map((code) => (
                            <span
                              key={code}
                              className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {s.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Eligible</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
                            title={s.eligibilityReason}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Debarred</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingStudent ? `Edit Student: ${editingStudent.rollNumber}` : 'Enroll New Student'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 24BCS045"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registration No
                  </label>
                  <input
                    type="text"
                    value={formData.regNumber}
                    onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                    placeholder="e.g. 2024REGCS045"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Student Full Name"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@student.examatrix.edu"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code}
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
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Subjects checkboxes */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Enrolled Examination Subjects
                </label>
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 max-h-32 overflow-y-auto">
                  {subjects.map((sub) => {
                    const isChecked = formData.subjectCodes.includes(sub.code);
                    return (
                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                subjectCodes: [...formData.subjectCodes, sub.code],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                subjectCodes: formData.subjectCodes.filter((c) => c !== sub.code),
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-mono font-semibold">{sub.code}</span>
                        <span className="text-[10px] text-slate-400 truncate">{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special needs checkbox */}
              <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.specialNeeds}
                    onChange={(e) => setFormData({ ...formData, specialNeeds: e.target.checked })}
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      <Accessibility className="w-3.5 h-3.5 text-blue-600" />
                      <span>Special Mobility Accommodation</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Algorithm will automatically prioritize this student for ground floor accessible exam halls.
                    </div>
                  </div>
                </label>
              </div>

              {/* Eligibility Toggle */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Exam Eligibility Status
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.isEligible}
                    onChange={(e) => setFormData({ ...formData, isEligible: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                {!formData.isEligible && (
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Debarment Reason (Statutory or Financial)
                    </label>
                    <input
                      type="text"
                      value={formData.eligibilityReason}
                      onChange={(e) => setFormData({ ...formData, eligibilityReason: e.target.value })}
                      placeholder="e.g. Attendance below 75% threshold"
                      className="w-full px-2.5 py-1 text-xs rounded border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Confirm Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove student{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {deletingStudent.rollNumber} ({deletingStudent.name})
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bulk Student Import (CSV)
                </h3>
                <p className="text-xs text-slate-500">
                  Paste CSV rows or import student batch records with automatic validation
                </p>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  CSV Data Content (Header + Rows)
                </span>
                <button
                  type="button"
                  onClick={downloadSampleCsv}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Download template CSV
                </button>
              </div>

              <textarea
                rows={8}
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="RollNumber,RegistrationNumber,FullName,Email,DepartmentCode,Semester,Section,SubjectCodes,IsEligible,SpecialNeeds&#10;24BCS101,2024REGCS101,Amina Tariq,amina.t@student.examatrix.edu,CSE,5,A,CS501;CS502,true,false"
                className="w-full p-3 font-mono text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {bulkErrors.length > 0 && (
                <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Validation Errors Detected:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {bulkErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessBulkCsv}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Process & Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
