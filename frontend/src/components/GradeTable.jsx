import React, { useState, useRef, useCallback } from 'react';
import Avatar from './Avatar';

const getGradeColor = (score, maxScore) => {
  if (score === null || score === undefined) return '';
  const pct = (score / maxScore) * 100;
  if (pct >= 70) return 'text-green-700 bg-green-50';
  if (pct >= 50) return 'text-yellow-700 bg-yellow-50';
  return 'text-red-700 bg-red-50';
};

const GradeCell = ({ score, maxScore, onChange }) => {
  const [val, setVal] = useState(score !== null && score !== undefined ? String(score) : '');
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    setVal(e.target.value);
    setDirty(true);
  };

  const handleBlur = () => {
    if (!dirty) return;
    const parsed = val === '' ? null : parseFloat(val);
    if (val !== '' && (isNaN(parsed) || parsed < 0 || parsed > maxScore)) {
      setVal(score !== null && score !== undefined ? String(score) : '');
      setDirty(false);
      return;
    }
    onChange(parsed);
    setDirty(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      // Move to next input in the table
      const inputs = Array.from(document.querySelectorAll('.grade-input'));
      const idx = inputs.indexOf(inputRef.current);
      if (idx < inputs.length - 1) inputs[idx + 1].focus();
    }
    if (e.key === 'Tab') {
      // Let default tab behavior work
    }
  };

  const displayScore = dirty ? val : (score !== null && score !== undefined ? String(score) : '');
  const colorClass = !dirty && score !== null && score !== undefined ? getGradeColor(score, maxScore) : '';

  return (
    <input
      ref={inputRef}
      className={`grade-input ${colorClass}`}
      type="number"
      min="0"
      max={maxScore}
      step="0.5"
      value={displayScore}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="-"
    />
  );
};

const GradeTable = ({ evaluations, studentGrades, onGradeChange, subject }) => {
  const filteredEvals = subject
    ? evaluations.filter(e => e.subject === subject)
    : evaluations;

  if (filteredEvals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No hay evaluaciones para esta materia
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-2 px-3 font-medium text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[180px]">
              Estudiante
            </th>
            {filteredEvals.map(ev => (
              <th key={ev._id} className="text-center py-2 px-2 font-medium text-gray-600 min-w-[90px]">
                <div className="truncate max-w-[80px] mx-auto" title={ev.name}>{ev.name}</div>
                <div className="text-xs font-normal text-gray-400">/{ev.maxScore || 20}</div>
              </th>
            ))}
            <th className="text-center py-2 px-3 font-medium text-gray-600 min-w-[80px]">
              Promedio
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {studentGrades.map(({ student, grades, averages }) => {
            const avg = subject === 'tecnologia' ? averages.tecnologia :
                        subject === 'informatica' ? averages.informatica :
                        null;
            return (
              <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    {student.seatNumber && (
                      <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">
                        {student.seatNumber}
                      </span>
                    )}
                    <Avatar
                      firstName={student.firstName}
                      lastName={student.lastName}
                      photo={student.photo}
                      size="sm"
                    />
                    <span className="text-gray-800 truncate max-w-[120px]" title={`${student.firstName} ${student.lastName}`}>
                      {student.lastName}, {student.firstName}
                    </span>
                  </div>
                </td>
                {filteredEvals.map(ev => {
                  const gradeObj = grades[ev._id];
                  const score = gradeObj ? gradeObj.score : null;
                  return (
                    <td key={ev._id} className="py-2 px-2 text-center">
                      <GradeCell
                        score={score}
                        maxScore={ev.maxScore || 20}
                        onChange={(newScore) => onGradeChange(student._id, ev._id, ev.courseId, newScore)}
                      />
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-center">
                  {avg !== null && avg !== undefined ? (
                    <span className={`font-semibold text-sm px-2 py-0.5 rounded ${getGradeColor(avg, 20)}`}>
                      {avg}
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GradeTable;
