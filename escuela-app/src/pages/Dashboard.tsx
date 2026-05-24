import React from 'react';
import { Link } from 'react-router-dom';
import { Users, CalendarCheck, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GRADE_LEVELS } from '../utils/storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { data } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayAttendance = data.attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;

  const recentObs = [...data.observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const gradesByCourse = GRADE_LEVELS.map(level => {
    const students = data.students.filter(s => s.gradeLevel === level);
    return { level, count: students.length };
  }).filter(g => g.count > 0);

  const avgGrade = (() => {
    const quant = data.grades.filter(g => g.type === 'quantitative' && g.quantitativeValue !== undefined);
    if (!quant.length) return null;
    return (quant.reduce((sum, g) => sum + (g.quantitativeValue ?? 0), 0) / quant.length).toFixed(1);
  })();

  const statCards = [
    {
      label: 'Total Estudiantes',
      value: data.students.length,
      icon: Users,
      color: 'bg-blue-500',
      link: '/estudiantes',
    },
    {
      label: 'Presentes Hoy',
      value: `${presentToday}/${data.students.length}`,
      icon: CalendarCheck,
      color: 'bg-green-500',
      link: '/asistencia',
    },
    {
      label: 'Ausentes Hoy',
      value: absentToday,
      icon: AlertCircle,
      color: 'bg-red-500',
      link: '/asistencia',
    },
    {
      label: 'Promedio General',
      value: avgGrade ?? 'N/A',
      icon: TrendingUp,
      color: 'bg-purple-500',
      link: '/valoraciones',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, link }) => (
          <Link key={label} to={link} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by grade */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Estudiantes por Grado</h2>
          {gradesByCourse.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay estudiantes registrados.</p>
          ) : (
            <div className="space-y-2">
              {gradesByCourse.map(({ level, count }) => (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{level}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((count / Math.max(...gradesByCourse.map(g => g.count))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent observations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Observaciones Recientes</h2>
            <Link to="/observaciones" className="text-blue-600 text-sm hover:underline">Ver todas</Link>
          </div>
          {recentObs.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay observaciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {recentObs.map(obs => {
                const student = data.students.find(s => s.id === obs.studentId);
                return (
                  <div key={obs.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {student ? `${student.firstName} ${student.lastName}` : 'Estudiante'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{obs.text}</p>
                      <p className="text-xs text-gray-400">{format(new Date(obs.date), 'd MMM yyyy', { locale: es })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
