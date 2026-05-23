import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppData, Student, AttendanceRecord, GradeRecord, Observation } from '../types';
import { loadData, saveData, generateId } from '../utils/storage';

interface AppContextType {
  data: AppData;
  addStudent: (s: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  setAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  addGrade: (g: Omit<GradeRecord, 'id'>) => void;
  updateGrade: (g: GradeRecord) => void;
  deleteGrade: (id: string) => void;
  addObservation: (o: Omit<Observation, 'id'>) => void;
  updateObservation: (o: Observation) => void;
  deleteObservation: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadData);

  const update = useCallback((updater: (d: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const addStudent = (s: Omit<Student, 'id' | 'createdAt'>) =>
    update(d => ({ ...d, students: [...d.students, { ...s, id: generateId(), createdAt: new Date().toISOString() }] }));

  const updateStudent = (s: Student) =>
    update(d => ({ ...d, students: d.students.map(x => x.id === s.id ? s : x) }));

  const deleteStudent = (id: string) =>
    update(d => ({
      ...d,
      students: d.students.filter(x => x.id !== id),
      attendance: d.attendance.filter(x => x.studentId !== id),
      grades: d.grades.filter(x => x.studentId !== id),
      observations: d.observations.filter(x => x.studentId !== id),
    }));

  const setAttendance = (record: Omit<AttendanceRecord, 'id'>) =>
    update(d => {
      const existing = d.attendance.findIndex(
        a => a.studentId === record.studentId && a.date === record.date
      );
      if (existing >= 0) {
        const updated = [...d.attendance];
        updated[existing] = { ...record, id: updated[existing].id };
        return { ...d, attendance: updated };
      }
      return { ...d, attendance: [...d.attendance, { ...record, id: generateId() }] };
    });

  const addGrade = (g: Omit<GradeRecord, 'id'>) =>
    update(d => ({ ...d, grades: [...d.grades, { ...g, id: generateId() }] }));

  const updateGrade = (g: GradeRecord) =>
    update(d => ({ ...d, grades: d.grades.map(x => x.id === g.id ? g : x) }));

  const deleteGrade = (id: string) =>
    update(d => ({ ...d, grades: d.grades.filter(x => x.id !== id) }));

  const addObservation = (o: Omit<Observation, 'id'>) =>
    update(d => ({ ...d, observations: [...d.observations, { ...o, id: generateId() }] }));

  const updateObservation = (o: Observation) =>
    update(d => ({ ...d, observations: d.observations.map(x => x.id === o.id ? o : x) }));

  const deleteObservation = (id: string) =>
    update(d => ({ ...d, observations: d.observations.filter(x => x.id !== id) }));

  return (
    <AppContext.Provider value={{
      data, addStudent, updateStudent, deleteStudent, setAttendance,
      addGrade, updateGrade, deleteGrade, addObservation, updateObservation, deleteObservation,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
