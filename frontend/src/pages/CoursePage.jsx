import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, BarChart2, ClipboardList, MessageSquare,
  Pencil, Trash2, Check, X, Settings
} from 'lucide-react';
import { coursesApi } from '../api/courses';
import StudentsPage from './StudentsPage';
import GradesPage from './GradesPage';
import AttendancePage from './AttendancePage';
import ObservationsPage from './ObservationsPage';

const TABS = [
  { id: 'estudiantes', label: 'Estudiantes', icon: Users },
  { id: 'calificaciones', label: 'Calificaciones', icon: BarChart2 },
  { id: 'asistencia', label: 'Asistencia', icon: ClipboardList },
  { id: 'observaciones', label: 'Observaciones', icon: MessageSquare }
];

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('estudiantes');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadCourse = async () => {
    try {
      const data = await coursesApi.getOne(id);
      setCourse(data.data);
      setEditForm({
        name: data.data.name,
        grade: data.data.grade,
        section: data.data.section,
        period: data.data.period,
        year: data.data.year,
        description: data.data.description,
        color: data.data.color
      });
    } catch {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourse(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await coursesApi.update(id, editForm);
      setCourse(data.data);
      setEditMode(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este curso?')) return;
    try {
      await coursesApi.delete(id);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!course) return null;

  const bgColor = course.color || '#4F46E5';

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft size={16} /> Volver al Dashboard
      </Link>

      {/* Course header */}
      <div className="card p-5 mb-6" style={{ borderLeft: `4px solid ${bgColor}` }}>
        {editMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label text-xs">Nombre</label>
              <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Grado</label>
              <input className="input" value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Sección</label>
              <input className="input" value={editForm.section} onChange={e => setEditForm(f => ({ ...f, section: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Período</label>
              <input className="input" value={editForm.period} onChange={e => setEditForm(f => ({ ...f, period: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">Año</label>
              <input type="number" className="input" value={editForm.year} onChange={e => setEditForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label text-xs">Color</label>
              <input type="color" className="h-10 w-full rounded border border-gray-300" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)} disabled={saving}>
                <X size={14} /> Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="font-medium">{course.grade}</span>
                {course.section && <><span>·</span><span>{course.section}</span></>}
                {course.period && <><span>·</span><span>{course.period}</span></>}
                {course.year && <><span>·</span><span>{course.year}</span></>}
              </div>
              {course.description && <p className="text-sm text-gray-600 mt-2">{course.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <Users size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500">{course.studentCount || 0} estudiantes</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditMode(true)}
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                className="btn btn-sm text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200"
                onClick={handleDelete}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center
              ${activeTab === tabId
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }
            `}
            onClick={() => setActiveTab(tabId)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'estudiantes' && <StudentsPage courseId={id} course={course} onUpdate={loadCourse} />}
        {activeTab === 'calificaciones' && <GradesPage courseId={id} course={course} />}
        {activeTab === 'asistencia' && <AttendancePage courseId={id} course={course} />}
        {activeTab === 'observaciones' && <ObservationsPage courseId={id} course={course} />}
      </div>
    </div>
  );
};

export default CoursePage;
