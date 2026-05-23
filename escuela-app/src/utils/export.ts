import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import type { Student, AttendanceRecord, GradeRecord, Subject, Group, Teacher } from '../types';
import { ATTENDANCE_LABELS } from './storage';

// ─── helpers ────────────────────────────────────────────────────────────────

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const headerStyle = (ws: ExcelJS.Worksheet, row: number, cols: number) => {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) {
    const cell = r.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }
  r.height = 20;
};

// ─── Students ────────────────────────────────────────────────────────────────

export const exportStudentsPDF = (
  students: Student[],
  groups: Group[],
  teachers: Teacher[],
  title: string,
) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('EduControl — Lista de Estudiantes', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(title, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Apellido', 'Nombre', 'Grado', 'Grupo', 'Docente', 'Acudiente', 'Teléfono']],
    body: students.map((s, i) => {
      const group = groups.find(g => g.id === s.groupId);
      const teacher = group ? teachers.find(t => t.id === group.teacherId) : undefined;
      return [
        i + 1,
        s.lastName,
        s.firstName,
        s.gradeLevel,
        group ? `${group.gradeLevel}${group.label}` : '—',
        teacher?.name ?? '—',
        s.parentName || '—',
        s.parentPhone || '—',
      ];
    }),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`estudiantes_${Date.now()}.pdf`);
};

export const exportStudentsExcel = async (
  students: Student[],
  groups: Group[],
  teachers: Teacher[],
  title: string,
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Estudiantes');

  ws.columns = [
    { key: 'n', width: 5 },
    { key: 'lastName', width: 18 },
    { key: 'firstName', width: 18 },
    { key: 'grade', width: 12 },
    { key: 'group', width: 10 },
    { key: 'teacher', width: 22 },
    { key: 'parent', width: 22 },
    { key: 'phone', width: 15 },
    { key: 'email', width: 25 },
  ];

  ws.addRow(['#', 'Apellido', 'Nombre', 'Grado', 'Grupo', 'Docente', 'Acudiente', 'Teléfono', 'Email']);
  headerStyle(ws, 1, 9);

  students.forEach((s, i) => {
    const group = groups.find(g => g.id === s.groupId);
    const teacher = group ? teachers.find(t => t.id === group.teacherId) : undefined;
    ws.addRow([
      i + 1, s.lastName, s.firstName, s.gradeLevel,
      group ? `${group.gradeLevel}${group.label}` : '',
      teacher?.name ?? '',
      s.parentName, s.parentPhone, s.parentEmail,
    ]);
  });

  ws.getCell('A1').note = title;

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `estudiantes_${Date.now()}.xlsx`);
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export const exportAttendancePDF = (
  students: Student[],
  attendance: AttendanceRecord[],
  date: string,
  subtitle: string,
) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('EduControl — Registro de Asistencia', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha: ${date}  |  ${subtitle}`, 14, 26);

  const summary = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };

  const rows = students.map((s, i) => {
    const rec = attendance.find(a => a.studentId === s.id && a.date === date);
    const status = rec?.status;
    if (status) summary[status]++;
    else summary.unmarked++;
    return [i + 1, s.lastName, s.firstName, s.gradeLevel, ATTENDANCE_LABELS[status ?? ''] ?? 'Sin marcar'];
  });

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Apellido', 'Nombre', 'Grado', 'Estado']],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === 'body') {
        const val = data.cell.text[0];
        if (val === 'Presente') data.cell.styles.textColor = [22, 163, 74];
        else if (val === 'Ausente') data.cell.styles.textColor = [220, 38, 38];
        else if (val === 'Tarde') data.cell.styles.textColor = [202, 138, 4];
        else if (val === 'Excusado') data.cell.styles.textColor = [37, 99, 235];
      }
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(
    `Resumen: Presentes ${summary.present} | Ausentes ${summary.absent} | Tarde ${summary.late} | Excusados ${summary.excused} | Sin marcar ${summary.unmarked}`,
    14,
    finalY,
  );

  doc.save(`asistencia_${date}.pdf`);
};

export const exportAttendanceExcel = async (
  students: Student[],
  attendance: AttendanceRecord[],
  date: string,
  subtitle: string,
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Asistencia');

  ws.columns = [
    { key: 'n', width: 5 },
    { key: 'lastName', width: 18 },
    { key: 'firstName', width: 18 },
    { key: 'grade', width: 12 },
    { key: 'status', width: 14 },
  ];

  ws.addRow(['#', 'Apellido', 'Nombre', 'Grado', 'Estado']);
  headerStyle(ws, 1, 5);

  students.forEach((s, i) => {
    const rec = attendance.find(a => a.studentId === s.id && a.date === date);
    const status = rec?.status;
    const row = ws.addRow([i + 1, s.lastName, s.firstName, s.gradeLevel, ATTENDANCE_LABELS[status ?? ''] ?? 'Sin marcar']);
    const statusCell = row.getCell(5);
    const colors: Record<string, string> = {
      present: 'FF16A34A', absent: 'FFDC2626', late: 'FFCA8A04', excused: 'FF2563EB',
    };
    if (status && colors[status]) {
      statusCell.font = { color: { argb: colors[status] }, bold: true };
    }
  });

  ws.getCell('A1').note = `${date} — ${subtitle}`;

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `asistencia_${date}.xlsx`);
};

// ─── Grades ───────────────────────────────────────────────────────────────────

export const exportGradesPDF = (
  students: Student[],
  grades: GradeRecord[],
  subjects: Subject[],
  period: number,
  year: number,
  gradeLevel: string,
) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('EduControl — Valoraciones', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Grado: ${gradeLevel}  |  Período: ${period}  |  Año: ${year}`, 14, 26);

  const usedSubjectIds = [...new Set(
    grades
      .filter(g => students.some(s => s.id === g.studentId) && g.period === period && g.year === year)
      .map(g => g.subjectId)
  )];
  const usedSubjects = subjects.filter(s => usedSubjectIds.includes(s.id));

  const head = [['Estudiante', ...usedSubjects.map(s => s.name.substring(0, 12)), 'Promedio']];

  const body = students.map(s => {
    const row: (string | number)[] = [`${s.lastName}, ${s.firstName}`];
    let total = 0, count = 0;
    usedSubjects.forEach(sub => {
      const g = grades.find(gr => gr.studentId === s.id && gr.subjectId === sub.id && gr.period === period && gr.year === year);
      if (g) {
        if (g.type === 'quantitative' && g.quantitativeValue !== undefined) {
          row.push(g.quantitativeValue.toFixed(1));
          total += g.quantitativeValue;
          count++;
        } else {
          row.push(g.qualitativeValue ?? '—');
        }
      } else {
        row.push('—');
      }
    });
    row.push(count ? (total / count).toFixed(1) : '—');
    return row;
  });

  autoTable(doc, {
    startY: 32,
    head,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`valoraciones_${gradeLevel}_p${period}_${year}.pdf`);
};

export const exportGradesExcel = async (
  students: Student[],
  grades: GradeRecord[],
  subjects: Subject[],
  period: number,
  year: number,
  gradeLevel: string,
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Valoraciones');

  const usedSubjectIds = [...new Set(
    grades
      .filter(g => students.some(s => s.id === g.studentId) && g.period === period && g.year === year)
      .map(g => g.subjectId)
  )];
  const usedSubjects = subjects.filter(s => usedSubjectIds.includes(s.id));

  const cols = [
    { key: 'student', width: 22 },
    ...usedSubjects.map(s => ({ key: s.id, width: 14 })),
    { key: 'avg', width: 10 },
  ];
  ws.columns = cols;

  const headerRow = ['Estudiante', ...usedSubjects.map(s => s.name), 'Promedio'];
  ws.addRow(headerRow);
  headerStyle(ws, 1, headerRow.length);

  students.forEach(s => {
    const row: (string | number)[] = [`${s.lastName}, ${s.firstName}`];
    let total = 0, count = 0;
    usedSubjects.forEach(sub => {
      const g = grades.find(gr => gr.studentId === s.id && gr.subjectId === sub.id && gr.period === period && gr.year === year);
      if (g) {
        if (g.type === 'quantitative' && g.quantitativeValue !== undefined) {
          row.push(g.quantitativeValue);
          total += g.quantitativeValue;
          count++;
        } else {
          row.push(g.qualitativeValue ?? '');
        }
      } else {
        row.push('');
      }
    });
    row.push(count ? parseFloat((total / count).toFixed(1)) : '');
    ws.addRow(row);
  });

  const buf = await wb.xlsx.writeBuffer();
  saveBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `valoraciones_${gradeLevel}_p${period}_${year}.xlsx`);
};
