import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import '../styles/UsuariosAdminPage.css';
import { User } from 'lucide-react';
import { Edit, Trash } from 'lucide-react';
function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    contraseña: '',
    rol: 'tecnico',
    telefono: '',
    rut: '',
    activo: true
  });
  const [editandoId, setEditandoId] = useState(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [correoConfirmacion, setCorreoConfirmacion] = useState('');
  const [filtro, setFiltro] = useState('');

  const formRef = useRef(null); // Referencia al formulario

  const fetchUsuarios = async () => {
    const token = localStorage.getItem('token');
    if (!token) return console.warn('No hay token disponible');

    try {
      const res = await fetch('http://localhost:3000/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Token no disponible');

    try {
      const url = editandoId
        ? `http://localhost:3000/api/usuarios/${editandoId}`
        : 'http://localhost:3000/api/usuarios';

      const method = editandoId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log('Respuesta del servidor:', data);

      await fetchUsuarios();
      setEditandoId(null);
      setFormData({
        nombre: '',
        apellido: '',
        correo: '',
        contraseña: '',
        rol: 'tecnico',
        telefono: '',
        rut: '',
        activo: true
      });
    } catch (err) {
      console.error('Error al guardar usuario', err);
    }
  };

const handleEditar = (usuario) => {
  setFormData({
    nombre: usuario.nombre,
    apellido: usuario.apellido || '',
    correo: usuario.correo,
    contraseña: '',
    rol: usuario.rol,
    telefono: usuario.telefono || '',
    rut: usuario.rut || '',
    activo:
      usuario?.activo === true ||
      usuario?.estado === true ||
      usuario?.estado === 'activo' ||
      usuario?.estado === 'true'
  });
  setEditandoId(usuario._id);

  setTimeout(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
};

  const handleEliminarClick = (usuario) => {
    setUsuarioAEliminar(usuario);
    setCorreoConfirmacion('');
  };

  const confirmarEliminacion = async () => {
    const token = localStorage.getItem('token');
    if (!usuarioAEliminar || correoConfirmacion !== usuarioAEliminar.correo || !token) {
      alert('El correo ingresado no coincide.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${usuarioAEliminar._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      console.log('Usuario eliminado:', data);
      await fetchUsuarios();
      setUsuarioAEliminar(null);
      setCorreoConfirmacion('');
    } catch (err) {
      console.error('Error al eliminar usuario', err);
    }
  };

  return (
    <BackgroundComponent header={<Header />} footer={<div />}>
      <div className="admin-container">
        <div className="admin-header">
          <div className="admin-header-icon">
            <User size={36} color="#185dc8" />
          </div>
          <div>
            <h1 className="admin-title">Administrar Usuarios</h1>
            <p className="admin-subtitle">Gestiona los usuarios del sistema de forma segura y eficiente</p>
          </div>
        </div>

        <h1 className="admin-title" style={{ marginBottom: '24px', textAlign: 'center' }}>
          {editandoId ? 'Editar Usuario' : 'Crear Usuario'}
        </h1>

        <form onSubmit={handleSubmit} className="user-form" ref={formRef}>
          <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleChange} required />
          <input type="text" name="apellido" placeholder="Apellido" value={formData.apellido} onChange={handleChange} />
          <input type="email" name="correo" placeholder="Correo" value={formData.correo} onChange={handleChange} required />
          <input type="password" name="contraseña" placeholder="Contraseña" value={formData.contraseña} onChange={handleChange} required={!editandoId} />
          <input type="text" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleChange} />
          <input type="text" name="rut" placeholder="RUT" value={formData.rut} onChange={handleChange} />
          <select name="rol" value={formData.rol} onChange={handleChange}>
            <option value="admin">Administrador</option>
            <option value="tecnico">Técnico</option>
          </select>
          <label>
          Activo:
          <input
            type="checkbox"
            name="activo"
            checked={Boolean(formData.activo)}
            onChange={(e) =>
              setFormData({ ...formData, activo: e.target.checked })
            }
          />
        </label>
          <button type="submit">{editandoId ? 'Actualizar Usuario' : 'Crear Usuario'}</button>
        </form>

        <h1 className="admin-title" style={{ margin: '32px 0 16px', textAlign: 'center' }}>
          Lista de Usuarios
        </h1>
        <div className="user-table-wrapper">
            {/* Input de búsqueda */}
        <input
          type="text"
          placeholder="Buscar por nombre, correo, rol..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="search-input"
        />


        </div>
              <table className="user-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios
              .filter((u) =>
                `${u.nombre} ${u.apellido} ${u.correo} ${u.rol} ${u.estado}`
                  .toLowerCase()
                  .includes(filtro.toLowerCase())
              )
              .map((u) => (
                <tr key={u._id}>
                  <td>{u.nombre} {u.apellido}</td>
                  <td>{u.correo}</td>
                  <td>{u.rol}</td>
                  <td>{u.estado}</td>
                  <td>
                    <button onClick={() => handleEditar(u)} className="icon-button">
                      <Edit color="#fff" />
                    </button>
                    <button onClick={() => handleEliminarClick(u)} className="icon-button">
                      <Trash color="#fff" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        

        {/* Modal de confirmación */}
        {usuarioAEliminar && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirmar eliminación</h3>
              <p>
                ¿Estás seguro de eliminar al usuario <b>{usuarioAEliminar.nombre}</b> con rol <b>{usuarioAEliminar.rol}</b>?<br />
                <br />
                Para confirmar, escribe su correo exacto: <br />
                <code>{usuarioAEliminar.correo}</code>
              </p>
              <input
                type="text"
                placeholder="Escribe el correo para confirmar"
                value={correoConfirmacion}
                onChange={(e) => setCorreoConfirmacion(e.target.value)}
              />
              <div className="modal-buttons">
                <button onClick={() => setUsuarioAEliminar(null)}>Cancelar</button>
                <button
                  onClick={confirmarEliminacion}
                  disabled={correoConfirmacion !== usuarioAEliminar.correo}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackgroundComponent>
  );
}

export default UsuariosAdminPage;
