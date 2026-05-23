export type GradeLevel = 'Prejardín' | 'Jardín' | 'Transición' | '1°' | '2°' | '3°' | '4°' | '5°';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type QualitativeGrade = 'Superior' | 'Alto' | 'Básico' | 'Bajo';

export type ObservationCategory = 'académica' | 'conductual' | 'socioemocional' | 'logro' | 'general';

export type GradeType = 'quantitative' | 'qualitative';

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  subjects?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  gradeLevel: GradeLevel;
  label: string; // 'A', 'B', 'Único', etc.
  teacherId: string;
  year: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: GradeLevel;
  groupId?: string;
  birthDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface Subject {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  subjectId: string;
  period: 1 | 2 | 3 | 4;
  year: number;
  type: GradeType;
  quantitativeValue?: number; // 1.0 to 5.0
  qualitativeValue?: QualitativeGrade;
  description?: string;
  date: string;
}

export interface Observation {
  id: string;
  studentId: string;
  date: string;
  category: ObservationCategory;
  text: string;
  createdBy?: string;
}

export interface AppData {
  students: Student[];
  attendance: AttendanceRecord[];
  subjects: Subject[];
  grades: GradeRecord[];
  observations: Observation[];
  teachers: Teacher[];
  groups: Group[];
}
