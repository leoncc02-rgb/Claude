import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Clock, FileText, Download, Table } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AttendanceStatus, GradeLevel } from '../types';
import { GRADE_LEVELS, ATTENDANCE_LABELS, ATTENDANCE_COLORS } from '../utils/storage';
import { exportAttendancePDF, exportAttendanceExcel } from '../utils/export';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  present: <Check className="w-4 h-4" />,
  absent: <X className="w-4 h-4" />,
  late: <Clock className="w-4 h-4" />,
  excused: <FileText className="w-4 h-4" />,
};

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

const Attendance: React.FC = () => {
  const { data, setAttendance, activeTeacherId } = useApp();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'Todos'>('Todos');
  const [filterGroup, setFilterGroup] = useState('');

  // When active teacher changes, auto-select their first group
  useEffect(() => {
    if (activeTeacherId) {
      const firstGroup = data.groups.find(g => g.teacherId === activeTeacherId);
      if (firstGroup) {
        setFilterGrade(firstGroup.gradeLevel);
        setFilterGroup(firstGroup.id);
      }
    } else {
      setFilterGroup('');
    }
  }, [activeTeacherId]);

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const [showExport, setShowExport] = useState(false);

  const teacherGroupIds = activeTeacherId
    ? data.groups.filter(g => g.teacherId === activeTeacherId).map(g => g.id)
    : null;

  const studentsToShow = data.students
    .filter(s => {
      if (filterGroup) return s.groupId === filterGroup;
      if (teacherGroupIds) return s.groupId !== undefined && teacherGroupIds.includes(s.groupId);
      return filterGrade === 'Todos' || s.gradeLevel === filterGrade;
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const availableGroups = data.groups.filter(
    g => filterGrade === 'Todos' || g.gradeLevel === filterGrade
  );

  const getStatus = (studentId: string): AttendanceStatus | undefined =>
    data.attendance.find(a => a.studentId === studentId && a.date === selectedDate)?.status;

  const markAll = (status: AttendanceStatus) => {
    studentsToShow.forEach(s => setAttendance({ studentId: s.id, date: selectedDate, status }));
  };

  const summary = {
    present: studentsToShow.filter(s => getStatus(s.id) === 'present').length,
    absent: studentsToShow.filter(s => getStatus(s.id) === 'absent').length,
    late: studentsToShow.filter(s => getStatus(s.id) === 'late').length,
    excused: studentsToShow.filter(s => getStatus(s.id) === 'excused').length,
    unmarked: studentsToShow.filter(s => !getStatus(s.id)).length,
  };

  const byGrade = GRADE_LEVELS.map(level => ({
    level,
    students: studentsToShow.filter(s => s.gradeLevel === level),
  })).filter(g => g.students.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencia</h1>
          <p className="text-sm text-gray-500">Registro diario de asistencia</p>
        </div>
        <div className="relative">
          <button onClick={() => setShowExport(v => !v)} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-44 py-1">
                <button
                  onClick={() => {
                    const label = filterGrade !== 'Todos' ? filterGrade : 'Todos los grados';
                    exportAttendancePDF(studentsToShow, data.attendance, selectedDate, label);
                    setShowExport(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-red-500" /> Exportar PDF
                </button>
                <button
                  onClick={async () => {
                    const label = filterGrade !== 'Todos' ? filterGrade : 'Todos los grados';
                    await exportAttendanceExcel(studentsToShow, data.attendance, selectedDate, label);
                    setShowExport(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Table className="w-4 h-4 text-green-600" /> Exportar Excel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDate(format(subDays(dateObj, 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="input-field w-auto text-center font-medium"
              />
              <p className="text-sm text-gray-500 mt-1">
                {format(dateObj, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <button
              onClick={() => setSelectedDate(format(addDays(dateObj, 1), 'yyyy-MM-dd'))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterGrade}
              onChange={e => { setFilterGrade(e.target.value as GradeLevel | 'Todos'); setFilterGroup(''); }}
              className="input-field w-auto"
            >
              <option value="Todos">Todos los grados</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {availableGroups.length > 0 && (
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="input-field w-auto"
              >
                <option value="">Todos los grupos</option>
                {availableGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.gradeLevel}{g.label}</option>
                ))}
              </select>
            )}
            <button onClick={() => markAll('present')} className="btn-primary text-sm py-1.5">
              Marcar todos presentes
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          {[
            { key: 'present', label: 'Presentes', color: 'bg-green-100 text-green-800' },
            { key: 'absent', label: 'Ausentes', color: 'bg-red-100 text-red-800' },
            { key: 'late', label: 'Tarde', color: 'bg-yellow-100 text-yellow-800' },
            { key: 'excused', label: 'Excusados', color: 'bg-blue-100 text-blue-800' },
            { key: 'unmarked', label: 'Sin marcar', color: 'bg-gray-100 text-gray-600' },
          ].map(({ key, label, color }) => (
            <span key={key} className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
              {label}: {summary[key as keyof typeof summary]}
            </span>
          ))}
        </div>
      </div>

      {studentsToShow.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-400">No hay estudiantes para mostrar.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {byGrade.map(({ level, students }) => (
            <div key={level}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{level}</h2>
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Estudiante</th>
                      <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Estado actual</th>
                      <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Marcar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map(s => {
                      const status = getStatus(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 text-xs font-semibold">
                                  {s.firstName[0]}{s.lastName[0]}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {s.lastName}, {s.firstName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {status ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${ATTENDANCE_COLORS[status]}`}>
                                {STATUS_ICONS[status]}
                                {ATTENDANCE_LABELS[status]}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">Sin marcar</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1">
                              {STATUS_CYCLE.map(st => (
                                <button
                                  key={st}
                                  onClick={() => setAttendance({ studentId: s.id, date: selectedDate, status: st })}
                                  title={ATTENDANCE_LABELS[st]}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    status === st
                                      ? st === 'present' ? 'bg-green-500 text-white'
                                        : st === 'absent' ? 'bg-red-500 text-white'
                                        : st === 'late' ? 'bg-yellow-500 text-white'
                                        : 'bg-blue-500 text-white'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {STATUS_ICONS[st]}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attendance;
