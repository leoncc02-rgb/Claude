import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Group, GradeLevel } from '../types';
import { GRADE_LEVELS } from '../utils/storage';

const LABELS = ['A', 'B', 'C', 'D', 'Único'];

const emptyForm = {
  gradeLevel: GRADE_LEVELS[0] as GradeLevel,
  label: 'A',
  teacherId: '',
  year: new Date().getFullYear(),
};

const Groups: React.FC = () => {
  const { data, addGroup, updateGroup, deleteGroup } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, teacherId: data.teachers[0]?.id ?? '' });
    setShowModal(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({ gradeLevel: g.gradeLevel, label: g.label, teacherId: g.teacherId, year: g.year });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateGroup({ ...editing, ...form });
    } else {
      addGroup(form);
    }
    setShowModal(false);
  };

  const getStudents = (groupId: string) => data.students.filter(s => s.groupId === groupId);

  const filteredGroups = data.groups
    .filter(g => g.year === filterYear)
    .sort((a, b) => GRADE_LEVELS.indexOf(a.gradeLevel) - GRADE_LEVELS.indexOf(b.gradeLevel));

  const byGrade = GRADE_LEVELS.map(level => ({
    level,
    groups: filteredGroups.filter(g => g.gradeLevel === level),
  })).filter(g => g.groups.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupos</h1>
          <p className="text-sm text-gray-500">{filteredGroups.length} grupos en {filterYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="input-field w-auto"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nuevo grupo
          </button>
        </div>
      </div>

      {data.teachers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          Primero debes registrar docentes en la sección <strong>Docentes</strong> para poder asignarlos a los grupos.
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay grupos para {filterYear}</p>
          <p className="text-sm text-gray-400 mt-1">Los grupos permiten organizar estudiantes y asignarles un docente</p>
          <button onClick={openAdd} className="mt-4 btn-primary">Crear primer grupo</button>
        </div>
      ) : (
        <div className="space-y-6">
          {byGrade.map(({ level, groups }) => (
            <div key={level}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{level}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(g => {
                  const teacher = data.teachers.find(t => t.id === g.teacherId);
                  const students = getStudents(g.id);
                  return (
                    <div key={g.id} className="card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-blue-600">
                              {g.gradeLevel}{g.label}
                            </span>
                            <span className="text-xs text-gray-400">{g.year}</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {teacher ? teacher.name : (
                              <span className="text-amber-600">Sin docente asignado</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span><strong className="text-gray-900">{students.length}</strong> estudiantes</span>
                        </div>
                        {students.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {students.slice(0, 6).map(s => (
                              <span key={s.id} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                {s.firstName} {s.lastName[0]}.
                              </span>
                            ))}
                            {students.length > 6 && (
                              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                +{students.length - 6} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                  <select
                    required
                    className="input-field"
                    value={form.label}
                    onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  >
                    {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                  <select
                    className="input-field"
                    value={form.teacherId}
                    onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  >
                    <option value="">Sin asignar</option>
                    {data.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                  <select
                    required
                    className="input-field"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  >
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                El grupo se llamará: <strong className="text-gray-700">{form.gradeLevel}{form.label} — {form.year}</strong>
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Guardar cambios' : 'Crear grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Eliminar grupo</h2>
            <p className="text-gray-500 text-sm mb-6">
              Los estudiantes de este grupo quedarán sin grupo asignado. ¿Continuar?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => { deleteGroup(deleteConfirm); setDeleteConfirm(null); }} className="btn-danger flex-1">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
