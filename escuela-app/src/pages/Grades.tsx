import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, Download, FileText, Table } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { GradeLevel, QualitativeGrade } from '../types';
import { GRADE_LEVELS, quantitativeToQualitative } from '../utils/storage';
import { exportGradesPDF, exportGradesExcel } from '../utils/export';
import { format } from 'date-fns';

const QUALITATIVE_OPTIONS: QualitativeGrade[] = ['Superior', 'Alto', 'Básico', 'Bajo'];

const QUAL_COLORS: Record<QualitativeGrade, string> = {
  Superior: 'badge-superior',
  Alto: 'badge-alto',
  Básico: 'badge-basico',
  Bajo: 'badge-bajo',
};

const Grades: React.FC = () => {
  const { data, addGrade, deleteGrade } = useApp();
  const [filterGrade, setFilterGrade] = useState<GradeLevel>(GRADE_LEVELS[3]);
  const [filterPeriod, setFilterPeriod] = useState<1 | 2 | 3 | 4>(1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [form, setForm] = useState({
    subjectId: '',
    type: 'quantitative' as 'quantitative' | 'qualitative',
    quantitativeValue: '',
    qualitativeValue: 'Superior' as QualitativeGrade,
    description: '',
  });

  const [showExport, setShowExport] = useState(false);

  const students = data.students
    .filter(s => s.gradeLevel === filterGrade)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));

  const subjects = data.subjects.filter(s => s.gradeLevel === filterGrade);

  const openModal = (studentId: string) => {
    setSelectedStudent(studentId);
    setForm({
      subjectId: subjects[0]?.id ?? '',
      type: 'quantitative',
      quantitativeValue: '',
      qualitativeValue: 'Superior',
      description: '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGrade({
      studentId: selectedStudent,
      subjectId: form.subjectId,
      period: filterPeriod,
      year: filterYear,
      type: form.type,
      quantitativeValue: form.type === 'quantitative' ? parseFloat(form.quantitativeValue) : undefined,
      qualitativeValue: form.type === 'qualitative' ? form.qualitativeValue : undefined,
      description: form.description,
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Valoraciones</h1>
          <p className="text-sm text-gray-500">Registro de notas cualitativas y cuantitativas</p>
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
                    exportGradesPDF(students, data.grades, data.subjects, filterPeriod, filterYear, filterGrade);
                    setShowExport(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-red-500" /> Exportar PDF
                </button>
                <button
                  onClick={async () => {
                    await exportGradesExcel(students, data.grades, data.subjects, filterPeriod, filterYear, filterGrade);
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

      <div className="flex flex-wrap gap-3">
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value as GradeLevel)}
          className="input-field w-auto"
        >
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={filterPeriod}
          onChange={e => setFilterPeriod(Number(e.target.value) as 1 | 2 | 3 | 4)}
          className="input-field w-auto"
        >
          {[1, 2, 3, 4].map(p => <option key={p} value={p}>Período {p}</option>)}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          className="input-field w-auto"
        >
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {students.length === 0 ? (
        <div className="card text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay estudiantes en {filterGrade}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(student => {
            const studentGrades = data.grades.filter(
              g => g.studentId === student.id && g.period === filterPeriod && g.year === filterYear
            );
            const quantGrades = studentGrades.filter(
              g => g.type === 'quantitative' && g.quantitativeValue !== undefined
            );
            const avg = quantGrades.length
              ? (quantGrades.reduce((s, g) => s + (g.quantitativeValue ?? 0), 0) / quantGrades.length).toFixed(1)
              : null;

            return (
              <div key={student.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-sm">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.lastName}, {student.firstName}
                      </p>
                      {avg && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${QUAL_COLORS[quantitativeToQualitative(parseFloat(avg))]}`}>
                          Promedio: {avg} — {quantitativeToQualitative(parseFloat(avg))}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openModal(student.id)}
                    className="btn-primary text-sm py-1.5 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Nota
                  </button>
                </div>

                {studentGrades.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Sin valoraciones en este período
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs text-gray-500 pb-2">Materia</th>
                          <th className="text-center text-xs text-gray-500 pb-2">Valoración</th>
                          <th className="text-center text-xs text-gray-500 pb-2">Nivel</th>
                          <th className="text-left text-xs text-gray-500 pb-2">Descripción</th>
                          <th className="text-right text-xs text-gray-500 pb-2">Fecha</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {studentGrades.map(g => {
                          const subject = data.subjects.find(s => s.id === g.subjectId);
                          const qualLevel: QualitativeGrade | undefined =
                            g.type === 'quantitative' && g.quantitativeValue !== undefined
                              ? quantitativeToQualitative(g.quantitativeValue)
                              : g.qualitativeValue;
                          return (
                            <tr key={g.id}>
                              <td className="py-2 text-gray-700">{subject?.name ?? '—'}</td>
                              <td className="py-2 text-center font-semibold text-gray-900">
                                {g.type === 'quantitative'
                                  ? g.quantitativeValue?.toFixed(1)
                                  : g.qualitativeValue}
                              </td>
                              <td className="py-2 text-center">
                                {qualLevel && (
                                  <span className={QUAL_COLORS[qualLevel]}>{qualLevel}</span>
                                )}
                              </td>
                              <td className="py-2 text-gray-500 text-xs max-w-xs truncate">
                                {g.description}
                              </td>
                              <td className="py-2 text-right text-xs text-gray-400">
                                {format(new Date(g.date), 'd/MM/yy')}
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  onClick={() => deleteGrade(g.id)}
                                  className="text-gray-300 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Valoración</h2>
              <p className="text-sm text-gray-500">
                {data.students.find(s => s.id === selectedStudent)?.firstName} — Período {filterPeriod}, {filterYear}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                <select
                  required
                  className="input-field"
                  value={form.subjectId}
                  onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                >
                  <option value="">Seleccionar materia...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de valoración</label>
                <div className="flex gap-4">
                  {(['quantitative', 'qualitative'] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.type === t}
                        onChange={() => setForm(f => ({ ...f, type: t }))}
                      />
                      <span className="text-sm text-gray-700">
                        {t === 'quantitative' ? 'Cuantitativa (1.0–5.0)' : 'Cualitativa'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {form.type === 'quantitative' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nota (1.0 – 5.0) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    className="input-field"
                    value={form.quantitativeValue}
                    onChange={e => setForm(f => ({ ...f, quantitativeValue: e.target.value }))}
                  />
                  {form.quantitativeValue && !isNaN(parseFloat(form.quantitativeValue)) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Equivale a:{' '}
                      <span className={`font-medium ${QUAL_COLORS[quantitativeToQualitative(parseFloat(form.quantitativeValue))]}`}>
                        {quantitativeToQualitative(parseFloat(form.quantitativeValue))}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desempeño</label>
                  <select
                    className="input-field"
                    value={form.qualitativeValue}
                    onChange={e => setForm(f => ({ ...f, qualitativeValue: e.target.value as QualitativeGrade }))}
                  >
                    {QUALITATIVE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción / Observación
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Escribe una descripción opcional..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grades;
