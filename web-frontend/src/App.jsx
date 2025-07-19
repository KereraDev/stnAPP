import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import InformesPage from './pages/InformesPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import UsuariosAdminPage from './pages/UsuariosAdminPage';
import InformesAdminPage from './pages/InformesAdminPage';
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/informes" element={<InformesPage />}/>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/usuarios" element={<UsuariosAdminPage />} />
      <Route path="/admin/informes" element={<InformesAdminPage />} />
    </Routes>
  );
}

export default App;

