import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import { Users, FileText, AlertTriangle, Shield } from 'lucide-react';
import '../styles/AdminPage.css';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [informes, setInformes] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Formulario para crear usuario (si lo usas)
  const [form, setForm] = useState({
    nombre: '', apellido: '', correo: '', telefono: '', rut: '', rol: 'tecnico', activo: true, contraseña: ''
  });

  // Secciones del panel administrativo
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
    {
      id: 'logs',
      title: 'Logs y Errores',
      description: 'Monitorear registros del sistema y gestionar errores',
      icon: AlertTriangle,
      colorClass: 'admin-section-yellow',
    }
  ];

  // Cargar usuarios e informes al montar el componente
  useEffect(() => {
    fetch('http://localhost:3000/api/usuarios', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setUsuarios(data.usuarios || []))
      .catch(() => setError('Error al cargar usuarios'));

    fetch('http://localhost:3000/api/informes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setInformes(data.informes || []))
      .catch(() => setError('Error al cargar informes'));
  }, []);

  // Crear usuario (si usas el formulario)
  const handleCrearUsuario = (e) => {
    e.preventDefault();
    fetch('http://localhost:3000/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        if (data.mensaje) {
          setUsuarios([...usuarios, { ...form, _id: data._id }]);
        }
      })
      .catch(() => setError('Error al crear usuario'));
  };

  // Navegación al hacer clic en cada sección
  const handleSectionClick = (sectionId) => {
    navigate(`/admin/${sectionId}`);
  };

  // Render principal
  return (
    <BackgroundComponent header={<Header />}>
      <div className="admin-container">
        {/* Encabezado del panel */}
        <div className="admin-header">
          <div className="admin-header-icon">
            <Shield size={36} color="#185dc8" />
          </div>
          <div>
            <h1 className="admin-title">Panel Administrativo</h1>
            <p className="admin-subtitle">Centro de control y gestión del sistema</p>
          </div>
        </div>
        {/* Totales */}
        <div className="admin-totals">
          <span>Total usuarios: <b>{usuarios.length}</b></span>
          <span style={{ marginLeft: 24 }}>Total informes: <b>{informes.length}</b></span>
        </div>
        {/* Secciones */}
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