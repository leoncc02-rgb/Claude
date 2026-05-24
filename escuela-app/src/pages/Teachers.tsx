import React, { useState } from 'react';
import { Plus, Edit2, Trash2, UserCog, Mail, Phone, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Teacher } from '../types';

const emptyForm = { name: '', email: '', phone: '', subjects: '' };

const Teachers: React.FC = () => {
  const { data, addTeacher, updateTeacher, deleteTeacher } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({ name: t.name, email: t.email ?? '', phone: t.phone ?? '', subjects: t.subjects ?? '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateTeacher({ ...editing, ...form });
    } else {
      addTeacher(form);
    }
    setShowModal(false);
  };

  const getGroupsForTeacher = (teacherId: string) =>
    data.groups.filter(g => g.teacherId === teacherId);

  const getStudentCount = (teacherId: string) => {
    const groupIds = getGroupsForTeacher(teacherId).map(g => g.id);
    return data.students.filter(s => s.groupId && groupIds.includes(s.groupId)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
          <p className="text-sm text-gray-500">{data.teachers.length} docentes registrados</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar docente
        </button>
      </div>

      {data.teachers.length === 0 ? (
        <div className="card text-center py-12">
          <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay docentes registrados</p>
          <p className="text-sm text-gray-400 mt-1">Agrega docentes para asignarlos a grupos de estudiantes</p>
          <button onClick={openAdd} className="mt-4 btn-primary">Agregar primer docente</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.teachers.map(t => {
            const groups = getGroupsForTeacher(t.id);
            const studentCount = getStudentCount(t.id);
            return (
              <div key={t.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 font-bold text-sm">
                        {t.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t.name}</p>
                      {groups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {groups.map(g => (
                            <span key={g.id} className="bg-indigo-50 text-indigo-700 text-xs px-1.5 py-0.5 rounded font-medium">
                              {g.gradeLevel}{g.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                  {t.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {t.email}
                    </div>
                  )}
                  {t.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {t.phone}
                    </div>
                  )}
                  {t.subjects && (
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      {t.subjects}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{groups.length}</span> grupos
                    </span>
                    <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{studentCount}</span> estudiantes
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Docente' : 'Agregar Docente'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  required
                  className="input-field"
                  placeholder="Ej: María González"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materias a cargo</label>
                <input
                  className="input-field"
                  placeholder="Ej: Matemáticas, Ciencias"
                  value={form.subjects}
                  onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
                />
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eliminar docente</h2>
            <p className="text-gray-500 text-sm mb-6">
              Los grupos asignados a este docente quedarán sin docente asignado. ¿Continuar?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => { deleteTeacher(deleteConfirm); setDeleteConfirm(null); }} className="btn-danger flex-1">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
