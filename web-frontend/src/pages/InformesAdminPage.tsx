import React from 'react';
import Header from '../components/Header';
import BackgroundComponent from '../components/BackgroundComponent';
import InformesAdmin from '../components/InformesAdmin';
function InformesAdminPage() {
  return (
    <BackgroundComponent header={<Header />} footer={<div />}>
      <div className="admin-container">
        <InformesAdmin />
      </div>
    </BackgroundComponent>
  );
}
export default InformesAdminPage;