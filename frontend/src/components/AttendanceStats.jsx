import React from 'react';
import { Users, User } from 'lucide-react';

const StatBar = ({ label, present, total, color }) => {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">{present}/{total} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const AttendanceStats = ({ stats }) => {
  if (!stats) return null;

  const { total, boys, girls } = stats;

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Users size={16} className="text-blue-500" />
        Estadísticas de Asistencia
      </h3>
      <div className="space-y-3">
        <StatBar
          label="Total presentes"
          present={total.present}
          total={total.students}
          color="bg-green-500"
        />
        <StatBar
          label="Niños presentes"
          present={boys.present}
          total={boys.total}
          color="bg-blue-500"
        />
        <StatBar
          label="Niñas presentes"
          present={girls.present}
          total={girls.total}
          color="bg-pink-500"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-green-600">{total.present}</div>
          <div className="text-xs text-gray-500">Presentes</div>
        </div>
        <div>
          <div className="text-lg font-bold text-red-600">{total.absent}</div>
          <div className="text-xs text-gray-500">Ausentes</div>
        </div>
        <div>
          <div className="text-lg font-bold text-yellow-600">{total.late}</div>
          <div className="text-xs text-gray-500">Tardanzas</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceStats;
