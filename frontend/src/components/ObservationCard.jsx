import React, { useState } from 'react';
import { Pin, Check, Trash2, Pencil, X, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Avatar from './Avatar';

const TYPE_CONFIG = {
  general: { label: 'General', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  personal: { label: 'Personal', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  pendiente: { label: 'Pendiente', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
  recordatorio: { label: 'Recordatorio', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  tarea: { label: 'Tarea', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' }
};

const ObservationCard = ({ observation, onUpdate, onDelete, onToggleResolved }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    content: observation.content,
    type: observation.type,
    isPrivate: observation.isPrivate,
    isPinned: observation.isPinned
  });
  const [saving, setSaving] = useState(false);

  const config = TYPE_CONFIG[observation.type] || TYPE_CONFIG.general;

  const handleSave = async () => {
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await onUpdate(observation._id, form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM 'a las' HH:mm", { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (editing) {
    return (
      <div className={`card p-4 border ${config.border} ${config.bg}`}>
        <div className="space-y-3">
          <textarea
            className="input text-sm resize-none"
            rows={3}
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            autoFocus
          />
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select
                className="input text-sm"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                className="rounded"
              />
              Privada
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                className="rounded"
              />
              Fijada
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setForm({ content: observation.content, type: observation.type, isPrivate: observation.isPrivate, isPinned: observation.isPinned }); setEditing(false); }}
              disabled={saving}
            >
              <X size={14} /> Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 border ${config.border} ${observation.isResolved ? 'opacity-60' : ''} ${observation.isPinned ? 'ring-1 ring-offset-1 ring-yellow-400' : ''} group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`badge ${config.badge}`}>{config.label}</span>
            {observation.isPrivate && (
              <span className="badge bg-gray-100 text-gray-600 text-xs">Privada</span>
            )}
            {observation.isPinned && (
              <span className="badge bg-yellow-100 text-yellow-700 text-xs">
                <Pin size={10} className="mr-1" />Fijada
              </span>
            )}
            {observation.isResolved && (
              <span className="badge bg-green-100 text-green-700 text-xs">Resuelta</span>
            )}
          </div>

          {observation.studentId && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar
                firstName={observation.studentId.firstName}
                lastName={observation.studentId.lastName}
                photo={observation.studentId.photo}
                size="xs"
              />
              <span className="text-xs text-gray-600">
                {observation.studentId.firstName} {observation.studentId.lastName}
              </span>
            </div>
          )}

          <p className={`text-sm text-gray-800 ${observation.isResolved ? 'line-through' : ''} whitespace-pre-wrap`}>
            {observation.content}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            {formatDate(observation.createdAt)}
          </p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            onClick={() => onToggleResolved(observation._id)}
            title={observation.isResolved ? 'Marcar pendiente' : 'Marcar resuelta'}
          >
            {observation.isResolved ? <Circle size={13} /> : <CheckCircle size={13} />}
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            onClick={() => setEditing(true)}
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            onClick={() => onDelete(observation._id)}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservationCard;
