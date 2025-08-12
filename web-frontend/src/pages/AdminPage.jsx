import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import { Users, FileText, Shield } from 'lucide-react';
import '../styles/AdminPage.css';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function AdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', rut: '', rol: 'tecnico', activo: true, contraseña: ''
  });

  const adminSections = [
    {
      id: 'usuarios',
      title: 'Administrar Usuarios',
      description: 'Gestionar cuentas de usuario, permisos y roles del sistema',
      icon: Users,
      colorClass: 'admin-section-blue',
    },
    {
      id: 'informes',
      title: 'Administrar Informes',
      description: 'Crear, editar y gestionar informes y reportes del sistema',
      icon: FileText,
      colorClass: 'admin-section-green',
    },
  ];

  useEffect(() => {
    (async () => {
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No hay token de autenticación');

        const headers = { Authorization: `Bearer ${token}` };

        const [uRes, iRes] = await Promise.all([
          fetch(`${API}/api/usuarios`, { headers }),
          fetch(`${API}/api/informes`, { headers }),
        ]);

        if (!uRes.ok) throw new Error('Error al cargar usuarios');
        if (!iRes.ok) throw new Error('Error al cargar informes');

        const uData = await uRes.json();
        const iData = await iRes.json();

        setUsuarios(uData.usuarios || []);
        setInformes(iData.informes || []);
      } catch (e) {
        setError(e.message || 'Error al cargar datos');
      }
    })();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const res = await fetch(`${API}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.mensaje || 'Error al crear usuario');

      setUsuarios((prev) => [...prev, data.usuario || { ...form, _id: data._id }]);
    } catch (e) {
      setError(e.message || 'Error al crear usuario');
    }
  };

  const handleSectionClick = (sectionId) => {
    navigate(`/admin/${sectionId}`);
  };

  return (
    <BackgroundComponent header={<Header />}>
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-icon">
            <Shield size={36} />
          </div>
          <div>
            <h1 className="admin-title">Panel Administrativo</h1>
            <p className="admin-subtitle">Centro de control y gestión del sistema</p>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-totals">
          <span>Total usuarios: <b>{usuarios.length}</b></span>
          <span style={{ marginLeft: 24 }}>Total informes: <b>{informes.length}</b></span>
        </div>

        <div className="admin-sections">
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div
                key={section.id}
                className={`admin-section-card ${section.colorClass}`}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="admin-section-icon">
                  <IconComponent size={32} />
                </div>
                <div className="admin-section-content">
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                  <button className="admin-section-btn">Acceder</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BackgroundComponent>
  );
}

export default AdminPage;
