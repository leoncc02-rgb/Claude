import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen, MessageSquare,
  BarChart3, Menu, GraduationCap, UserCog, Layers, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/estudiantes', icon: Users, label: 'Estudiantes' },
  { path: '/asistencia', icon: CalendarCheck, label: 'Asistencia' },
  { path: '/valoraciones', icon: BookOpen, label: 'Valoraciones' },
  { path: '/observaciones', icon: MessageSquare, label: 'Observaciones' },
  { path: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
];

const adminItems = [
  { path: '/docentes', icon: UserCog, label: 'Docentes' },
  { path: '/grupos', icon: Layers, label: 'Grupos' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const location = useLocation();
  const { data, activeTeacherId, setActiveTeacherId } = useApp();

  const activeTeacher = data.teachers.find(t => t.id === activeTeacherId);
  const isAdminPath = adminItems.some(i => i.path === location.pathname);

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">EduControl</h1>
            <p className="text-xs text-gray-500">Gestión Escolar</p>
          </div>
        </div>

        {/* Teacher selector */}
        {data.teachers.length > 0 && (
          <div className="px-3 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-2 mb-1">Docente activo</p>
            <select
              value={activeTeacherId ?? ''}
              onChange={e => setActiveTeacherId(e.target.value || null)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            >
              <option value="">— Todos los docentes —</option>
              {data.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                {label}
              </Link>
            );
          })}

          {/* Admin section */}
          <div className="pt-2">
            <button
              onClick={() => setAdminOpen(o => !o)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                isAdminPath ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
            >
              <span>Administración</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminOpen || isAdminPath ? 'rotate-180' : ''}`} />
            </button>
            {(adminOpen || isAdminPath) && (
              <div className="mt-1 space-y-1">
                {adminItems.map(({ path, icon: Icon, label }) => {
                  const active = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {activeTeacher && (
          <div className="px-4 py-3 border-t border-gray-100 bg-blue-50">
            <p className="text-xs text-blue-600 font-medium">Viendo como:</p>
            <p className="text-sm text-blue-800 font-semibold truncate">{activeTeacher.name}</p>
          </div>
        )}
        <div className="px-6 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-400">© 2026 EduControl</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-900">EduControl</span>
          {activeTeacher && (
            <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium truncate max-w-[140px]">
              {activeTeacher.name}
            </span>
          )}
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
