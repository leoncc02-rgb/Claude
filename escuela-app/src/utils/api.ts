import type { Student, AttendanceRecord, AttendanceStatus, GradeLevel } from '../types';

const BASE = '/api';
const TOKEN_KEY = 'escuela_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
const storeToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const logout = (): void => localStorage.removeItem(TOKEN_KEY);

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
  return data as T;
}

// ---- Mapping ----

const STATUS_TO_BACKEND: Record<AttendanceStatus, string> = {
  present: 'presente',
  absent: 'ausente',
  late: 'tardanza',
  excused: 'excusado',
};

const STATUS_FROM_BACKEND: Record<string, AttendanceStatus> = {
  presente: 'present',
  ausente: 'absent',
  tardanza: 'late',
  excusado: 'excused',
};

function studentFromBackend(s: Record<string, unknown>): Student {
  const [firstName = '', ...rest] = ((s.name as string) ?? '').split(' ');
  return {
    id: s._id as string,
    firstName,
    lastName: rest.join(' '),
    gradeLevel: ((s.grado as string) ?? '1°') as GradeLevel,
    groupId: undefined,
    birthDate: (s.birthDate as string) ?? '',
    parentName: (s.parentName as string) ?? '',
    parentPhone: (s.parentPhone as string) ?? '',
    parentEmail: (s.parentEmail as string) ?? '',
    createdAt: (s.createdAt as string) ?? new Date().toISOString(),
  };
}

function studentToBackend(s: Omit<Student, 'id' | 'createdAt'>) {
  return {
    name: `${s.firstName} ${s.lastName}`.trim(),
    grado: s.gradeLevel,
    birthDate: s.birthDate,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
  };
}

function attendanceFromBackend(a: Record<string, unknown>): AttendanceRecord {
  const raw = a.studentId;
  const studentId =
    raw !== null && typeof raw === 'object' && '_id' in raw
      ? (raw as Record<string, unknown>)._id as string
      : (raw as string);
  return {
    id: a._id as string,
    studentId,
    date: new Date(a.fecha as string).toISOString().slice(0, 10),
    status: STATUS_FROM_BACKEND[a.estado as string] ?? 'absent',
    note: a.observacion as string | undefined,
  };
}

// ---- Auth ----

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const data = await request<{ token: string; user: AuthUser }>('POST', '/auth/login', {
    email,
    password,
  });
  storeToken(data.token);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  school?: string,
): Promise<{ token: string; user: AuthUser }> {
  const data = await request<{ token: string; user: AuthUser }>('POST', '/auth/registro', {
    name,
    email,
    password,
    school,
  });
  storeToken(data.token);
  return data;
}

// ---- Students ----

export async function fetchStudents(): Promise<Student[]> {
  const data = await request<{ students: Record<string, unknown>[] }>('GET', '/students');
  return data.students.map(studentFromBackend);
}

export async function createStudent(s: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const data = await request<{ student: Record<string, unknown> }>(
    'POST',
    '/students',
    studentToBackend(s),
  );
  return studentFromBackend(data.student);
}

export async function updateStudent(s: Student): Promise<Student> {
  const data = await request<{ student: Record<string, unknown> }>(
    'PUT',
    `/students/${s.id}`,
    studentToBackend(s),
  );
  return studentFromBackend(data.student);
}

export async function deleteStudent(id: string): Promise<void> {
  await request('DELETE', `/students/${id}`);
}

// ---- Attendance ----

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  const data = await request<{ asistencias: Record<string, unknown>[] }>('GET', '/attendance');
  return data.asistencias.map(attendanceFromBackend);
}

export async function setAttendanceRecord(
  studentId: string,
  date: string,
  status: AttendanceStatus,
  note?: string,
): Promise<AttendanceRecord> {
  const data = await request<{ asistencia: Record<string, unknown> }>('POST', '/attendance', {
    studentId,
    fecha: date,
    estado: STATUS_TO_BACKEND[status],
    observacion: note,
  });
  return attendanceFromBackend(data.asistencia);
}
