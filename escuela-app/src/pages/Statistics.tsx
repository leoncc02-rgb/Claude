import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import type { GradeLevel } from '../types';
import { GRADE_LEVELS, quantitativeToQualitative } from '../utils/storage';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

const Statistics: React.FC = () => {
  const { data } = useApp();
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'Todos'>('Todos');

  const students = data.students.filter(
    s => filterGrade === 'Todos' || s.gradeLevel === filterGrade
  );

  const attendanceByGrade = GRADE_LEVELS.map(level => {
    const gradeStudents = data.students.filter(s => s.gradeLevel === level);
    if (!gradeStudents.length) return null;
    const records = data.attendance.filter(a => gradeStudents.some(s => s.id === a.studentId));
    const present = records.filter(a => a.status === 'present').length;
    return {
      grado: level,
      asistencia: records.length ? Math.round((present / records.length) * 100) : 0,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  const gradeDistribution = [
    { name: 'Superior', value: 0, color: '#10b981' },
    { name: 'Alto', value: 0, color: '#3b82f6' },
    { name: 'Básico', value: 0, color: '#f59e0b' },
    { name: 'Bajo', value: 0, color: '#ef4444' },
  ];
  data.grades
    .filter(g => students.some(s => s.id === g.studentId))
    .forEach(g => {
      let level = '';
      if (g.type === 'quantitative' && g.quantitativeValue !== undefined) {
        level = quantitativeToQualitative(g.quantitativeValue);
      } else if (g.qualitativeValue) {
        level = g.qualitativeValue;
      }
      const entry = gradeDistribution.find(d => d.name === level);
      if (entry) entry.value++;
    });

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayRecords = data.attendance.filter(
      a => a.date === date && students.some(s => s.id === a.studentId)
    );
    return {
      dia: format(new Date(date + 'T12:00'), 'EEE d', { locale: es }),
      Presentes: dayRecords.filter(a => a.status === 'present').length,
      Ausentes: dayRecords.filter(a => a.status === 'absent').length,
      Tarde: dayRecords.filter(a => a.status === 'late').length,
    };
  });

  const studentStats = students.map(s => {
    const records = data.attendance.filter(a => a.studentId === s.id);
    const present = records.filter(a => a.status === 'present').length;
    const rate = records.length ? Math.round((present / records.length) * 100) : null;
    const grades = data.grades.filter(
      g => g.studentId === s.id && g.type === 'quantitative' && g.quantitativeValue !== undefined
    );
    const avg = grades.length
      ? (grades.reduce((sum, g) => sum + (g.quantitativeValue ?? 0), 0) / grades.length).toFixed(1)
      : null;
    return { ...s, attendanceRate: rate, avgGrade: avg };
  }).sort((a, b) => a.lastName.localeCompare(b.lastName));

  const overallAttendance = (() => {
    const records = data.attendance.filter(a => students.some(s => s.id === a.studentId));
    if (!records.length) return null;
    return Math.round((records.filter(r => r.status === 'present').length / records.length) * 100);
  })();

  const totalGrades = data.grades.filter(g => students.some(s => s.id === g.studentId)).length;
  const totalObs = data.observations.filter(o => students.some(s => s.id === o.studentId)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500">Resumen de rendimiento y asistencia</p>
        </div>
        <select
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value as GradeLevel | 'Todos')}
          className="input-field w-auto"
        >
          <option value="Todos">Todos los grados</option>
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Estudiantes', value: students.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          {
            label: 'Asistencia General',
            value: overallAttendance !== null ? `${overallAttendance}%` : 'N/A',
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          { label: 'Valoraciones', value: totalGrades, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Observaciones', value: totalObs, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`card ${bg} border-0`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos 7 días */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Asistencia — Últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Presentes" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ausentes" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Tarde" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución de desempeño */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Distribución de Desempeño</h2>
          {gradeDistribution.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin valoraciones registradas
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={gradeDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {gradeDistribution.filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {gradeDistribution.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-sm text-gray-600">
                      {d.name}: <strong>{d.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Asistencia por grado */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">% Asistencia por Grado</h2>
        {attendanceByGrade.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sin datos de asistencia</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceByGrade} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="grado" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="asistencia" name="% Asistencia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabla por estudiante */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Detalle por Estudiante</h2>
        {studentStats.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay estudiantes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Estudiante</th>
                  <th className="text-center text-xs font-semibold text-gray-500 pb-3 px-4">Grado</th>
                  <th className="text-center text-xs font-semibold text-gray-500 pb-3 px-4">Asistencia</th>
                  <th className="text-center text-xs font-semibold text-gray-500 pb-3 px-4">Promedio</th>
                  <th className="text-center text-xs font-semibold text-gray-500 pb-3 px-4">Nivel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentStats.map(s => {
                  const level = s.avgGrade ? quantitativeToQualitative(parseFloat(s.avgGrade)) : null;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {s.lastName}, {s.firstName}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{s.gradeLevel}</td>
                      <td className="py-3 px-4 text-center">
                        {s.attendanceRate !== null ? (
                          <span className={`font-medium ${
                            s.attendanceRate >= 90 ? 'text-green-600'
                              : s.attendanceRate >= 75 ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {s.attendanceRate}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">
                        {s.avgGrade ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {level ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            level === 'Superior' ? 'badge-superior'
                              : level === 'Alto' ? 'badge-alto'
                              : level === 'Básico' ? 'badge-basico'
                              : 'badge-bajo'
                          }`}>
                            {level}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
