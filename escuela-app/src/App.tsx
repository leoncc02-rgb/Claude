import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Observations from './pages/Observations';
import Statistics from './pages/Statistics';
import Teachers from './pages/Teachers';
import Groups from './pages/Groups';
import StudentProfile from './pages/StudentProfile';
import Login from './pages/Login';

function AppContent() {
  const { auth, loading } = useApp();

  if (!auth) return <Login />;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500 text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/estudiantes" element={<Students />} />
          <Route path="/asistencia" element={<Attendance />} />
          <Route path="/valoraciones" element={<Grades />} />
          <Route path="/observaciones" element={<Observations />} />
          <Route path="/estadisticas" element={<Statistics />} />
          <Route path="/docentes" element={<Teachers />} />
          <Route path="/grupos" element={<Groups />} />
          <Route path="/estudiante/:id" element={<StudentProfile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
