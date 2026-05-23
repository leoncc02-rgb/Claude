import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Observations from './pages/Observations';
import Statistics from './pages/Statistics';
import Teachers from './pages/Teachers';
import Groups from './pages/Groups';

function App() {
  return (
    <AppProvider>
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
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
