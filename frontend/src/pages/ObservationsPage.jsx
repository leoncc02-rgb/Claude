import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, X, MessageSquare } from 'lucide-react';
import { observationsApi } from '../api/observations';
import { studentsApi } from '../api/students';
import ObservationCard from '../components/ObservationCard';

const TYPES = [
  { id: '', label: 'Todas' },
  { id: 'general', label: 'General' },
  { id: 'personal', label: 'Personal' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'recordatorio', label: 'Recordatorio' },
  { id: 'tarea', label: 'Tarea' }
];

const TYPE_CONFIG = {
  general: { label: 'General', badge: 'bg-blue-100 text-blue-700' },
  personal: { label: 'Personal', badge: 'bg-purple-100 text-purple-700' },
  pendiente: { label: 'Pendiente', badge: 'bg-yellow-100 text-yellow-700' },
  recordatorio: { label: 'Recordatorio', badge: 'bg-orange-100 text-orange-700' },
  tarea: { label: 'Tarea', badge: 'bg-green-100 text-green-700' }
};

const NewObservationForm = ({ courseId, students, onSave, onCancel }) => {
  const [form, setForm] = useState({
    type: 'general',
    content: '',
    studentId: '',
    isPrivate: false,
    isPinned: false,
    dueDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) { setError('El contenido es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      await observationsApi.create({
        courseId,
        studentId: form.studentId || undefined,
        type: form.type,
        content: form.content.trim(),
        isPrivate: form.isPrivate,
        isPinned: form.isPinned,
        dueDate: form.dueDate || undefined
      });
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mb-4 border-2 border-blue-200">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Plus size={18} className="text-blue-600" /> Nueva Observación
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo *</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TYPES.filter(t => t.id).map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Estudiante (opcional)</label>
            <select className="input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">Todos los estudiantes (curso)</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.lastName}, {s.firstName}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Contenido *</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Escribe tu observación aquí..."
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha límite (opcional)</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex items-end gap-4 pb-2">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.isPrivate} onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))} className="rounded" />
              Privada (solo yo)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
              Fijar arriba
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Observación'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ObservationsPage = ({ courseId, course }) => {
  const [observations, setObservations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [obsData, studData] = await Promise.all([
        observationsApi.getAll({
          courseId,
          type: typeFilter || undefined,
          studentId: studentFilter || undefined,
          limit: 100
        }),
        studentsApi.getAll({ courseId })
      ]);
      setObservations(obsData.data?.observations || []);
      setStudents(studData.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, typeFilter, studentFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdate = async (id, data) => {
    await observationsApi.update(id, data);
    await loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta observación?')) return;
    await observationsApi.delete(id);
    await loadData();
  };

  const handleToggleResolved = async (id) => {
    await observationsApi.toggleResolved(id);
    await loadData();
  };

  const handleSaved = async () => {
    setShowForm(false);
    await loadData();
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <button
              key={t.id}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2 items-center">
          <select
            className="input w-auto text-sm"
            value={studentFilter}
            onChange={e => setStudentFilter(e.target.value)}
          >
            <option value="">Todos los estudiantes</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.lastName}, {s.firstName}</option>
            ))}
          </select>

          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Nueva Nota
          </button>
        </div>
      </div>

      {/* New observation form */}
      {showForm && (
        <NewObservationForm
          courseId={courseId}
          students={students}
          onSave={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Observations list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : observations.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-3">
            {typeFilter ? 'No hay observaciones de este tipo' : 'No hay observaciones aún'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Añadir primera observación
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary counts by type */}
          <div className="flex flex-wrap gap-2 mb-2">
            {Object.entries(
              observations.reduce((acc, o) => { acc[o.type] = (acc[o.type] || 0) + 1; return acc; }, {})
            ).map(([type, count]) => (
              <button
                key={type}
                className={`badge cursor-pointer hover:opacity-80 ${TYPE_CONFIG[type]?.badge || 'bg-gray-100 text-gray-600'}`}
                onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              >
                {TYPE_CONFIG[type]?.label || type}: {count}
              </button>
            ))}
          </div>

          {observations.map(obs => (
            <ObservationCard
              key={obs._id}
              observation={obs}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onToggleResolved={handleToggleResolved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ObservationsPage;
