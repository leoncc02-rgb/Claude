import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  AppData, Student, AttendanceRecord, GradeRecord, Observation, Teacher, Group,
} from '../types';
import { loadData, saveData, generateId } from '../utils/storage';
import * as api from '../utils/api';
import type { AuthUser } from '../utils/api';

interface AppContextType {
  data: AppData;
  auth: AuthUser | null;
  loading: boolean;
  activeTeacherId: string | null;
  setActiveTeacherId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, school?: string) => Promise<void>;
  logout: () => void;
  addStudent: (s: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  updateStudent: (s: Student) => Promise<void>;
  deleteStudent: (id: string) => void;
  setAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  addGrade: (g: Omit<GradeRecord, 'id'>) => void;
  updateGrade: (g: GradeRecord) => void;
  deleteGrade: (id: string) => void;
  addObservation: (o: Omit<Observation, 'id'>) => void;
  updateObservation: (o: Observation) => void;
  deleteObservation: (id: string) => void;
  addTeacher: (t: Omit<Teacher, 'id' | 'createdAt'>) => void;
  updateTeacher: (t: Teacher) => void;
  deleteTeacher: (id: string) => void;
  addGroup: (g: Omit<Group, 'id'>) => void;
  updateGroup: (g: Group) => void;
  deleteGroup: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadData);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [auth, setAuth] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('escuela_auth_user');
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [loading, setLoading] = useState(false);

  // Fetch students + attendance from backend whenever the logged-in user changes
  const authId = auth?._id;
  useEffect(() => {
    if (!authId) return;
    setLoading(true);
    Promise.all([api.fetchStudents(), api.fetchAttendance()])
      .then(([students, attendance]) => {
        setData(prev => {
          const next = { ...prev, students, attendance };
          saveData(next);
          return next;
        });
      })
      .catch(err => {
        console.error('Error al sincronizar:', err);
        api.logout();
        localStorage.removeItem('escuela_auth_user');
        setAuth(null);
      })
      .finally(() => setLoading(false));
  }, [authId]);

  const login = async (email: string, password: string): Promise<void> => {
    const { user } = await api.login(email, password);
    localStorage.setItem('escuela_auth_user', JSON.stringify(user));
    setAuth(user);
  };

  const register = async (
    name: string, email: string, password: string, school?: string,
  ): Promise<void> => {
    const { user } = await api.register(name, email, password, school);
    localStorage.setItem('escuela_auth_user', JSON.stringify(user));
    setAuth(user);
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('escuela_auth_user');
    setAuth(null);
    setData(loadData());
  };

  const sync = useCallback((updater: (d: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  // ---- Students (API when authenticated, localStorage otherwise) ----

  const addStudent = async (s: Omit<Student, 'id' | 'createdAt'>): Promise<void> => {
    if (auth) {
      const student = await api.createStudent(s);
      sync(d => ({ ...d, students: [...d.students, student] }));
    } else {
      sync(d => ({
        ...d,
        students: [...d.students, { ...s, id: generateId(), createdAt: new Date().toISOString() }],
      }));
    }
  };

  const updateStudent = async (s: Student): Promise<void> => {
    if (auth) {
      const student = await api.updateStudent(s);
      sync(d => ({ ...d, students: d.students.map(x => (x.id === s.id ? student : x)) }));
    } else {
      sync(d => ({ ...d, students: d.students.map(x => (x.id === s.id ? s : x)) }));
    }
  };

  const deleteStudent = (id: string): void => {
    sync(d => ({
      ...d,
      students: d.students.filter(x => x.id !== id),
      attendance: d.attendance.filter(x => x.studentId !== id),
      grades: d.grades.filter(x => x.studentId !== id),
      observations: d.observations.filter(x => x.studentId !== id),
    }));
    if (auth) api.deleteStudent(id).catch(console.error);
  };

  // ---- Attendance (optimistic local update + background API sync) ----

  const setAttendance = (record: Omit<AttendanceRecord, 'id'>): void => {
    sync(d => {
      const idx = d.attendance.findIndex(
        a => a.studentId === record.studentId && a.date === record.date,
      );
      const attendance = [...d.attendance];
      if (idx >= 0) {
        attendance[idx] = { ...record, id: attendance[idx].id };
      } else {
        attendance.push({ ...record, id: generateId() });
      }
      return { ...d, attendance };
    });
    if (auth) {
      api.setAttendanceRecord(record.studentId, record.date, record.status, record.note)
        .catch(console.error);
    }
  };

  // ---- Everything else: localStorage only ----

  const addGrade = (g: Omit<GradeRecord, 'id'>) =>
    sync(d => ({ ...d, grades: [...d.grades, { ...g, id: generateId() }] }));
  const updateGrade = (g: GradeRecord) =>
    sync(d => ({ ...d, grades: d.grades.map(x => (x.id === g.id ? g : x)) }));
  const deleteGrade = (id: string) =>
    sync(d => ({ ...d, grades: d.grades.filter(x => x.id !== id) }));

  const addObservation = (o: Omit<Observation, 'id'>) =>
    sync(d => ({ ...d, observations: [...d.observations, { ...o, id: generateId() }] }));
  const updateObservation = (o: Observation) =>
    sync(d => ({ ...d, observations: d.observations.map(x => (x.id === o.id ? o : x)) }));
  const deleteObservation = (id: string) =>
    sync(d => ({ ...d, observations: d.observations.filter(x => x.id !== id) }));

  const addTeacher = (t: Omit<Teacher, 'id' | 'createdAt'>) =>
    sync(d => ({
      ...d,
      teachers: [...d.teachers, { ...t, id: generateId(), createdAt: new Date().toISOString() }],
    }));
  const updateTeacher = (t: Teacher) =>
    sync(d => ({ ...d, teachers: d.teachers.map(x => (x.id === t.id ? t : x)) }));
  const deleteTeacher = (id: string) =>
    sync(d => ({
      ...d,
      teachers: d.teachers.filter(x => x.id !== id),
      groups: d.groups.map(g => (g.teacherId === id ? { ...g, teacherId: '' } : g)),
    }));

  const addGroup = (g: Omit<Group, 'id'>) =>
    sync(d => ({ ...d, groups: [...d.groups, { ...g, id: generateId() }] }));
  const updateGroup = (g: Group) =>
    sync(d => ({ ...d, groups: d.groups.map(x => (x.id === g.id ? g : x)) }));
  const deleteGroup = (id: string) =>
    sync(d => ({
      ...d,
      groups: d.groups.filter(x => x.id !== id),
      students: d.students.map(s => (s.groupId === id ? { ...s, groupId: undefined } : s)),
    }));

  return (
    <AppContext.Provider
      value={{
        data, auth, loading, activeTeacherId, setActiveTeacherId,
        login, register, logout,
        addStudent, updateStudent, deleteStudent,
        setAttendance,
        addGrade, updateGrade, deleteGrade,
        addObservation, updateObservation, deleteObservation,
        addTeacher, updateTeacher, deleteTeacher,
        addGroup, updateGroup, deleteGroup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
