import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Student, GradeLevel } from '../types';
import { GRADE_LEVELS } from '../utils/storage';

const emptyStudent: Omit<Student, 'id' | 'createdAt'> = {
  firstName: '',
  lastName: '',
  gradeLevel: 'Prejardín',
  birthDate: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
};

const Students: React.FC = () => {
  const { data, addStudent, updateStudent, deleteStudent } = useApp();
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'Todos'>('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyStudent);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = data.students.filter(s => {
    const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'Todos' || s.gradeLevel === filterGrade;
    return matchSearch && matchGrade;
  });

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
      birthDate: s.birthDate,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateStudent({ ...editing, ...form });
    } else {
      addStudent(form);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudiantes</h1>
          <p className="text-sm text-gray-500">{data.students.length} estudiantes registrados</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar
        </button>
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
          onChange={e => setFilterGrade(e.target.value as GradeLevel | 'Todos')}
          className="input-field sm:w-40"
        >
          <option value="Todos">Todos los grados</option>
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Student list grouped by grade */}
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
                  {students.sort((a, b) => a.lastName.localeCompare(b.lastName)).map(s => (
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
                            <p className="text-xs text-gray-500">{s.gradeLevel}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(s.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {s.parentName && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Acudiente: <span className="text-gray-700">{s.parentName}</span>
                          </p>
                          {s.parentPhone && (
                            <p className="text-xs text-gray-500">
                              Tel: <span className="text-gray-700">{s.parentPhone}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
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
                  <input
                    required
                    className="input-field"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                  <input
                    required
                    className="input-field"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
                  <select
                    required
                    className="input-field"
                    value={form.gradeLevel}
                    onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value as GradeLevel }))}
                  >
                    {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Acudiente</label>
                <input
                  className="input-field"
                  value={form.parentName}
                  onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    className="input-field"
                    value={form.parentPhone}
                    onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={form.parentEmail}
                    onChange={e => setForm(f => ({ ...f, parentEmail: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eliminar estudiante</h2>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción eliminará también su asistencia, valoraciones y observaciones. ¿Estás seguro?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() => { deleteStudent(deleteConfirm); setDeleteConfirm(null); }}
                className="btn-danger flex-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
