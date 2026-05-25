import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Plus, TrendingUp, Calendar, ChevronRight, GraduationCap } from 'lucide-react';
import { coursesApi } from '../api/courses';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CourseCard = ({ course }) => {
  const bgColor = course.color || '#4F46E5';
  return (
    <Link
      to={`/cursos/${course._id}`}
      className="card p-5 hover:shadow-md transition-all group flex flex-col gap-4 border border-transparent hover:border-blue-100"
    >
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${bgColor}20` }}
        >
          <BookOpen size={22} style={{ color: bgColor }} />
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-base leading-tight">{course.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {course.grade}{course.section ? ` - ${course.section}` : ''}
          {course.period ? ` · ${course.period}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users size={14} />
        <span>{course.studentCount || 0} estudiantes</span>
        {course.year && (
          <>
            <span className="text-gray-300">·</span>
            <Calendar size={14} />
            <span>{course.year}</span>
          </>
        )}
      </div>
    </Link>
  );
};

const DashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '', section: '', period: '', year: new Date().getFullYear(), color: '#4F46E5' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const loadCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setCourses(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.grade) { setError('Nombre y grado son obligatorios'); return; }
    setCreating(true);
    setError('');
    try {
      await coursesApi.create(form);
      setShowNewCourse(false);
      setForm({ name: '', grade: '', section: '', period: '', year: new Date().getFullYear(), color: '#4F46E5' });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const today = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{courses.length}</div>
            <div className="text-xs text-gray-500">Cursos activos</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Users size={18} className="text-green-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">
              {courses.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
            </div>
            <div className="text-xs text-gray-500">Total estudiantes</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <GraduationCap size={18} className="text-purple-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{user?.school ? 1 : 0}</div>
            <div className="text-xs text-gray-500">Institución</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <TrendingUp size={18} className="text-orange-600" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{new Date().getFullYear()}</div>
            <div className="text-xs text-gray-500">Año escolar</div>
          </div>
        </div>
      </div>

      {/* Courses section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Mis Cursos</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowNewCourse(true)}
        >
          <Plus size={16} /> Nuevo Curso
        </button>
      </div>

      {/* New course form */}
      {showNewCourse && (
        <div className="card p-5 mb-4 border-2 border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" /> Crear Nuevo Curso
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre del curso *</label>
              <input className="input" placeholder="Tecnología e Informática" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Grado *</label>
              <input className="input" placeholder="5° Grado" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Sección</label>
              <input className="input" placeholder="A, B, C..." value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} />
            </div>
            <div>
              <label className="label">Período / Bimestre</label>
              <input className="input" placeholder="1er Bimestre 2025" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} />
            </div>
            <div>
              <label className="label">Año</label>
              <input type="number" className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-16 rounded border border-gray-300 cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                <span className="text-sm text-gray-500">{form.color}</span>
              </div>
            </div>
            {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowNewCourse(false); setError(''); }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creando...' : 'Crear Curso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses grid */}
      {courses.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes cursos aún</h3>
          <p className="text-gray-400 text-sm mb-4">Crea tu primer curso para comenzar</p>
          <button className="btn btn-primary" onClick={() => setShowNewCourse(true)}>
            <Plus size={16} /> Crear primer curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
