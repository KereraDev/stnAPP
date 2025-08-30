import React, { useState, useRef } from 'react';
import LoginForm from '../components/LoginForm';
import { login } from '../services/authService';
import { getErrorMessage } from '../utils/errorMessages';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  const handleLogin = async (credenciales) => {
    try {
      const response = await login(credenciales);
      localStorage.setItem('token', response.token);
      localStorage.setItem('userName', response.usuario.nombre);
      navigate('/dashboard');
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  return (
      <div className="login-background">
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
          {/* Login Card */}
          <div
            className="login-card"
            ref={cardRef}
          >
            <div className="login-title">Iniciar Sesión</div>
            {error && <div className="login-error">{error}</div>}
            <LoginForm onLogin={handleLogin} />
          </div>
        </div>
      </div>
  );
}

export default LoginPage;