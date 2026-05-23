import type { AppData, Subject, GradeLevel, QualitativeGrade } from '../types';

const STORAGE_KEY = 'escuela_app_data';

const DEFAULT_SUBJECTS: Subject[] = [
  // Prejardín, Jardín, Transición
  { id: 's1', name: 'Comunicación y Lenguaje', gradeLevel: 'Prejardín' },
  { id: 's2', name: 'Exploración del Entorno', gradeLevel: 'Prejardín' },
  { id: 's3', name: 'Expresión Artística', gradeLevel: 'Prejardín' },
  { id: 's4', name: 'Comunicación y Lenguaje', gradeLevel: 'Jardín' },
  { id: 's5', name: 'Exploración del Entorno', gradeLevel: 'Jardín' },
  { id: 's6', name: 'Expresión Artística', gradeLevel: 'Jardín' },
  { id: 's7', name: 'Comunicación y Lenguaje', gradeLevel: 'Transición' },
  { id: 's8', name: 'Pensamiento Lógico', gradeLevel: 'Transición' },
  { id: 's9', name: 'Expresión Artística', gradeLevel: 'Transición' },
  // 1° to 5°
  ...(['1°', '2°', '3°', '4°', '5°'] as GradeLevel[]).flatMap((grade, gi) =>
    ['Lengua Castellana', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales', 'Ética y Valores', 'Educación Física', 'Artística', 'Inglés'].map((name, ni) => ({
      id: `sg${gi}_${ni}`,
      name,
      gradeLevel: grade,
    }))
  ),
];

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: AppData = {
      students: [],
      attendance: [],
      subjects: DEFAULT_SUBJECTS,
      grades: [],
      observations: [],
    };
    saveData(initial);
    return initial;
  }
  return JSON.parse(raw);
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

export const quantitativeToQualitative = (value: number): QualitativeGrade => {
  if (value >= 4.6) return 'Superior';
  if (value >= 4.0) return 'Alto';
  if (value >= 3.0) return 'Básico';
  return 'Bajo';
};

export const qualitativeToNumber = (q: QualitativeGrade): number => {
  const map = { Superior: 5, Alto: 4.3, Básico: 3.5, Bajo: 2 };
  return map[q];
};

export const GRADE_LEVELS: GradeLevel[] = [
  'Prejardín', 'Jardín', 'Transición', '1°', '2°', '3°', '4°', '5°'
];

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  excused: 'Excusado',
};

export const ATTENDANCE_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  excused: 'bg-blue-100 text-blue-800',
};
