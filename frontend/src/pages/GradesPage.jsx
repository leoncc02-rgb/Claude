import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, BookOpen, Cpu, RefreshCw } from 'lucide-react';
import { evaluationsApi } from '../api/evaluations';
import { gradesApi } from '../api/grades';
import EvaluationCard from '../components/EvaluationCard';
import GradeTable from '../components/GradeTable';

const SUBJECTS = [
  { id: 'tecnologia', label: 'Tecnología', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'informatica', label: 'Informática', icon: Cpu, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
];

const NewEvalForm = ({ courseId, subject, onSave, onCancel }) => {
  const [form, setForm] = useState({ name: '', type: 'otro', weight: 10, maxScore: 20 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      await evaluationsApi.create({
        courseId,
        subject,
        name: form.name.trim(),
        type: form.type,
        weight: parseFloat(form.weight) || 0,
        maxScore: parseFloat(form.maxScore) || 20
      });
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-3 border-2 border-dashed border-blue-200 mt-2">
      <div className="space-y-2">
        <input className="input text-sm" placeholder="Nombre de la evaluación" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
            <select className="input text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="tarea">Tarea</option>
              <option value="proyecto">Proyecto</option>
              <option value="examen">Examen</option>
              <option value="participacion">Participación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ponderación %</label>
            <input type="number" min="0" max="100" step="0.5" className="input text-sm" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nota máx.</label>
            <input type="number" min="1" className="input text-sm" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))} />
          </div>
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Evaluación'}
          </button>
        </div>
      </div>
    </form>
  );
};

const GradesPage = ({ courseId, course }) => {
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('tecnologia');
  const [showNewEval, setShowNewEval] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingGrades, setPendingGrades] = useState({});
  const [saveStatus, setSaveStatus] = useState('');

  const loadGrades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gradesApi.getAll({ courseId });
      setGradesData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  const handleUpdateEval = async (evalId, updates) => {
    await evaluationsApi.update(evalId, updates);
    await loadGrades();
  };

  const handleDeleteEval = async (evalId) => {
    if (!window.confirm('¿Eliminar esta evaluación y todas sus calificaciones?')) return;
    await evaluationsApi.delete(evalId);
    await loadGrades();
  };

  const handleGradeChange = useCallback((studentId, evaluationId, gradeCourseId, score) => {
    const key = `${studentId}__${evaluationId}`;
    setPendingGrades(prev => ({ ...prev, [key]: { studentId, evaluationId, courseId: gradeCourseId || courseId, score } }));
  }, [courseId]);

  // Auto-save pending grades after 800ms of inactivity
  useEffect(() => {
    if (Object.keys(pendingGrades).length === 0) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      setSaveStatus('Guardando...');
      try {
        const grades = Object.values(pendingGrades);
        await gradesApi.bulkUpsert(grades);
        setPendingGrades({});
        setSaveStatus('Guardado ✓');
        // Reload grades to update averages
        const data = await gradesApi.getAll({ courseId });
        setGradesData(data.data);
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus('Error al guardar');
        setTimeout(() => setSaveStatus(''), 3000);
      } finally {
        setSaving(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingGrades, courseId]);

  const handleEvalSaved = async () => {
    setShowNewEval(false);
    await loadGrades();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const { evaluations = [], studentGrades = [], evalStats = {} } = gradesData || {};

  return (
    <div>
      {/* Subject tabs */}
      <div className="flex gap-2 mb-6">
        {SUBJECTS.map(({ id, label, icon: Icon, color, bg, border }) => (
          <button
            key={id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              activeSubject === id
                ? `${bg} ${color} ${border} shadow-sm`
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => { setActiveSubject(id); setShowNewEval(false); }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        {saveStatus && (
          <div className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 px-3">
            {saving && <RefreshCw size={13} className="animate-spin" />}
            {saveStatus}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Evaluations panel */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">
                Evaluaciones
              </h3>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowNewEval(v => !v)}
              >
                <Plus size={13} />
              </button>
            </div>

            {showNewEval && (
              <NewEvalForm
                courseId={courseId}
                subject={activeSubject}
                onSave={handleEvalSaved}
                onCancel={() => setShowNewEval(false)}
              />
            )}

            <div className="space-y-2 mt-2">
              {evaluations.filter(e => e.subject === activeSubject).length === 0 && !showNewEval ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  Sin evaluaciones. Añade una.
                </p>
              ) : (
                evaluations
                  .filter(e => e.subject === activeSubject)
                  .map(ev => (
                    <EvaluationCard
                      key={ev._id}
                      evaluation={ev}
                      onUpdate={handleUpdateEval}
                      onDelete={handleDeleteEval}
                    />
                  ))
              )}
            </div>

            {/* Weight summary */}
            {evaluations.filter(e => e.subject === activeSubject).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ponderación total:</span>
                  <span className={`font-semibold ${
                    evaluations.filter(e => e.subject === activeSubject).reduce((a, e) => a + e.weight, 0) === 100
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}>
                    {evaluations.filter(e => e.subject === activeSubject).reduce((a, e) => a + e.weight, 0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grade table */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">
                Registro de Notas — {SUBJECTS.find(s => s.id === activeSubject)?.label}
              </h3>
              {studentGrades.length > 0 && (
                <span className="text-xs text-gray-400">{studentGrades.length} estudiantes</span>
              )}
            </div>
            {studentGrades.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No hay estudiantes en este curso</p>
              </div>
            ) : (
              <GradeTable
                evaluations={evaluations}
                studentGrades={studentGrades}
                onGradeChange={handleGradeChange}
                subject={activeSubject}
              />
            )}
          </div>

          {/* Class stats */}
          {evaluations.filter(e => e.subject === activeSubject).length > 0 && studentGrades.length > 0 && (
            <div className="mt-4 card p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas por evaluación</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="text-left py-1.5 pr-4">Evaluación</th>
                      <th className="text-center px-2">Promedio</th>
                      <th className="text-center px-2">Máximo</th>
                      <th className="text-center px-2">Mínimo</th>
                      <th className="text-center px-2">Calificados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluations.filter(e => e.subject === activeSubject).map(ev => {
                      const stats = evalStats[ev._id] || {};
                      return (
                        <tr key={ev._id} className="border-b border-gray-50">
                          <td className="py-1.5 pr-4 text-gray-700">{ev.name}</td>
                          <td className="py-1.5 px-2 text-center font-medium">{stats.avg ?? '-'}</td>
                          <td className="py-1.5 px-2 text-center text-green-600">{stats.max ?? '-'}</td>
                          <td className="py-1.5 px-2 text-center text-red-600">{stats.min ?? '-'}</td>
                          <td className="py-1.5 px-2 text-center text-gray-400">{stats.count ?? 0}/{studentGrades.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradesPage;
