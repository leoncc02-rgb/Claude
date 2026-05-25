import React, { useState } from 'react';
import { Pencil, Trash2, Check, X, Scale } from 'lucide-react';

const TYPE_LABELS = {
  tarea: 'Tarea',
  proyecto: 'Proyecto',
  examen: 'Examen',
  participacion: 'Participación',
  otro: 'Otro'
};

const TYPE_COLORS = {
  tarea: 'bg-blue-100 text-blue-700',
  proyecto: 'bg-purple-100 text-purple-700',
  examen: 'bg-red-100 text-red-700',
  participacion: 'bg-green-100 text-green-700',
  otro: 'bg-gray-100 text-gray-700'
};

const SUBJECT_COLORS = {
  tecnologia: 'border-l-blue-500',
  informatica: 'border-l-green-500'
};

const EvaluationCard = ({ evaluation, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: evaluation.name,
    weight: evaluation.weight,
    type: evaluation.type,
    maxScore: evaluation.maxScore || 20
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onUpdate(evaluation._id, {
        name: form.name.trim(),
        weight: parseFloat(form.weight) || 0,
        type: form.type,
        maxScore: parseFloat(form.maxScore) || 20
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: evaluation.name,
      weight: evaluation.weight,
      type: evaluation.type,
      maxScore: evaluation.maxScore || 20
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={`card p-3 border-l-4 ${SUBJECT_COLORS[evaluation.subject] || 'border-l-gray-300'}`}>
        <div className="space-y-2">
          <input
            className="input text-sm"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nombre de la evaluación"
            autoFocus
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select
                className="input text-sm"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ponderación %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                className="input text-sm"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nota máx.</label>
              <input
                type="number"
                min="1"
                max="100"
                className="input text-sm"
                value={form.maxScore}
                onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
              disabled={saving}
            >
              <X size={14} /> Cancelar
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-3 border-l-4 ${SUBJECT_COLORS[evaluation.subject] || 'border-l-gray-300'} group hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-800 truncate">{evaluation.name}</span>
            <span className={`badge ${TYPE_COLORS[evaluation.type] || TYPE_COLORS.otro}`}>
              {TYPE_LABELS[evaluation.type] || evaluation.type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Scale size={11} />
              Pond: {evaluation.weight}%
            </span>
            <span>Máx: {evaluation.maxScore || 20}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            onClick={() => setEditing(true)}
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            onClick={() => onDelete(evaluation._id)}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationCard;
