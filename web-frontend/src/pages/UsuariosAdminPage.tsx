import React from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';

function UsuariosAdminPage() {
  return (
    <BackgroundComponent header={<Header />} footer={<div />}>
      <div className="admin-container">
        <h2>Administrar Usuarios</h2>
        {/* Aquí va tu tabla, formulario, etc */}
        <p>Listado y gestión de usuarios aquí...</p>
      </div>
    </BackgroundComponent>
  );
}
export default UsuariosAdminPage;