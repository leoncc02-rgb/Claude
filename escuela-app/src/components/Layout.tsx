import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen, MessageSquare, BarChart3, Menu, GraduationCap
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Panel Principal' },
  { path: '/estudiantes', icon: Users, label: 'Estudiantes' },
  { path: '/asistencia', icon: CalendarCheck, label: 'Asistencia' },
  { path: '/valoraciones', icon: BookOpen, label: 'Valoraciones' },
  { path: '/observaciones', icon: MessageSquare, label: 'Observaciones' },
  { path: '/estadisticas', icon: BarChart3, label: 'Estadísticas' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
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

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">© 2026 EduControl</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-900">EduControl</span>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
