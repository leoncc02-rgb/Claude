import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Student, AttendanceRecord, GradeRecord, Subject, Group, Teacher, Observation } from '../types';
import { ATTENDANCE_LABELS, quantitativeToQualitative } from './storage';

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

// ─── Boletín individual ───────────────────────────────────────────────────────

export const exportBoletin = (
  student: Student,
  grades: GradeRecord[],
  subjects: Subject[],
  attendance: AttendanceRecord[],
  observations: Observation[],
  teacher?: Teacher,
  group?: Group,
) => {
  const doc = new jsPDF();
  const currentYear = new Date().getFullYear();
  let y = 15;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('EduControl — Boletín de Notas', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Año lectivo ${currentYear}`, 14, 20);
  doc.setTextColor(0, 0, 0);
  y = 36;

  // Student info box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, 190, 26, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.firstName} ${student.lastName}`, 16, y + 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Grado: ${student.gradeLevel}`, 16, y + 16);
  if (group) doc.text(`Grupo: ${group.gradeLevel}${group.label}`, 60, y + 16);
  if (teacher) doc.text(`Docente: ${teacher.name}`, 110, y + 16);
  if (student.parentName) doc.text(`Acudiente: ${student.parentName}`, 16, y + 22);
  doc.setTextColor(0);
  y += 34;

  // Grades by period
  const periods = [1, 2, 3, 4] as const;
  const studentGrades = grades.filter(g => g.year === currentYear);

  if (studentGrades.length > 0) {
    const usedSubjectIds = [...new Set(studentGrades.map(g => g.subjectId))];
    const usedSubjects = subjects.filter(s => usedSubjectIds.includes(s.id));

    const head = [['Materia', ...periods.map(p => `P${p}`), 'Promedio']];
    const body = usedSubjects.map(sub => {
      const row: string[] = [sub.name];
      let total = 0, count = 0;
      periods.forEach(p => {
        const g = studentGrades.find(gr => gr.subjectId === sub.id && gr.period === p);
        if (g) {
          const val = g.type === 'quantitative' && g.quantitativeValue !== undefined
            ? g.quantitativeValue.toFixed(1)
            : (g.qualitativeValue ?? '—');
          row.push(val);
          if (g.type === 'quantitative' && g.quantitativeValue !== undefined) {
            total += g.quantitativeValue;
            count++;
          }
        } else {
          row.push('—');
        }
      });
      const avg = count ? (total / count).toFixed(1) : '—';
      row.push(avg);
      return row;
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: { 0: { cellWidth: 70 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = parseFloat(data.cell.text[0]);
          if (!isNaN(val)) {
            const level = quantitativeToQualitative(val);
            if (level === 'Superior') data.cell.styles.textColor = [22, 163, 74];
            else if (level === 'Alto') data.cell.styles.textColor = [37, 99, 235];
            else if (level === 'Básico') data.cell.styles.textColor = [202, 138, 4];
            else data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // Attendance summary
  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  if (y > 230) { doc.addPage(); y = 15; }

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(10, y, 190, 16, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(22, 163, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('ASISTENCIA:', 16, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(`Tasa: ${rate}%   Presencias: ${present}   Ausencias: ${absent}   Total días registrados: ${total}`, 50, y + 6);
  y += 22;

  // Observations
  if (observations.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Observaciones', 14, y);
    y += 6;

    observations.slice(0, 8).forEach(obs => {
      if (y > 265) { doc.addPage(); y = 15; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80);
      doc.text(`${obs.date} [${obs.category}]${obs.createdBy ? ` — ${obs.createdBy}` : ''}`, 14, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40);
      const lines = doc.splitTextToSize(obs.text, 182) as string[];
      doc.text(lines, 14, y);
      y += lines.length * 4 + 3;
    });
  }

  // Footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`EduControl — Generado el ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`, 14, 290);
    doc.text(`Página ${i} de ${pageCount}`, 180, 290);
  }

  doc.save(`boletin_${student.lastName}_${student.firstName}_${currentYear}.pdf`);
};
