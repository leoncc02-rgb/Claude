export type GradeLevel = 'Prejardín' | 'Jardín' | 'Transición' | '1°' | '2°' | '3°' | '4°' | '5°';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type QualitativeGrade = 'Superior' | 'Alto' | 'Básico' | 'Bajo';

export type ObservationCategory = 'académica' | 'conductual' | 'socioemocional' | 'logro' | 'general';

export type GradeType = 'quantitative' | 'qualitative';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: GradeLevel;
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
}
