import React, { useEffect, useState } from 'react';
import {
  Plus, Search, X, Pencil, Trash2, UserPlus, Camera, Check,
  ChevronUp, ChevronDown, Filter
} from 'lucide-react';
import { studentsApi } from '../api/students';
import Avatar from '../components/Avatar';

const GENDER_LABELS = { M: 'Masculino', F: 'Femenino' };

const StudentForm = ({ student, courseId, onSave, onCancel }) => {
  const [form, setForm] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    gender: student?.gender || 'M',
    photo: student?.photo || '',
    seatNumber: student?.seatNumber || '',
    email: student?.email || '',
    phone: student?.phone || '',
    parentName: student?.parentName || '',
    parentPhone: student?.parentPhone || '',
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
    notes: student?.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.gender) {
      setError('Nombre, apellido y género son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        seatNumber: form.seatNumber ? parseInt(form.seatNumber) : null,
        photo: form.photo || null,
        courseId: student ? undefined : courseId
      };
      if (student) {
        await studentsApi.update(student._id, payload);
      } else {
        await studentsApi.create(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 mb-4 border-2 border-blue-200">
      <h3 className="font-semibold text-gray-800 mb-4">
        {student ? 'Editar Estudiante' : 'Añadir Estudiante'}
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre *</label>
          <input className="input" placeholder="Nombre" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Apellido *</label>
          <input className="input" placeholder="Apellido" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Género *</label>
          <select className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} required>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div>
          <label className="label">N° de Lista</label>
          <input type="number" min="1" className="input" placeholder="1" value={form.seatNumber} onChange={e => setForm(f => ({ ...f, seatNumber: e.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Foto (URL)</label>
          <div className="flex gap-3 items-center">
            {form.photo ? (
              <Avatar firstName={form.firstName} lastName={form.lastName} photo={form.photo} size="lg" />
            ) : (
              <Avatar firstName={form.firstName} lastName={form.lastName} size="lg" />
            )}
            <input
              className="input flex-1"
              placeholder="https://... o base64"
              value={form.photo}
              onChange={e => setForm(f => ({ ...f, photo: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Correo</label>
          <input type="email" className="input" placeholder="estudiante@mail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" placeholder="999 999 999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div>
          <label className="label">Apoderado</label>
          <input className="input" placeholder="Nombre del apoderado" value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} />
        </div>
        <div>
          <label className="label">Tel. Apoderado</label>
          <input className="input" placeholder="999 999 999" value={form.parentPhone} onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
        </div>
        <div>
          <label className="label">Fecha de Nacimiento</label>
          <input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
        </div>
        <div>
          <label className="label">Notas</label>
          <input className="input" placeholder="Observaciones adicionales" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
        {error && <div className="md:col-span-2 text-red-600 text-sm">{error}</div>}
        <div className="md:col-span-2 flex gap-3 justify-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : (student ? 'Guardar Cambios' : 'Añadir Estudiante')}
          </button>
        </div>
      </form>
    </div>
  );
};

const StudentsPage = ({ courseId, course, onUpdate }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [sortBy, setSortBy] = useState('seatNumber');
  const [sortDir, setSortDir] = useState('asc');

  const loadStudents = async () => {
    try {
      const data = await studentsApi.getAll({ courseId, search, gender: genderFilter });
      setStudents(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadStudents();
  }, [courseId, search, genderFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este estudiante?')) return;
    try {
      await studentsApi.delete(id);
      await loadStudents();
      onUpdate?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaved = async () => {
    setShowForm(false);
    setEditStudent(null);
    setLoading(true);
    await loadStudents();
    onUpdate?.();
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (va === null || va === undefined) va = sortDir === 'asc' ? Infinity : -Infinity;
    if (vb === null || vb === undefined) vb = sortDir === 'asc' ? Infinity : -Infinity;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-gray-300">
      {sortBy === field ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronUp size={12} />}
    </span>
  );

  if (showForm || editStudent) {
    return (
      <StudentForm
        student={editStudent}
        courseId={courseId}
        onSave={handleSaved}
        onCancel={() => { setShowForm(false); setEditStudent(null); }}
      />
    );
  }

  return (
    <div>
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar estudiante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <select
          className="input w-auto"
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="M">Niños</option>
          <option value="F">Niñas</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
          <UserPlus size={16} /> Añadir Estudiante
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4 text-sm text-gray-600">
        <span>Total: <strong>{students.length}</strong></span>
        <span>Niños: <strong>{students.filter(s => s.gender === 'M').length}</strong></span>
        <span>Niñas: <strong>{students.filter(s => s.gender === 'F').length}</strong></span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 mb-3">
            {search ? 'No se encontraron estudiantes' : 'No hay estudiantes en este curso'}
          </p>
          {!search && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Añadir primer estudiante
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('seatNumber')}>
                    <span className="flex items-center">N° <SortIcon field="seatNumber" /></span>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => toggleSort('lastName')}>
                    <span className="flex items-center">Estudiante <SortIcon field="lastName" /></span>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Género</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 hidden md:table-cell">Contacto</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 hidden lg:table-cell">Apoderado</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedStudents.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {student.seatNumber || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={student.firstName}
                          lastName={student.lastName}
                          photo={student.photo}
                          size="md"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.lastName}, {student.firstName}
                          </div>
                          {student.email && (
                            <div className="text-xs text-gray-400">{student.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${student.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {student.gender === 'M' ? 'Niño' : 'Niña'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden md:table-cell">
                      {student.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden lg:table-cell">
                      {student.parentName || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          onClick={() => setEditStudent(student)}
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={() => handleDelete(student._id)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
