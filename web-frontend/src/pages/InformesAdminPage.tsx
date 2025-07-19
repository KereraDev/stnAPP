import React from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';

function InformesAdminPage() {
  return (
    <BackgroundComponent header={<Header />} footer={<div />}>
      <div className="admin-container">
        <h2>Administrar Informes</h2>
        {/* Aquí va tu tabla, formulario, etc */}
        <p>Listado y gestión de informes aquí...</p>
      </div>
    </BackgroundComponent>
  );
}
export default InformesAdminPage;