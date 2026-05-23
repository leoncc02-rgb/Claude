import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Observation, ObservationCategory, GradeLevel } from '../types';
import { GRADE_LEVELS } from '../utils/storage';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIES: { value: ObservationCategory; label: string; color: string }[] = [
  { value: 'académica', label: 'Académica', color: 'bg-blue-100 text-blue-800' },
  { value: 'conductual', label: 'Conductual', color: 'bg-orange-100 text-orange-800' },
  { value: 'socioemocional', label: 'Socioemocional', color: 'bg-purple-100 text-purple-800' },
  { value: 'logro', label: 'Logro', color: 'bg-green-100 text-green-800' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-800' },
];

const getCategoryColor = (cat: ObservationCategory) =>
  CATEGORIES.find(c => c.value === cat)?.color ?? 'bg-gray-100 text-gray-800';

const getCategoryLabel = (cat: ObservationCategory) =>
  CATEGORIES.find(c => c.value === cat)?.label ?? cat;

const emptyForm = {
  studentId: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  category: 'general' as ObservationCategory,
  text: '',
  createdBy: '',
};

const Observations: React.FC = () => {
  const { data, addObservation, updateObservation, deleteObservation } = useApp();
  const [filterGrade, setFilterGrade] = useState<GradeLevel | 'Todos'>('Todos');
  const [filterCategory, setFilterCategory] = useState<ObservationCategory | 'Todos'>('Todos');
  const [filterStudent, setFilterStudent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Observation | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filteredStudents = data.students.filter(
    s => filterGrade === 'Todos' || s.gradeLevel === filterGrade
  );

  const observations = data.observations
    .filter(o => {
      const student = data.students.find(s => s.id === o.studentId);
      if (!student) return false;
      if (filterGrade !== 'Todos' && student.gradeLevel !== filterGrade) return false;
      if (filterCategory !== 'Todos' && o.category !== filterCategory) return false;
      if (filterStudent && o.studentId !== filterStudent) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, studentId: filteredStudents[0]?.id ?? '' });
    setShowModal(true);
  };

  const openEdit = (o: Observation) => {
    setEditing(o);
    setForm({
      studentId: o.studentId,
      date: o.date,
      category: o.category,
      text: o.text,
      createdBy: o.createdBy ?? '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateObservation({ ...editing, ...form });
    } else {
      addObservation(form);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Observaciones</h1>
          <p className="text-sm text-gray-500">{data.observations.length} observaciones registradas</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva observación
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterGrade}
          onChange={e => {
            setFilterGrade(e.target.value as GradeLevel | 'Todos');
            setFilterStudent('');
          }}
          className="input-field w-auto"
        >
          <option value="Todos">Todos los grados</option>
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select
          value={filterStudent}
          onChange={e => setFilterStudent(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">Todos los estudiantes</option>
          {filteredStudents
            .sort((a, b) => a.lastName.localeCompare(b.lastName))
            .map(s => (
              <option key={s.id} value={s.id}>
                {s.lastName}, {s.firstName}
              </option>
            ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as ObservationCategory | 'Todos')}
          className="input-field w-auto"
        >
          <option value="Todos">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {observations.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No hay observaciones registradas</p>
          <button onClick={openAdd} className="mt-4 btn-primary">Agregar primera observación</button>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map(obs => {
            const student = data.students.find(s => s.id === obs.studentId);
            return (
              <div key={obs.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 text-xs font-semibold">
                        {student ? `${student.firstName[0]}${student.lastName[0]}` : '??'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {student ? `${student.firstName} ${student.lastName}` : 'Estudiante'}
                        </p>
                        {student && (
                          <span className="text-xs text-gray-400">({student.gradeLevel})</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(obs.category)}`}>
                          {getCategoryLabel(obs.category)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{obs.text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-400">
                          {format(new Date(obs.date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        {obs.createdBy && (
                          <p className="text-xs text-gray-400">Por: {obs.createdBy}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEdit(obs)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteObservation(obs.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? 'Editar Observación' : 'Nueva Observación'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estudiante *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={form.studentId}
                    onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {data.students
                      .sort((a, b) => a.lastName.localeCompare(b.lastName))
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.lastName}, {s.firstName} ({s.gradeLevel})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as ObservationCategory }))}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                  <input
                    className="input-field"
                    placeholder="Nombre del docente"
                    value={form.createdBy}
                    onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observación *
                </label>
                <textarea
                  required
                  rows={4}
                  className="input-field"
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="Escriba aquí la observación..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editing ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Observations;
