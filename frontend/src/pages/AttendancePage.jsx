import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Save, RefreshCw,
  CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';
import { format, parseISO, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { attendanceApi } from '../api/attendance';
import AttendanceStats from '../components/AttendanceStats';
import Avatar from '../components/Avatar';

const STATUS_CONFIG = {
  presente: { label: 'Presente', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle, iconColor: 'text-green-500', short: 'P' },
  ausente: { label: 'Ausente', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle, iconColor: 'text-red-500', short: 'A' },
  tardanza: { label: 'Tardanza', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock, iconColor: 'text-yellow-500', short: 'T' }
};

const AttendancePage = ({ courseId, course }) => {
  const [date, setDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState(null);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [justificationStudent, setJustificationStudent] = useState(null);

  const dateStr = format(date, 'yyyy-MM-dd');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setSaved(false);
    try {
      const data = await attendanceApi.get({ courseId, date: dateStr });
      const { records: recs, students: studs, stats: statsData } = data.data;
      setStudents(studs || []);
      setRecords(recs || []);
      setStats(statsData);
      setAttendanceData(data.data.attendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, dateStr]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const handleStatusChange = (studentId, status) => {
    setRecords(prev => {
      const existing = prev.find(r => r.studentId?.toString() === studentId?.toString());
      if (existing) {
        return prev.map(r =>
          r.studentId?.toString() === studentId?.toString()
            ? { ...r, status }
            : r
        );
      }
      return [...prev, { studentId, status, justification: '' }];
    });
    setSaved(false);
    // Recompute stats optimistically
    setStats(prevStats => {
      if (!prevStats) return prevStats;
      // Simple recompute based on current records after change
      return prevStats;
    });
  };

  const handleJustification = (studentId, justification) => {
    setRecords(prev =>
      prev.map(r =>
        r.studentId?.toString() === studentId?.toString()
          ? { ...r, justification }
          : r
      )
    );
    setJustificationStudent(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        courseId,
        date: dateStr,
        records: records.map(r => ({
          studentId: r.studentId,
          status: r.status,
          justification: r.justification || ''
        }))
      };
      const data = await attendanceApi.save(payload);
      setStats(data.data.stats);
      setSaved(true);
      setAttendanceData(data.data.attendance);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRecord = (studentId) =>
    records.find(r => r.studentId?.toString() === studentId?.toString()) ||
    { studentId, status: 'presente', justification: '' };

  const markAll = (status) => {
    setRecords(students.map(s => ({
      studentId: s._id,
      status,
      justification: ''
    })));
    setSaved(false);
  };

  const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div>
      {/* Date navigation */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <button
              className="p-2 hover:bg-white rounded-lg transition-colors"
              onClick={() => setDate(d => subDays(d, 1))}
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-800 capitalize min-w-[200px] text-center">
                {formattedDate}
              </span>
            </div>
            <button
              className="p-2 hover:bg-white rounded-lg transition-colors"
              onClick={() => setDate(d => addDays(d, 1))}
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          <input
            type="date"
            className="input w-auto text-sm"
            value={dateStr}
            onChange={e => setDate(new Date(e.target.value + 'T12:00:00'))}
          />

          {isToday(date) && (
            <span className="badge bg-blue-100 text-blue-700">Hoy</span>
          )}

          {/* Mark all buttons */}
          <div className="flex gap-2 ml-auto">
            <button className="btn btn-sm bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" onClick={() => markAll('presente')}>
              <CheckCircle size={13} /> Todos presentes
            </button>
            <button className="btn btn-sm bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" onClick={() => markAll('ausente')}>
              <XCircle size={13} /> Todos ausentes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Attendance list */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">
                Lista de Asistencia
              </h3>
              <div className="flex items-center gap-2">
                {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Guardado</span>}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <><RefreshCw size={13} className="animate-spin" /> Guardando...</>
                  ) : (
                    <><Save size={13} /> Guardar</>
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No hay estudiantes en este curso</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map((student, idx) => {
                  const record = getRecord(student._id);
                  const statusConf = STATUS_CONFIG[record.status] || STATUS_CONFIG.presente;
                  const StatusIcon = statusConf.icon;

                  return (
                    <div key={student._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      {/* Number */}
                      <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">
                        {student.seatNumber || idx + 1}
                      </span>

                      {/* Avatar */}
                      <Avatar
                        firstName={student.firstName}
                        lastName={student.lastName}
                        photo={student.photo}
                        size="sm"
                      />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800">
                          {student.lastName}, {student.firstName}
                        </div>
                        {record.justification && (
                          <div className="text-xs text-gray-400 truncate">
                            Justif: {record.justification}
                          </div>
                        )}
                      </div>

                      {/* Gender badge */}
                      <span className={`badge text-xs hidden sm:inline-flex ${student.gender === 'M' ? 'bg-blue-50 text-blue-500' : 'bg-pink-50 text-pink-500'}`}>
                        {student.gender === 'M' ? 'N' : 'Ñ'}
                      </span>

                      {/* Status buttons */}
                      <div className="flex gap-1">
                        {Object.entries(STATUS_CONFIG).map(([status, conf]) => {
                          const Icon = conf.icon;
                          const isActive = record.status === status;
                          return (
                            <button
                              key={status}
                              className={`
                                flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all
                                ${isActive ? conf.color : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}
                              `}
                              onClick={() => handleStatusChange(student._id, status)}
                              title={conf.label}
                            >
                              <Icon size={12} />
                              <span className="hidden sm:inline">{conf.label}</span>
                              <span className="sm:hidden">{conf.short}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Justification button */}
                      <button
                        className={`p-1.5 rounded transition-colors ${
                          record.justification
                            ? 'text-blue-500 bg-blue-50'
                            : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                        }`}
                        onClick={() => setJustificationStudent(student)}
                        title="Añadir justificación"
                      >
                        <FileText size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-1">
          <AttendanceStats stats={stats} />
        </div>
      </div>

      {/* Justification modal */}
      {justificationStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Justificación</h3>
            <p className="text-sm text-gray-500 mb-3">
              {justificationStudent.firstName} {justificationStudent.lastName}
            </p>
            <JustificationForm
              initial={getRecord(justificationStudent._id).justification}
              onSave={(text) => handleJustification(justificationStudent._id, text)}
              onClose={() => setJustificationStudent(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const JustificationForm = ({ initial, onSave, onClose }) => {
  const [text, setText] = useState(initial || '');
  return (
    <div className="space-y-3">
      <textarea
        className="input resize-none"
        rows={3}
        placeholder="Motivo de ausencia o tardanza..."
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave(text)}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};

export default AttendancePage;
