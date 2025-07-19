import React from 'react';
import '../styles/BackgroundComponent.css';

function BackgroundComponent({ children, header, footer }) {
  return (
    <div className="background-main">
      {header && <header>{header}</header>}
      <main className="background-center-content">
        {children}
      </main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

export default BackgroundComponent;
