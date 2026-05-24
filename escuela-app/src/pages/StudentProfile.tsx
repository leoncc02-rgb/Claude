import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, User, Download, Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ObservationCategory, QualitativeGrade } from '../types';
import { ATTENDANCE_LABELS, quantitativeToQualitative } from '../utils/storage';
import { exportBoletin } from '../utils/export';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, subMonths, addMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

const QUAL_COLORS: Record<QualitativeGrade, string> = {
  Superior: 'badge-superior',
  Alto: 'badge-alto',
  Básico: 'badge-basico',
  Bajo: 'badge-bajo',
};

const CAT_COLORS: Record<ObservationCategory, string> = {
  académica: 'bg-blue-100 text-blue-800',
  conductual: 'bg-orange-100 text-orange-800',
  socioemocional: 'bg-purple-100 text-purple-800',
  logro: 'bg-green-100 text-green-800',
  general: 'bg-gray-100 text-gray-800',
};
const CAT_LABELS: Record<ObservationCategory, string> = {
  académica: 'Académica', conductual: 'Conductual',
  socioemocional: 'Socioemocional', logro: 'Logro', general: 'General',
};

const ATTENDANCE_DOT: Record<string, string> = {
  present: 'bg-green-400',
  absent: 'bg-red-400',
  late: 'bg-yellow-400',
  excused: 'bg-blue-400',
};

const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, addObservation, addGrade } = useApp();
  const [calMonth, setCalMonth] = useState(new Date());
  const [showObsModal, setShowObsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [obsForm, setObsForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'general' as ObservationCategory,
    text: '',
    createdBy: '',
  });
  const [gradeForm, setGradeForm] = useState({
    subjectId: '',
    period: 1 as 1 | 2 | 3 | 4,
    year: new Date().getFullYear(),
    type: 'quantitative' as 'quantitative' | 'qualitative',
    quantitativeValue: '',
    qualitativeValue: 'Superior' as QualitativeGrade,
    description: '',
  });

  const student = data.students.find(s => s.id === id);
  if (!student) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Estudiante no encontrado.</p>
        <button onClick={() => navigate('/estudiantes')} className="mt-4 btn-secondary">
          Volver a Estudiantes
        </button>
      </div>
    );
  }

  const group = data.groups.find(g => g.id === student.groupId);
  const teacher = group ? data.teachers.find(t => t.id === group.teacherId) : undefined;
  const subjects = data.subjects.filter(s => s.gradeLevel === student.gradeLevel);

  // Attendance stats
  const attRecords = data.attendance.filter(a => a.studentId === id);
  const attTotal = attRecords.length;
  const attPresent = attRecords.filter(a => a.status === 'present').length;
  const attAbsent = attRecords.filter(a => a.status === 'absent').length;
  const attRate = attTotal ? Math.round((attPresent / attTotal) * 100) : null;

  // Calendar for current month
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (getDay(monthStart) + 6) % 7; // Mon=0

  const getAttStatus = (date: Date) =>
    attRecords.find(a => a.date === format(date, 'yyyy-MM-dd'))?.status;

  // Grades by period
  const grades = data.grades.filter(g => g.studentId === id);
  const periods = [1, 2, 3, 4] as const;
  const currentYear = new Date().getFullYear();

  const avgByPeriod = periods.map(p => {
    const pg = grades.filter(g => g.period === p && g.year === currentYear && g.type === 'quantitative' && g.quantitativeValue !== undefined);
    return pg.length ? (pg.reduce((s, g) => s + (g.quantitativeValue ?? 0), 0) / pg.length) : null;
  });

  const overallAvg = (() => {
    const vals = avgByPeriod.filter((v): v is number => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  // Observations
  const observations = data.observations
    .filter(o => o.studentId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleExportBoletin = () => {
    exportBoletin(student, grades, subjects, attRecords, observations, teacher, group);
  };

  const handleObsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addObservation({ ...obsForm, studentId: id! });
    setShowObsModal(false);
    setObsForm({ date: format(new Date(), 'yyyy-MM-dd'), category: 'general', text: '', createdBy: '' });
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGrade({
      studentId: id!,
      subjectId: gradeForm.subjectId,
      period: gradeForm.period,
      year: gradeForm.year,
      type: gradeForm.type,
      quantitativeValue: gradeForm.type === 'quantitative' ? parseFloat(gradeForm.quantitativeValue) : undefined,
      qualitativeValue: gradeForm.type === 'qualitative' ? gradeForm.qualitativeValue : undefined,
      description: gradeForm.description,
      date: new Date().toISOString().split('T')[0],
    });
    setShowGradeModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 text-xl font-bold">
                {student.firstName[0]}{student.lastName[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-sm text-gray-500">{student.gradeLevel}</span>
                {group && (
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    Grupo {group.gradeLevel}{group.label}
                  </span>
                )}
                {teacher && (
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {teacher.name}
                  </span>
                )}
                {overallAvg !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUAL_COLORS[quantitativeToQualitative(overallAvg)]}`}>
                    Promedio: {overallAvg.toFixed(1)} — {quantitativeToQualitative(overallAvg)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowObsModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Observación
          </button>
          <button onClick={() => setShowGradeModal(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Nota
          </button>
          <button onClick={handleExportBoletin} className="btn-primary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Boletín PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Info card */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-3">Información</h2>
            <div className="space-y-2">
              {student.birthDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  Nacimiento: {format(new Date(student.birthDate + 'T12:00'), "d 'de' MMMM, yyyy", { locale: es })}
                </div>
              )}
              {student.parentName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {student.parentName}
                </div>
              )}
              {student.parentPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {student.parentPhone}
                </div>
              )}
              {student.parentEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {student.parentEmail}
                </div>
              )}
            </div>
          </div>

          {/* Attendance summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Asistencia</h2>
              <Link to="/asistencia" className="text-xs text-blue-600 hover:underline">Ver registros</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Tasa', value: attRate !== null ? `${attRate}%` : 'N/A', color: attRate !== null && attRate >= 90 ? 'text-green-600' : attRate !== null && attRate >= 75 ? 'text-yellow-600' : 'text-red-600' },
                { label: 'Presencias', value: attPresent, color: 'text-green-600' },
                { label: 'Ausencias', value: attAbsent, color: 'text-red-600' },
                { label: 'Total días', value: attTotal, color: 'text-gray-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Mini attendance calendar */}
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="text-gray-400 hover:text-gray-600 text-xs px-1">◀</button>
              <p className="text-xs font-medium text-gray-600">
                {format(calMonth, 'MMMM yyyy', { locale: es })}
              </p>
              <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="text-gray-400 hover:text-gray-600 text-xs px-1">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 py-0.5">{d}</div>
              ))}
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const status = getAttStatus(day);
                return (
                  <div
                    key={day.toISOString()}
                    title={status ? ATTENDANCE_LABELS[status] : 'Sin registro'}
                    className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                      status ? `${ATTENDANCE_DOT[status]} text-white font-medium` : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {[
                { key: 'present', label: 'Presente', dot: 'bg-green-400' },
                { key: 'absent', label: 'Ausente', dot: 'bg-red-400' },
                { key: 'late', label: 'Tarde', dot: 'bg-yellow-400' },
                { key: 'excused', label: 'Excusado', dot: 'bg-blue-400' },
              ].map(({ key, label, dot }) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${dot}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: grades + observations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grades by period */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Valoraciones {currentYear}</h2>
              <Link to="/valoraciones" className="text-xs text-blue-600 hover:underline">Gestionar</Link>
            </div>
            {grades.filter(g => g.year === currentYear).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin valoraciones registradas</p>
            ) : (
              <div className="space-y-4">
                {periods.map(p => {
                  const pg = grades.filter(g => g.period === p && g.year === currentYear);
                  if (!pg.length) return null;
                  const avg = avgByPeriod[p - 1];
                  return (
                    <div key={p}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">Período {p}</h3>
                        {avg !== null && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${QUAL_COLORS[quantitativeToQualitative(avg)]}`}>
                            Promedio: {avg.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {pg.map(g => {
                          const sub = data.subjects.find(s => s.id === g.subjectId);
                          const level: QualitativeGrade | undefined =
                            g.type === 'quantitative' && g.quantitativeValue !== undefined
                              ? quantitativeToQualitative(g.quantitativeValue)
                              : g.qualitativeValue;
                          return (
                            <div key={g.id} className="bg-gray-50 rounded-lg p-2.5">
                              <p className="text-xs text-gray-500 truncate">{sub?.name ?? '—'}</p>
                              <p className="text-base font-bold text-gray-900 mt-0.5">
                                {g.type === 'quantitative' ? g.quantitativeValue?.toFixed(1) : g.qualitativeValue}
                              </p>
                              {level && (
                                <span className={`text-xs ${QUAL_COLORS[level]}`}>{level}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Observations */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Observaciones ({observations.length})</h2>
              <button onClick={() => setShowObsModal(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>
            {observations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin observaciones</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {observations.map(obs => (
                  <div key={obs.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[obs.category]}`}>
                        {CAT_LABELS[obs.category]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(obs.date), "d 'de' MMM, yyyy", { locale: es })}
                      </span>
                      {obs.createdBy && (
                        <span className="text-xs text-gray-400">· {obs.createdBy}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{obs.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Observation modal */}
      {showObsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nueva Observación</h2>
              <p className="text-sm text-gray-500">{student.firstName} {student.lastName}</p>
            </div>
            <form onSubmit={handleObsSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select className="input-field" value={obsForm.category} onChange={e => setObsForm(f => ({ ...f, category: e.target.value as ObservationCategory }))}>
                    {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" className="input-field" value={obsForm.date} onChange={e => setObsForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                <input className="input-field" placeholder="Nombre del docente" value={obsForm.createdBy} onChange={e => setObsForm(f => ({ ...f, createdBy: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observación *</label>
                <textarea required rows={4} className="input-field" value={obsForm.text} onChange={e => setObsForm(f => ({ ...f, text: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowObsModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade modal */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Nota</h2>
              <p className="text-sm text-gray-500">{student.firstName} {student.lastName}</p>
            </div>
            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                  <select required className="input-field" value={gradeForm.subjectId} onChange={e => setGradeForm(f => ({ ...f, subjectId: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select className="input-field" value={gradeForm.period} onChange={e => setGradeForm(f => ({ ...f, period: Number(e.target.value) as 1 | 2 | 3 | 4 }))}>
                    {[1, 2, 3, 4].map(p => <option key={p} value={p}>Período {p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <div className="flex gap-4">
                  {(['quantitative', 'qualitative'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={gradeForm.type === t} onChange={() => setGradeForm(f => ({ ...f, type: t }))} />
                      <span className="text-sm">{t === 'quantitative' ? 'Cuantitativa' : 'Cualitativa'}</span>
                    </label>
                  ))}
                </div>
              </div>
              {gradeForm.type === 'quantitative' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nota (1.0–5.0) *</label>
                  <input required type="number" min="1" max="5" step="0.1" className="input-field" value={gradeForm.quantitativeValue} onChange={e => setGradeForm(f => ({ ...f, quantitativeValue: e.target.value }))} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desempeño</label>
                  <select className="input-field" value={gradeForm.qualitativeValue} onChange={e => setGradeForm(f => ({ ...f, qualitativeValue: e.target.value as QualitativeGrade }))}>
                    {(['Superior', 'Alto', 'Básico', 'Bajo'] as QualitativeGrade[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input className="input-field" value={gradeForm.description} onChange={e => setGradeForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowGradeModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
