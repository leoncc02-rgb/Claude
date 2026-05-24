import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, User, Download, FileText, Table, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Student, GradeLevel } from '../types';
import { GRADE_LEVELS } from '../utils/storage';
import { exportStudentsPDF, exportStudentsExcel } from '../utils/export';

const emptyStudent: Omit<Student, 'id' | 'createdAt'> = {
  firstName: '',
  lastName: '',
  gradeLevel: 'Prejardín',
  groupId: undefined,
  birthDate: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
};

const Students: React.FC = () => {
  const { data, addStudent, updateStudent, deleteStudent } = useApp();
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'Todos'>('Todos');
  const [filterGroup, setFilterGroup] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyStudent);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const filtered = data.students.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'Todos' || s.gradeLevel === filterGrade;
    const matchGroup = !filterGroup || s.groupId === filterGroup;
    return matchSearch && matchGrade && matchGroup;
  });

  const availableGroups = data.groups.filter(
    g => filterGrade === 'Todos' || g.gradeLevel === filterGrade
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyStudent);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      gradeLevel: s.gradeLevel,
      groupId: s.groupId,
      birthDate: s.birthDate,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      if (editing) {
        await updateStudent({ ...editing, ...form });
      } else {
        await addStudent(form);
      }
      setShowModal(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const groupsForGrade = data.groups.filter(g => g.gradeLevel === form.gradeLevel);

  const handleExportPDF = () => {
    const title = filterGrade !== 'Todos' ? filterGrade : 'Todos los grados';
    exportStudentsPDF(filtered, data.groups, data.teachers, title);
    setShowExport(false);
  };

  const handleExportExcel = async () => {
    const title = filterGrade !== 'Todos' ? filterGrade : 'Todos los grados';
    await exportStudentsExcel(filtered, data.groups, data.teachers, title);
    setShowExport(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-sm text-gray-500">{data.students.length} estudiantes registrados</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExport(v => !v)}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-44 py-1">
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <FileText className="w-4 h-4 text-red-500" /> Exportar PDF
                  </button>
                  <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Table className="w-4 h-4 text-green-600" /> Exportar Excel
                  </button>
                </div>
              </>
            )}
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterGrade}
          onChange={e => { setFilterGrade(e.target.value as GradeLevel | 'Todos'); setFilterGroup(''); }}
          className="input-field sm:w-40"
        >
          <option value="Todos">Todos los grados</option>
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {availableGroups.length > 0 && (
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="input-field sm:w-36"
          >
            <option value="">Todos los grupos</option>
            {availableGroups.map(g => (
              <option key={g.id} value={g.id}>{g.gradeLevel}{g.label}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron estudiantes</p>
          <button onClick={openAdd} className="mt-4 btn-primary">Agregar primer estudiante</button>
        </div>
      ) : (
        <div className="space-y-6">
          {GRADE_LEVELS.map(level => {
            const students = filtered.filter(s => s.gradeLevel === level);
            if (!students.length) return null;
            return (
              <div key={level}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {level} — {students.length} estudiantes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(s => {
                    const group = data.groups.find(g => g.id === s.groupId);
                    const teacher = group ? data.teachers.find(t => t.id === group.teacherId) : undefined;
                    return (
                      <div key={s.id} className="card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 font-semibold text-sm">
                                {s.firstName[0]}{s.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">{s.gradeLevel}</p>
                                {group && (
                                  <span className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded font-medium">
                                    Grupo {group.gradeLevel}{group.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Link to={`/estudiante/${s.id}`} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600" title="Ver perfil">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {(s.parentName || teacher) && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                            {teacher && (
                              <p className="text-xs text-gray-500">
                                Docente: <span className="text-gray-700">{teacher.name}</span>
                              </p>
                            )}
                            {s.parentName && (
                              <p className="text-xs text-gray-500">
                                Acudiente: <span className="text-gray-700">{s.parentName}</span>
                              </p>
                            )}
                            {s.parentPhone && (
                              <p className="text-xs text-gray-500">
                                Tel: <span className="text-gray-700">{s.parentPhone}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Estudiante' : 'Agregar Estudiante'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input required className="input-field" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input required className="input-field" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
                  <select
                    required
                    className="input-field"
                    value={form.gradeLevel}
                    onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value as GradeLevel, groupId: undefined }))}
                  >
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                  <select
                    className="input-field"
                    value={form.groupId ?? ''}
                    onChange={e => setForm(f => ({ ...f, groupId: e.target.value || undefined }))}
                  >
                    <option value="">Sin grupo</option>
                    {groupsForGrade.map(g => (
                      <option key={g.id} value={g.id}>{g.gradeLevel}{g.label} — {data.teachers.find(t => t.id === g.teacherId)?.name ?? 'Sin docente'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input type="date" className="input-field" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Acudiente</label>
                <input className="input-field" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input className="input-field" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="input-field" value={form.parentEmail} onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))} />
                </div>
              </div>
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {submitError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eliminar estudiante</h2>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción eliminará también su asistencia, valoraciones y observaciones. ¿Estás seguro?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => { deleteStudent(deleteConfirm); setDeleteConfirm(null); }} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
